/**
 * Safely evaluates a basic mathematical expression.
 */
export function safeEval(expression: string): number {
    const sanitized = expression.replace(/[^0-9+\-*/().\s%]/g, "");
    const result = new Function(`"use strict"; return (${sanitized})`)() as number;
    if (typeof result !== "number" || !isFinite(result)) {
        throw new Error("Invalid mathematical expression or result.");
    }
    return result;
}
