import { getOpenAIClient } from "../../../lib/openai";
import { safeEval } from "../../../lib/core_tools/calculator";
import OpenAI from "openai";

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluates mathematical expressions precisely.",
      parameters: {
        type: "object",
        properties: { expression: { type: "string" } },
        required: ["expression"],
      },
    },
  },
];

export async function POST(request: Request) {
  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch (error) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", content: (error as Error).message })}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`,
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
        { role: "system", content: "You are a helpful assistant. Use the calculator tool for math." },
        { role: "user", content: query },
      ];

      let iteration = 0;
      const maxIterations = 5;

      try {
        // Simulate graph: START -> LLM Node
        send({ type: "node", node: "start", status: "complete", log: "Graph initialized" });
        await delay(600);

        while (iteration < maxIterations) {
          iteration++;

          // LLM Node active
          send({ type: "node", node: "llm", status: "active", log: `LLM processing... (iteration ${iteration})` });
          await delay(800);

          const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            tools: TOOLS,
            tool_choice: "auto",
          });

          const message = response.choices[0].message;
          send({ type: "node", node: "llm", status: "complete", log: message.content || "LLM responded" });
          await delay(400);

          if (!message.tool_calls || message.tool_calls.length === 0) {
            // Condition: has_answer -> END
            send({ type: "edge", from: "llm", to: "end", condition: "has_answer" });
            await delay(500);
            send({ type: "node", node: "end", status: "complete", log: "Done!" });
            send({ type: "answer", content: message.content || "Complete." });
            break;
          }

          // Condition: needs_tool -> Tools Node
          send({ type: "edge", from: "llm", to: "tools", condition: "needs_tool" });
          await delay(400);

          messages.push(message);

          for (const toolCall of message.tool_calls) {
            if (toolCall.type !== "function") continue;

            let toolArgs: Record<string, string>;
            try {
              toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;
            } catch {
              toolArgs = {};
            }

            send({
              type: "node",
              node: "tools",
              status: "active",
              log: `Calling ${toolCall.function.name}(${JSON.stringify(toolArgs)})`,
            });
            await delay(600);

            let result = "";
            try {
              if (toolCall.function.name === "calculator") {
                result = String(safeEval(toolArgs.expression));
              }
            } catch {
              result = "Error";
            }

            send({ type: "node", node: "tools", status: "complete", log: `Result: ${result}` });
            await delay(300);

            messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
          }

          // Edge back to LLM
          send({ type: "edge", from: "tools", to: "llm", condition: "loop_back" });
          await delay(400);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
