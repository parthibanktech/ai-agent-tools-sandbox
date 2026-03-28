/**
 * Searches the web using Tavily.
 */
export async function searchWeb(query: string): Promise<string> {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey || tavilyKey === "your-key-here") return `[No API Key] Query: ${query}`;
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: tavilyKey, query, max_results: 3 }),
        });
        if (!res.ok) return `Search failed`;
        const data = await res.json() as { results?: Array<{ content: string }> };
        return data.results?.map(r => r.content).join("\n\n").substring(0, 800) || "Empty";
    } catch { return "Error"; }
}
