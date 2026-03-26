import OpenAI from "openai";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return Response.json({ error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" }, { status: 500 });
  }

  const { messages } = await request.json();

  const client = new OpenAI({ apiKey });

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
