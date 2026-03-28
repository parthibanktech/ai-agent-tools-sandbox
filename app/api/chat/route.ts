import { getOpenAIClient } from "../../../lib/openai";

export async function POST(request: Request) {
  let client;
  try {
    client = getOpenAIClient();
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }

  const { messages } = await request.json();

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      ...messages,
    ],
    stream: true,
    stream_options: { include_usage: true },
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
          }
          if (chunk.usage) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "usage", usage: chunk.usage })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
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
