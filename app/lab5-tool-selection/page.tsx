"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Calculator, BookOpen, Globe } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface AgentResult {
  toolUsed: string | null;
  toolInput: Record<string, string> | null;
  toolResult: string | null;
  reasoning: string | null;
  finalAnswer: string | null;
}

interface ToolCounters {
  calculator: number;
  wikipedia: number;
  web_search: number;
}

const SUGGESTED_QUERIES = [
  { text: "What is 15% tip on a $847 bill?", expectedTool: "calculator" },
  { text: "Who invented the telephone?", expectedTool: "wikipedia" },
  { text: "What AI news happened this week?", expectedTool: "web_search" },
  { text: "What is 2 to the power of 32?", expectedTool: "calculator" },
  { text: "What year did World War 2 end?", expectedTool: "wikipedia" },
];

const TOOLS = [
  {
    id: "calculator",
    name: "Calculator",
    icon: Calculator,
    color: "from-blue-600 to-blue-700",
    description: "Precise math & calculations",
    examples: "15% of $847, 2^32",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: BookOpen,
    color: "from-green-600 to-green-700",
    description: "Facts & history & definitions",
    examples: "Who invented X, year of Y",
  },
  {
    id: "web_search",
    name: "Web Search",
    icon: Globe,
    color: "from-purple-600 to-purple-700",
    description: "Current events & real-time info",
    examples: "Latest news, recent events",
  },
];

export default function Lab5() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [counters, setCounters] = useState<ToolCounters>({ calculator: 0, wikipedia: 0, web_search: 0 });
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const runQuery = async (q?: string) => {
    const text = q || query.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setActiveAnimation(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json() as AgentResult;
      setResult(data);

      if (data.toolUsed) {
        setActiveAnimation(data.toolUsed);
        setCounters((prev) => ({
          ...prev,
          [data.toolUsed as keyof ToolCounters]: (prev[data.toolUsed as keyof ToolCounters] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LabLayout currentLab={5}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module 5</span>
            </div>
            {/* Tool use counters */}
            <div className="flex items-center gap-3 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
              <span className="font-medium text-gray-500">Tool Uses:</span>
              <span className="text-blue-400">Calculator: {counters.calculator}</span>
              <span className="text-gray-600">|</span>
              <span className="text-green-400">Wikipedia: {counters.wikipedia}</span>
              <span className="text-gray-600">|</span>
              <span className="text-purple-400">Web Search: {counters.web_search}</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">LLM Picks the Right Tool</h1>
          <p className="text-gray-400 max-w-2xl">
            Ask a question — watch the LLM decide which tool is most appropriate and use it.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isSelected = result?.toolUsed === tool.id;
            const isOther = result && result.toolUsed !== tool.id;
            const isPulsing = isLoading && activeAnimation === null;

            return (
              <motion.div
                key={tool.id}
                animate={{
                  opacity: isOther ? 0.3 : 1,
                  scale: isSelected ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`bg-gray-900 rounded-2xl border-2 transition-all overflow-hidden ${
                  isSelected
                    ? "border-orange-500 shadow-lg shadow-orange-500/20"
                    : "border-gray-800"
                }`}
              >
                <div className={`bg-gradient-to-r ${tool.color} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-white">{tool.name}</span>
                    </div>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-orange-400 text-orange-900 text-xs font-bold px-2 py-1 rounded-full"
                      >
                        Selected ✓
                      </motion.span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-2">{tool.description}</p>
                  <p className="text-xs text-gray-600">{tool.examples}</p>

                  {isSelected && result?.toolInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2"
                    >
                      <div className="text-xs text-orange-400 font-medium mb-1">Input sent:</div>
                      <div className="text-xs text-orange-200 font-mono">
                        {JSON.stringify(result.toolInput)}
                      </div>
                    </motion.div>
                  )}

                  {!result && !isLoading && (
                    <div className="mt-2 text-xs text-gray-700">[idle]</div>
                  )}

                  {isLoading && (
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Reasoning bubble */}
        <AnimatePresence>
          {result?.reasoning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">💭</span>
                </div>
                <div>
                  <div className="text-xs text-yellow-400 font-medium mb-1">LLM Reasoning</div>
                  <p className="text-yellow-200/80 text-sm">{result.reasoning}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Query input */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runQuery()}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
            />
            <motion.button
              onClick={() => runQuery()}
              disabled={!query.trim() || isLoading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? "Thinking..." : "Ask"}
            </motion.button>
          </div>

          {/* Suggested queries */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((sq) => (
              <motion.button
                key={sq.text}
                onClick={() => {
                  setQuery(sq.text);
                  runQuery(sq.text);
                }}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {sq.text}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Final Answer */}
        <AnimatePresence>
          {result?.finalAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-green-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-bold text-green-400">Final Answer</span>
                {result.toolUsed && (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    via {result.toolUsed}
                  </span>
                )}
              </div>
              <p className="text-gray-200 leading-relaxed">{result.finalAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LabLayout>
  );
}
