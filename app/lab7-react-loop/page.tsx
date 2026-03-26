"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Calculator, BookOpen, Globe, Zap } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface ReActStep {
  type: "thought" | "action" | "observation" | "answer" | "error" | "loop";
  content?: string;
  tool?: string;
  input?: Record<string, string>;
  result?: string;
  loop?: number;
}

interface ToolState {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  count: number;
  isActive: boolean;
  lastInput?: string;
  lastOutput?: string;
}

interface ToolActivity {
  tool: string;
  time: number;
}

const SUGGESTED_QUERIES = [
  "Find who founded OpenAI, what year it was founded, and calculate how many years ago that was (current year is 2026)",
  "Who is the current CEO of Google? Search for their recent news.",
  "What is 15% of the population of France? First find the population, then calculate.",
];

const STEP_CONFIGS = {
  thought: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    headerBg: "bg-blue-500/20",
    icon: "💭",
    label: "THOUGHT",
    textColor: "text-blue-300",
    dotColor: "bg-blue-500",
  },
  action: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    headerBg: "bg-orange-500/20",
    icon: "⚡",
    label: "ACTION",
    textColor: "text-orange-300",
    dotColor: "bg-orange-500",
  },
  observation: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    headerBg: "bg-teal-500/20",
    icon: "👁️",
    label: "OBSERVATION",
    textColor: "text-teal-300",
    dotColor: "bg-teal-500",
  },
  answer: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    headerBg: "bg-purple-500/20",
    icon: "✅",
    label: "FINAL ANSWER",
    textColor: "text-purple-300",
    dotColor: "bg-purple-500",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    headerBg: "bg-red-500/20",
    icon: "❌",
    label: "ERROR",
    textColor: "text-red-300",
    dotColor: "bg-red-500",
  },
  loop: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    headerBg: "bg-gray-500/20",
    icon: "🔄",
    label: "LOOP",
    textColor: "text-gray-300",
    dotColor: "bg-gray-500",
  },
};

const TOOL_CONFIGS = [
  {
    id: "calculator",
    name: "Calculator",
    icon: Calculator,
    color: "from-blue-600 to-blue-700",
    glowColor: "shadow-blue-500/40",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: BookOpen,
    color: "from-green-600 to-green-700",
    glowColor: "shadow-green-500/40",
  },
  {
    id: "web_search",
    name: "Web Search",
    icon: Globe,
    color: "from-purple-600 to-purple-700",
    glowColor: "shadow-purple-500/40",
  },
];

export default function Lab7() {
  const [query, setQuery] = useState(SUGGESTED_QUERIES[0]);
  const [steps, setSteps] = useState<ReActStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [tools, setTools] = useState<ToolState[]>(
    TOOL_CONFIGS.map((t) => ({ ...t, count: 0, isActive: false }))
  );
  const [toolTimeline, setToolTimeline] = useState<ToolActivity[]>([]);
  const [isDone, setIsDone] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const run = async () => {
    setIsRunning(true);
    setSteps([]);
    setCurrentLoop(0);
    setToolTimeline([]);
    setIsDone(false);
    setTools(TOOL_CONFIGS.map((t) => ({ ...t, count: 0, isActive: false })));

    try {
      const res = await fetch("/api/react-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data) as {
              type: string;
              content?: string;
              tool?: string;
              input?: Record<string, string>;
              result?: string;
              loop?: number;
            };

            if (event.type === "done") {
              setIsDone(true);
              setIsRunning(false);
              break;
            }

            if (event.type === "loop") {
              setCurrentLoop(event.loop || 0);
              setSteps((prev) => [...prev, { type: "loop", loop: event.loop }]);
            } else if (event.type === "thought") {
              setSteps((prev) => [...prev, { type: "thought", content: event.content }]);
            } else if (event.type === "action") {
              setSteps((prev) => [...prev, { type: "action", tool: event.tool, input: event.input, content: `Tool: ${event.tool}` }]);

              // Activate tool card
              const toolId = event.tool || "";
              setTools((prev) => prev.map((t) =>
                t.id === toolId
                  ? { ...t, isActive: true, lastInput: JSON.stringify(event.input) }
                  : { ...t, isActive: false }
              ));
              setToolTimeline((prev) => [...prev, { tool: toolId, time: Date.now() }]);
            } else if (event.type === "observation") {
              setSteps((prev) => [...prev, { type: "observation", tool: event.tool, result: event.result, content: event.result }]);

              // Update tool with result
              const toolId = event.tool || "";
              setTools((prev) => prev.map((t) =>
                t.id === toolId
                  ? { ...t, isActive: false, count: t.count + 1, lastOutput: event.result?.slice(0, 150) }
                  : t
              ));
            } else if (event.type === "answer") {
              setSteps((prev) => [...prev, { type: "answer", content: event.content }]);
              setTools((prev) => prev.map((t) => ({ ...t, isActive: false })));
            } else if (event.type === "error") {
              setSteps((prev) => [...prev, { type: "error", content: event.content }]);
            }
          } catch { /* skip bad json */ }
        }
      }
    } catch (err) {
      setSteps((prev) => [...prev, { type: "error", content: err instanceof Error ? err.message : "Connection failed" }]);
    } finally {
      setIsRunning(false);
      setIsDone(true);
    }
  };

  const reset = () => {
    setSteps([]);
    setCurrentLoop(0);
    setToolTimeline([]);
    setIsDone(false);
    setTools(TOOL_CONFIGS.map((t) => ({ ...t, count: 0, isActive: false })));
  };

  return (
    <LabLayout currentLab={7}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Lab 7: ReAct — The Reasoning Loop</h1>
                <p className="text-xs text-gray-400">Thought → Action → Observation, streaming live</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentLoop > 0 && (
                <motion.div
                  key={currentLoop}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5"
                >
                  <RefreshCw className={`w-3 h-3 text-purple-400 ${isRunning ? "animate-spin" : ""}`} />
                  <span className="text-xs text-purple-300 font-medium">Loop {currentLoop}</span>
                </motion.div>
              )}
              {isDone && (
                <button onClick={reset} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL — The Agent's Mind */}
          <div className="flex-1 flex flex-col border-r border-gray-800">
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">The Agent&apos;s Mind</span>
              </div>
            </div>

            {/* Query input */}
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <motion.button
                  onClick={run}
                  disabled={isRunning || !query.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      Run Agent
                    </>
                  )}
                </motion.button>
              </div>

              {/* Query suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    disabled={isRunning}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded transition-colors disabled:opacity-50 max-w-48 truncate"
                    title={q}
                  >
                    {q.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Steps feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {steps.length === 0 && !isRunning && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <RefreshCw className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Run the agent to see its reasoning</p>
                  <p className="text-gray-600 text-xs mt-1">Each thought, action, and observation will stream here</p>
                </div>
              )}

              <AnimatePresence>
                {steps.map((step, i) => {
                  if (step.type === "loop") {
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 py-2"
                      >
                        <div className="flex-1 h-px bg-gray-800" />
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <RefreshCw className="w-3 h-3" />
                          Loop {step.loop}
                        </div>
                        <div className="flex-1 h-px bg-gray-800" />
                      </motion.div>
                    );
                  }

                  const config = STEP_CONFIGS[step.type] || STEP_CONFIGS.thought;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <div className={`${config.bg} border ${config.border} rounded-xl overflow-hidden`}>
                        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
                          <span className="text-sm">{config.icon}</span>
                          <span className={`text-xs font-bold ${config.textColor}`}>{config.label}</span>
                          {step.tool && (
                            <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">
                              {step.tool}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-gray-600">step {i + 1}</span>
                        </div>
                        <div className="px-3 py-2.5">
                          {step.type === "action" ? (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Parameters:</div>
                              <pre className="text-xs text-orange-200 font-mono bg-gray-900/50 rounded p-2 overflow-x-auto">
                                {JSON.stringify(step.input, null, 2)}
                              </pre>
                            </div>
                          ) : step.type === "observation" ? (
                            <div>
                              <p className="text-xs text-teal-200/80 leading-relaxed line-clamp-4">
                                {step.result}
                              </p>
                            </div>
                          ) : (
                            <p className={`text-xs ${config.textColor === "text-purple-300" ? "text-purple-200" : "text-gray-300"} leading-relaxed`}>
                              {step.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Connector arrow */}
                      {i < steps.length - 1 && steps[i + 1]?.type !== "loop" && (
                        <div className="flex justify-start pl-4 my-1">
                          <div className="w-px h-3 bg-gray-700" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isRunning && (
                <div className="flex items-center gap-2 text-gray-500 text-xs pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  <span>Agent thinking...</span>
                </div>
              )}

              <div ref={stepsEndRef} />
            </div>
          </div>

          {/* RIGHT PANEL — Tool Activity Dashboard */}
          <div className="w-72 flex flex-col bg-gray-950 flex-shrink-0">
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tool Dashboard</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Tool cards */}
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={tool.id}
                    animate={{
                      scale: tool.isActive ? 1.02 : 1,
                      opacity: 1,
                    }}
                    className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
                      tool.isActive
                        ? "border-orange-500 shadow-lg shadow-orange-500/20"
                        : "border-gray-800"
                    }`}
                  >
                    <div className={`bg-gradient-to-r ${tool.color} px-3 py-2.5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm">{tool.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tool.isActive && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-orange-400"
                          />
                        )}
                        <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                          {tool.count}x
                        </span>
                      </div>
                    </div>

                    {tool.isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 space-y-2"
                      >
                        <div className="text-xs text-orange-400 font-medium">Active — Input:</div>
                        <pre className="text-xs text-orange-200 font-mono bg-gray-800 rounded p-2 overflow-x-auto">
                          {tool.lastInput}
                        </pre>
                      </motion.div>
                    )}

                    {!tool.isActive && tool.lastOutput && (
                      <div className="p-3">
                        <div className="text-xs text-gray-500 mb-1">Last result:</div>
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{tool.lastOutput}</p>
                      </div>
                    )}

                    {!tool.isActive && !tool.lastOutput && (
                      <div className="p-3">
                        <div className="text-xs text-gray-700">Idle</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Timeline */}
              {toolTimeline.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wider">Call Sequence</div>
                  <div className="flex flex-wrap gap-1.5">
                    {toolTimeline.map((activity, i) => {
                      const toolConfig = TOOL_CONFIGS.find((t) => t.id === activity.tool);
                      const colors: Record<string, string> = {
                        calculator: "bg-blue-500",
                        wikipedia: "bg-green-500",
                        web_search: "bg-purple-500",
                      };
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center gap-1 ${colors[activity.tool] || "bg-gray-500"} bg-opacity-20 border border-opacity-30 rounded-full px-2 py-0.5`}
                          style={{
                            borderColor: colors[activity.tool]?.replace("bg-", "") || "#6b7280",
                          }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${colors[activity.tool] || "bg-gray-500"}`} />
                          <span className="text-xs text-gray-400">{toolConfig?.name}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stats */}
              {isDone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mt-2"
                >
                  <div className="text-xs text-green-400 font-bold mb-2">Session Complete</div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Total loops:</span>
                      <span className="text-white">{currentLoop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tool calls:</span>
                      <span className="text-white">{toolTimeline.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Steps:</span>
                      <span className="text-white">{steps.length}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
