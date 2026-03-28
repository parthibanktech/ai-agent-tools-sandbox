/**
 * Wikipedia lookup tool
 */
export async function searchWikipedia(query: string): Promise<string> {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { "User-Agent": "AgentLab/1.0" } });
        if (!res.ok) return `No article found`;
        const data = (await res.json()) as { extract?: string; title?: string };
        return data.extract ? `${data.title}: ${data.extract}` : "No summary";
    } catch { return "Error"; }
}
