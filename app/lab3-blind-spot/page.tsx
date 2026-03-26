"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Clock, Newspaper, Calculator, AlertTriangle, X } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface Challenge {
  id: string;
  title: string;
  question: string;
  icon: React.ElementType;
  color: string;
  failureReason: string;
  failureDetail: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: "time",
    title: "Real-time Data",
    question: "What time is it right now in Tokyo?",
    icon: Clock,
    color: "from-red-600 to-red-700",
    failureReason: "No Clock",
    failureDetail: "LLMs have no concept of current time. They were trained on text data up to a cutoff date and have no access to real-world clocks or live sensors.",
  },
  {
    id: "news",
    title: "Recent News",
    question: "What happened in the news today?",
    icon: Newspaper,
    color: "from-orange-500 to-orange-600",
    failureReason: "Knowledge Cutoff",
    failureDetail: "Knowledge cutoff: Aug 2025. The model has no internet access and cannot retrieve news published after its training data was collected.",
  },
  {
    id: "math",
    title: "Precise Math",
    question: "What is 9,847 × 3,291? Give me the exact answer with no hedging.",
    icon: Calculator,
    color: "from-yellow-500 to-yellow-600",
    failureReason: "Token Prediction",
    failureDetail: "LLMs predict tokens — they don't compute. They guess based on patterns in training data. For complex arithmetic, they frequently produce plausible-looking but wrong answers.",
  },
];

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const Icon = challenge.icon;

  const askLLM = async () => {
    setIsLoading(true);
    setShowFailure(false);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: challenge.question }] }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        setResponse(`Error: ${err.error}`);
        setIsLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { type: string; content?: string };
              if (parsed.type === "content" && parsed.content) {
                acc += parsed.content;
                setResponse(acc);
              }
            } catch { /* skip */ }
          }
        }
      }
      setShowFailure(true);
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
      layout
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${challenge.color} p-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{challenge.title}</h3>
            <p className="text-white/70 text-sm mt-0.5">{challenge.question}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <motion.button
          onClick={askLLM}
          disabled={isLoading}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isLoading ? "Asking LLM..." : "Ask the LLM"}
        </motion.button>

        {/* LLM Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700"
            >
              <div className="text-xs text-gray-500 mb-2 font-medium">LLM Response:</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {response}
                {isLoading && <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failure callout */}
        <AnimatePresence>
          {showFailure && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-bold text-sm mb-1">WHY IT FAILED: {challenge.failureReason}</div>
                  <p className="text-red-300/80 text-xs leading-relaxed">{challenge.failureDetail}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Lab3() {
  return (
    <LabLayout currentLab={3}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 3</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">The Blind Spot</h1>
          <p className="text-gray-400 max-w-2xl">
            What can&apos;t an LLM do? Let&apos;s find out together. Ask the model — then see why it struggles.
          </p>
        </div>

        {/* Limitations badges */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { icon: X, label: "No internet" },
            { icon: X, label: "No calculator" },
            { icon: X, label: "Knowledge cutoff" },
            { icon: X, label: "No memory" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1.5"
            >
              <X className="w-3 h-3 text-red-400" />
              <span className="text-red-300 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Challenge cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {CHALLENGES.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>

        {/* Bottom callout */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🔧</div>
          <h3 className="text-lg font-bold text-orange-300 mb-2">This is why we give LLMs tools.</h3>
          <p className="text-orange-200/70 text-sm max-w-lg mx-auto">
            By connecting external tools — calculators, search engines, APIs — we can extend the LLM&apos;s
            capabilities to overcome each of these limitations.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}
