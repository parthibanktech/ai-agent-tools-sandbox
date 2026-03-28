"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ChevronRight, Check, Loader, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import LabLayout from "@/components/LabLayout";

interface PipelineStep {
  id: number;
  name: string;
  description: string;
  icon: string;
  status: "idle" | "active" | "done" | "error";
  input?: string;
  output?: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  {
    id: 1,
    name: "Web Search",
    description: "Find recent information on the topic",
    icon: "🌐",
    status: "idle",
  },
  {
    id: 2,
    name: "Summarize",
    description: "Condense search results into key points",
    icon: "📄",
    status: "idle",
  },
  {
    id: 3,
    name: "Format Report",
    description: "Structure into a readable report",
    icon: "📋",
    status: "idle",
  },
];

const QUERY = "Research the latest developments in quantum computing and give me a summary report";

export default function Lab6() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalOutput, setFinalOutput] = useState("");

  const updateStep = (id: number, updates: Partial<PipelineStep>) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setIsDone(false);
    setFinalOutput("");
    setSteps(INITIAL_STEPS);

    try {
      // Step 1: Web Search
      updateStep(1, { status: "active" });
      await delay(800);

      const searchResult = await runChat(`Search for and summarize: ${QUERY}. Provide 3-4 key findings about quantum computing developments.`);
      updateStep(1, { status: "done", input: QUERY, output: searchResult.slice(0, 300) + "..." });
      await delay(500);

      // Step 2: Summarize
      updateStep(2, { status: "active" });
      await delay(600);

      const summaryResult = await runChat(`Take these research findings and create 5 concise bullet points:\n\n${searchResult}`);
      updateStep(2, { status: "done", input: "Raw search results", output: summaryResult.slice(0, 300) + "..." });
      await delay(500);

      // Step 3: Format Report
      updateStep(3, { status: "active" });
      await delay(600);

      const report = await runChat(`Format this into a professional report with sections: Executive Summary, Key Developments, Implications.\n\n${summaryResult}`);
      updateStep(3, { status: "done", input: "Bullet points", output: "Report formatted" });
      setFinalOutput(report);
      setIsDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const runChat = async (prompt: string): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
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
            if (parsed.type === "content" && parsed.content) acc += parsed.content;
          } catch { /* skip */ }
        }
      }
    }
    return acc;
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const reset = () => {
    setSteps(INITIAL_STEPS);
    setIsDone(false);
    setFinalOutput("");
  };

  return (
    <LabLayout currentLab={6}>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module 6</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Fixed Pipeline</h1>
          <p className="text-gray-400 max-w-2xl">
            Tools executed in a fixed sequence. Each step feeds its output to the next.
          </p>
        </div>

        {/* Pipeline diagram */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            {/* Start */}
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-300">
              <span>User Query</span>
            </div>

            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <ChevronRight className={`w-5 h-5 ${step.status !== "idle" ? "text-cyan-400" : "text-gray-700"}`} />

                <motion.div
                  animate={{
                    borderColor: step.status === "active" ? "#06b6d4" :
                                  step.status === "done" ? "#22c55e" : "#374151",
                    backgroundColor: step.status === "active" ? "rgba(6,182,212,0.1)" :
                                      step.status === "done" ? "rgba(34,197,94,0.1)" : "transparent",
                  }}
                  className={`border-2 rounded-xl px-4 py-3 min-w-32`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{step.icon}</span>
                    {step.status === "active" && <Loader className="w-3 h-3 text-cyan-400 animate-spin" />}
                    {step.status === "done" && <Check className="w-3 h-3 text-green-400" />}
                  </div>
                  <div className={`text-xs font-bold ${
                    step.status === "active" ? "text-cyan-300" :
                    step.status === "done" ? "text-green-300" : "text-gray-500"
                  }`}>
                    Step {step.id}
                  </div>
                  <div className="text-sm font-medium text-white">{step.name}</div>
                </motion.div>

                {i === steps.length - 1 && (
                  <>
                    <ChevronRight className={`w-5 h-5 ${isDone ? "text-green-400" : "text-gray-700"}`} />
                    <div className={`border-2 rounded-xl px-4 py-3 ${isDone ? "border-green-500 bg-green-500/10" : "border-gray-700"}`}>
                      <div className="text-xs font-bold text-gray-500 mb-1">Output</div>
                      <div className="text-sm font-medium text-white">Answer</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Query */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="text-xs text-gray-500 mb-1">Pre-loaded query:</div>
            <p className="text-white font-medium text-sm">{QUERY}</p>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={runPipeline}
              disabled={isRunning}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isRunning ? "Running Pipeline..." : "Run Pipeline"}
            </motion.button>
            {isDone && (
              <button onClick={reset} className="text-gray-400 hover:text-white text-sm px-4 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Step details */}
        <div className="space-y-3 mb-6">
          {steps.map((step) => (
            <AnimatePresence key={step.id}>
              {(step.status === "done" || step.status === "active") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-900 border rounded-xl p-4 ${
                    step.status === "active" ? "border-cyan-500/40" : "border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>{step.icon}</span>
                    <span className="font-medium text-white text-sm">Step {step.id}: {step.name}</span>
                    {step.status === "active" && <Loader className="w-3 h-3 text-cyan-400 animate-spin" />}
                    {step.status === "done" && <Check className="w-3 h-3 text-green-400" />}
                  </div>
                  {step.output && (
                    <p className="text-gray-400 text-xs leading-relaxed border-l-2 border-gray-700 pl-3">
                      {step.output}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Final output */}
        <AnimatePresence>
          {finalOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-green-500/20 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-green-400" />
                <span className="font-bold text-green-400">Pipeline Complete — Final Report</span>
              </div>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{finalOutput}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Limitation callout */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-300 font-bold mb-2">The Pipeline Limitation</p>
                  <p className="text-orange-200/80 text-sm leading-relaxed">
                    What if Step 1 returned bad results? The pipeline can&apos;t go back.
                    What if you need to search again with a better query?
                    What if the topic requires different steps based on what you find?
                    <strong className="text-orange-200"> Fixed pipelines can&apos;t adapt.</strong>
                  </p>
                </div>
              </div>
              <Link href="/lab7-react-loop">
                <motion.div
                  className="mt-4 flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  See how ReAct solves this
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LabLayout>
  );
}
