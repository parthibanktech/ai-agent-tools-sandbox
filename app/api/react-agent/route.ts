import OpenAI from "openai";

function safeEval(expression: string): number {
  const sanitized = expression.replace(/[^0-9+\-*/().\s%]/g, "");
  const result = new Function(`"use strict"; return (${sanitized})`)() as number;
  if (typeof result !== "number" || !isFinite(result)) throw new Error("Invalid");
  return result;
}

async function searchWikipedia(query: string): Promise<string> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "AgentLab/1.0" } });
  if (!res.ok) return `No Wikipedia article found for: ${query}`;
  const data = await res.json() as { extract?: string; title?: string };
  return data.extract ? `${data.title}: ${data.extract.substring(0, 600)}` : "No summary available";
}

async function searchWeb(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey || tavilyKey === "your-key-here") {
    return `[Web search not configured — Tavily API key missing. If this were configured, I would search for: "${query}"]`;
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: tavilyKey, query, max_results: 3 }),
  });
  if (!res.ok) return `Search failed: ${res.statusText}`;
  const data = await res.json() as { results?: Array<{ content: string }> };
  const results = data.results?.slice(0, 3).map((r) => r.content).join("\n\n") || "No results";
  return results.substring(0, 800);
}

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluates mathematical expressions precisely. Use for any arithmetic or math.",
      parameters: {
        type: "object",
        properties: { expression: { type: "string", description: "The math expression to evaluate" } },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wikipedia",
      description: "Fetches information from Wikipedia. Use for facts, history, definitions.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Topic to look up on Wikipedia" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Searches the web for current events and real-time information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query" } },
        required: ["query"],
      },
    },
  },
];

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return new Response(
      `data: ${JSON.stringify({ type: "error", content: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" })}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
    );
  }

  const { query } = await request.json() as { query: string };
  const client = new OpenAI({ apiKey });

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
            const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;

            send({ type: "action", tool: toolName, input: toolArgs });

            let result = "";
            try {
              if (toolName === "calculator") {
                const num = safeEval(toolArgs.expression);
                result = `${num.toLocaleString()}`;
              } else if (toolName === "wikipedia") {
                result = await searchWikipedia(toolArgs.query);
              } else if (toolName === "web_search") {
                result = await searchWeb(toolArgs.query);
              }
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
