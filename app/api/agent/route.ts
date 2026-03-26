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
  return data.extract ? `${data.title}: ${data.extract.substring(0, 500)}` : "No summary available";
}

async function searchWeb(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey || tavilyKey === "your-key-here") {
    return `[Web search not configured. Tavily API key missing. Query was: "${query}"]`;
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: tavilyKey, query, max_results: 3 }),
  });
  if (!res.ok) return `Search failed: ${res.statusText}`;
  const data = await res.json() as { results?: Array<{ content: string; url: string }> };
  const results = data.results?.slice(0, 3).map((r) => r.content).join("\n\n") || "No results";
  return results.substring(0, 800);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const { query } = await request.json();
  const client = new OpenAI({ apiKey });

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "calculator",
        description: "Evaluates mathematical expressions. Use for any precise calculations.",
        parameters: {
          type: "object",
          properties: { expression: { type: "string", description: "Math expression" } },
          required: ["expression"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "wikipedia",
        description: "Looks up facts, history, definitions from Wikipedia. Use for factual knowledge.",
        parameters: {
          type: "object",
          properties: { query: { type: "string", description: "Topic to look up" } },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "web_search",
        description: "Searches the web for current events and recent information. Use for news and real-time data.",
        parameters: {
          type: "object",
          properties: { query: { type: "string", description: "Search query" } },
          required: ["query"],
        },
      },
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Choose the most appropriate tool for each query. Always explain your reasoning briefly.",
      },
      { role: "user", content: query },
    ],
    tools,
    tool_choice: "auto",
  });

  const message = response.choices[0].message;
  let toolUsed: string | null = null;
  let toolInput: Record<string, string> | null = null;
  let toolResult: string | null = null;
  let finalAnswer: string | null = null;
  let reasoning: string | null = null;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.type !== "function") {
      return Response.json({ error: "Unexpected tool call type" }, { status: 500 });
    }
    toolUsed = toolCall.function.name;
    toolInput = JSON.parse(toolCall.function.arguments) as Record<string, string>;
    reasoning = message.content || `I chose ${toolUsed} because it's the best tool for this query.`;

    if (toolUsed === "calculator") {
      toolResult = String(safeEval(toolInput.expression));
    } else if (toolUsed === "wikipedia") {
      toolResult = await searchWikipedia(toolInput.query);
    } else if (toolUsed === "web_search") {
      toolResult = await searchWeb(toolInput.query);
    }

    const finalResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: query },
        message,
        { role: "tool", tool_call_id: toolCall.id, content: toolResult || "" },
      ],
    });
    finalAnswer = finalResponse.choices[0].message.content;
  } else {
    finalAnswer = message.content;
  }

  return Response.json({
    toolUsed,
    toolInput,
    toolResult,
    reasoning,
    finalAnswer,
  });
}
