import { getOpenAIClient } from "../../../lib/openai";
import { executeTool, TOOLS } from "../../../lib/core_tools";
import OpenAI from "openai";

export async function POST(request: Request) {
  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch (error) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", content: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" })}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
    );
  }

  const { query } = (await request.json()) as { query: string };
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are a ReAct agent. Reason step by step. Use tools when needed. When you have enough information, provide a final comprehensive answer. Be thorough but concise.`,
        },
        { role: "user", content: query },
      ];

      let loopCount = 0;
      const maxLoops = 6;

      try {
        while (loopCount < maxLoops) {
          loopCount++;
          send({ type: "loop", loop: loopCount });

          const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            tools: TOOLS,
            tool_choice: "auto",
          });

          const message = response.choices[0].message;

          // Emit thought if there's content
          if (message.content && message.content.trim()) {
            send({ type: "thought", content: message.content });
          }

          // Check if we need to call tools
          if (!message.tool_calls || message.tool_calls.length === 0) {
            // No more tool calls — this is the final answer
            send({ type: "answer", content: message.content || "Task complete." });
            break;
          }

          // Process each tool call
          messages.push(message);

          for (const toolCall of message.tool_calls) {
            if (toolCall.type !== "function") continue;
            const toolName = toolCall.function.name;
            let toolArgs: Record<string, string>;

            try {
              toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;
            } catch {
              toolArgs = {};
            }

            send({ type: "action", tool: toolName, input: toolArgs });

            let result = "";
            try {
              // Execute securely using our mapped tools directory
              result = await executeTool(toolName, toolArgs);
            } catch (err) {
              result = `Error: ${err instanceof Error ? err.message : "Tool execution failed"}`;
            }

            send({ type: "observation", tool: toolName, result });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }
        }

        send({ type: "done" });
        controller.close();
      } catch (err) {
        send({ type: "error", content: err instanceof Error ? err.message : "Unknown error" });
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
