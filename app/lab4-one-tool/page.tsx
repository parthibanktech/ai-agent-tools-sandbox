"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import LabLayout from "@/components/LabLayout";

const QUESTION = "What is 9,847 × 3,291?";

interface Step {
  step: number;
  type: string;
  content: string;
  data?: unknown;
}

const STEP_STYLES: Record<string, { bg: string; border: string; icon: string; label: string; textColor: string }> = {
  receive: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "💬", label: "RECEIVED", textColor: "text-blue-300" },
  decision: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "💭", label: "THOUGHT", textColor: "text-yellow-300" },
  tool_call: { bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🔧", label: "TOOL CALL", textColor: "text-orange-300" },
  tool_result: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "📤", label: "RESULT", textColor: "text-green-300" },
  answer: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "✅", label: "FINAL ANSWER", textColor: "text-purple-300" },
};

const TOOL_DEF = `{
  "name": "calculator",
  "description": "Evaluates mathematical expressions",
  "parameters": {
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "description": "The math expression"
      }
    },
    "required": ["expression"]
  }
}`;

export default function Lab4() {
  const [withoutResponse, setWithoutResponse] = useState("");
  const [withoutLoading, setWithoutLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [withToolLoading, setWithToolLoading] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showToolDef, setShowToolDef] = useState(false);

  const askWithout = async () => {
    setWithoutLoading(true);
    setWithoutResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: QUESTION }] }),
      });

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
                setWithoutResponse(acc);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setWithoutResponse(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setWithoutLoading(false);
    }
  };

  const askWithTool = async () => {
    setWithToolLoading(true);
    setSteps([]);
    setVisibleSteps(0);

    try {
      const res = await fetch("/api/tool-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: QUESTION }),
      });
      const data = await res.json() as { steps: Step[] };
      setSteps(data.steps);

      // Animate steps in one by one
      for (let i = 0; i < data.steps.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setVisibleSteps(i + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithToolLoading(false);
    }
  };

  return (
    <LabLayout currentLab={4}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module 4</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">One Tool Changes Everything</h1>
          <p className="text-gray-400 max-w-2xl">
            See the dramatic difference a single calculator tool makes for mathematical precision.
          </p>
        </div>

        {/* Question display */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-1">The question:</p>
          <p className="text-xl font-bold text-white">{QUESTION}</p>
          <p className="text-gray-500 text-sm mt-2">(Correct answer: 32,407,677)</p>
        </div>

        {/* Split screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left — Without Tool */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden opacity-80">
            <div className="bg-gray-800 px-5 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-gray-300">Without Tool</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">Plain LLM</span>
              </div>
            </div>

            <div className="p-5">
              <motion.button
                onClick={askWithout}
                disabled={withoutLoading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl mb-4 transition-colors text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {withoutLoading ? "Asking..." : "Ask Without Tool"}
              </motion.button>

              <AnimatePresence>
                {withoutResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {withoutResponse}
                        {withoutLoading && <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />}
                      </p>
                    </div>
                    {!withoutLoading && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm font-medium">
                          Likely incorrect or hedged — LLMs predict tokens, not calculate
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right — With Tool */}
          <div className="bg-gray-900 border border-orange-500/20 rounded-2xl overflow-hidden">
            <div className="bg-orange-500/10 px-5 py-4 border-b border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-orange-300">With Calculator Tool</span>
                </div>
                <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded">Function Calling</span>
              </div>
            </div>

            <div className="p-5">
              <motion.button
                onClick={askWithTool}
                disabled={withToolLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl mb-4 transition-colors text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {withToolLoading ? "Calling Tool..." : "Ask With Calculator Tool"}
              </motion.button>

              {/* Animated steps */}
              <div className="space-y-3">
                {steps.slice(0, visibleSteps).map((step, i) => {
                  const style = STEP_STYLES[step.type] || STEP_STYLES.receive;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`${style.bg} border ${style.border} rounded-xl p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{style.icon}</span>
                          <span className={`text-xs font-bold ${style.textColor}`}>
                            STEP {step.step}: {style.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{step.content}</p>
                      </div>
                      {i < steps.length - 1 && i < visibleSteps - 1 && (
                        <div className="flex justify-center my-1">
                          <div className="w-px h-4 bg-gray-700" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Success badge */}
              <AnimatePresence>
                {visibleSteps >= steps.length && steps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3 mt-3"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">Correct! Tool gave exact result.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tool definition */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setShowToolDef(!showToolDef)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              <span className="font-medium text-white text-sm">View Tool Definition (JSON)</span>
            </div>
            {showToolDef ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <AnimatePresence>
            {showToolDef && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-gray-800"
              >
                <pre className="p-5 text-sm text-green-300 font-mono bg-gray-950 overflow-x-auto">
                  {TOOL_DEF}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LabLayout>
  );
}
