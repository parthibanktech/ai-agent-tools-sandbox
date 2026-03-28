import { getOpenAIClient } from "../../../lib/openai";
import { safeEval } from "../../../lib/core_tools/calculator";
import OpenAI from "openai";

export async function POST(request: Request) {
  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const { question } = await request.json();

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "calculator",
        description: "Evaluates mathematical expressions precisely",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "The mathematical expression to evaluate, e.g. '9847 * 3291'",
            },
          },
          required: ["expression"],
        },
      },
    },
  ];

  const steps: Array<{ step: number; type: string; content: string; data?: unknown }> = [];

  // Step 1: LLM receives question
  steps.push({ step: 1, type: "receive", content: question });

  // Step 2: LLM decides to use tool
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: question }],
    tools,
    tool_choice: "auto",
  });

  const message = response.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.type !== "function") {
      return Response.json({ steps: [{ step: 1, type: "error", content: "Unexpected tool type" }] });
    }
    const args = JSON.parse(toolCall.function.arguments) as { expression: string };

    steps.push({
      step: 2,
      type: "decision",
      content: message.content || "I should use the calculator for precise math",
    });

    steps.push({
      step: 3,
      type: "tool_call",
      content: `calculator({ expression: "${args.expression}" })`,
      data: { name: "calculator", arguments: args },
    });

    // Execute the tool
    let result: string | number;
    try {
      result = safeEval(args.expression);
      steps.push({
        step: 4,
        type: "tool_result",
        content: `Result: ${result.toLocaleString()}`,
        data: { result },
      });
    } catch {
      result = "Error calculating expression";
      steps.push({ step: 4, type: "tool_result", content: result });
    }

    // Get final answer
    const finalResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: question },
        message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: String(result),
        },
      ],
    });

    steps.push({
      step: 5,
      type: "answer",
      content: finalResponse.choices[0].message.content || "Calculation complete.",
    });
  } else {
    steps.push({
      step: 2,
      type: "answer",
      content: message.content || "I cannot answer this.",
    });
  }

  return Response.json({ steps });
}
