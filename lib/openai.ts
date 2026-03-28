import OpenAI from "openai";

/**
 * Optimize by caching the client globally in Node.js environments.
 * This prevents creating multiple instances of the OpenAI client
 * during Next.js Hot Module Replacement (HMR) in development.
 */
const globalForOpenAI = globalThis as unknown as {
    openAiClient: OpenAI | undefined;
};

export function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your-key-here") {
        throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.");
    }

    if (!globalForOpenAI.openAiClient) {
        globalForOpenAI.openAiClient = new OpenAI({
            apiKey,
            // We can also override connection pooling or timeout settings here if needed
            maxRetries: 3,
            timeout: 30000
        });
    }

    return globalForOpenAI.openAiClient;
}
