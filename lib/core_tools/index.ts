import OpenAI from "openai";
import { safeEval } from "./calculator";
import { searchWikipedia } from "./wikipedia";
import { searchWeb } from "./webSearch";

export const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
    {
        type: "function",
        function: { name: "calculator", description: "Evaluates exact integers", parameters: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"] } }
    },
    {
        type: "function",
        function: { name: "wikipedia", description: "Search Wiki", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }
    },
    {
        type: "function",
        function: { name: "web_search", description: "Search Web", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }
    }
];

export async function executeTool(toolUsed: string, toolInput: Record<string, string>): Promise<string> {
    switch (toolUsed) {
        case "calculator": return String(safeEval(toolInput.expression || ""));
        case "wikipedia": return await searchWikipedia(toolInput.query);
        case "web_search": return await searchWeb(toolInput.query);
        default: return "Unknown tool";
    }
}
