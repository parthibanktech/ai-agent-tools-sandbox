"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ChevronDown, ChevronUp, Play } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface GraphEvent {
  type: string;
  node?: string;
  status?: string;
  log?: string;
  condition?: string;
  from?: string;
  to?: string;
  content?: string;
}

interface LogEntry {
  node: string;
  status: string;
  log: string;
  time: number;
}

type NodeId = "start" | "llm" | "tools" | "end";
type EdgeId = "llm-tools" | "tools-llm" | "llm-end";

const CODE = `# This is what the graph above looks like in code
graph = StateGraph(AgentState)

graph.add_node("llm", call_llm)
graph.add_node("tools", call_tools)

graph.add_edge(START, "llm")

graph.add_conditional_edges(
    "llm",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

graph.add_edge("tools", "llm")

app = graph.compile()`;

const QUERY = "What is the square root of the year America declared independence?";

export default function Lab8() {
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeId | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<NodeId>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [showCode, setShowCode] = useState(false);

  const runGraph = async () => {
    setIsRunning(true);
    setActiveNode(null);
    setActiveEdge(null);
    setCompletedNodes(new Set());
    setLogs([]);
    setIsDone(false);
    setFinalAnswer("");

    const addLog = (node: string, status: string, log: string) => {
      setLogs((prev) => [...prev, { node, status, log, time: Date.now() }]);
    };

    try {
      const res = await fetch("/api/langgraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: QUERY }),
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
            const event = JSON.parse(data) as GraphEvent;

            if (event.type === "done") {
              setIsRunning(false);
              setIsDone(true);
              setActiveNode(null);
              setActiveEdge(null);
              break;
            }

            if (event.type === "node" && event.node) {
              const nodeId = event.node as NodeId;
              setActiveNode(event.status === "active" ? nodeId : null);
              if (event.status === "complete") {
                setCompletedNodes((prev) => new Set([...prev, nodeId]));
              }
              if (event.log) addLog(event.node, event.status || "", event.log);
            }

            if (event.type === "edge" && event.from && event.to) {
              const edgeId = `${event.from}-${event.to}` as EdgeId;
              setActiveEdge(edgeId);
              setTimeout(() => setActiveEdge(null), 600);
              addLog("router", "edge", `${event.from} → ${event.to} (${event.condition})`);
            }

            if (event.type === "answer") {
              setFinalAnswer(event.content || "");
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      addLog("error", "error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  const getNodeStyle = (nodeId: NodeId) => {
    const isActive = activeNode === nodeId;
    const isDoneNode = completedNodes.has(nodeId);

    if (isActive) return { fill: "#3b82f6", stroke: "#60a5fa", strokeWidth: 2, opacity: 1 };
    if (isDoneNode) return { fill: "#22c55e", stroke: "#4ade80", strokeWidth: 2, opacity: 0.8 };
    return { fill: "#1f2937", stroke: "#374151", strokeWidth: 1.5, opacity: 0.6 };
  };

  const getEdgeStyle = (edgeId: EdgeId) => {
    if (activeEdge === edgeId) return { stroke: "#f97316", strokeWidth: 2.5, opacity: 1 };
    return { stroke: "#374151", strokeWidth: 1.5, opacity: 0.5 };
  };

  const nodeText = (nodeId: NodeId) => {
    const isActive = activeNode === nodeId;
    if (isActive) return "#ffffff";
    if (completedNodes.has(nodeId)) return "#ffffff";
    return "#6b7280";
  };

  return (
    <LabLayout currentLab={8}>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module 8</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Hello LangGraph</h1>
          <p className="text-gray-400 max-w-2xl">Giving your agent a backbone — state machines, conditional edges, and visual graphs.</p>
        </div>

        {/* Problem statement */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">The Problem with Plain Loops</h2>
          <p className="text-gray-400 text-sm mb-4">
            The ReAct loop you just saw works great. But it&apos;s just code in a <code className="text-green-400 bg-gray-800 px-1 rounded">for</code> loop.
            What if you want to:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              "Visualize the flow as a graph",
              "Add conditions (go to human review)",
              "Pause and resume mid-execution",
              "Have multiple different execution paths",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-pink-300 font-medium text-sm mt-4">That&apos;s what LangGraph gives you.</p>
        </div>

        {/* Graph section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Graph diagram */}
          <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 text-sm">Graph Visualization</h3>

            <svg viewBox="0 0 340 380" className="w-full max-w-sm mx-auto">
              {/* Definitions */}
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                </marker>
                <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                </marker>
              </defs>

              {/* START Node */}
              <rect x="120" y="10" width="100" height="40" rx="8"
                fill={getNodeStyle("start").fill}
                stroke={getNodeStyle("start").stroke}
                strokeWidth={getNodeStyle("start").strokeWidth}
                opacity={getNodeStyle("start").opacity}
              />
              <text x="170" y="35" textAnchor="middle" fill={nodeText("start")} fontSize="13" fontWeight="bold">START</text>

              {/* START → LLM */}
              <line x1="170" y1="50" x2="170" y2="85"
                {...getEdgeStyle("llm-end")}
                markerEnd="url(#arrow)"
              />

              {/* LLM Node */}
              <motion.g
                animate={activeNode === "llm" ? {
                  filter: ["drop-shadow(0 0 0px #3b82f6)", "drop-shadow(0 0 8px #3b82f6)", "drop-shadow(0 0 0px #3b82f6)"],
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <rect x="95" y="90" width="150" height="45" rx="10"
                  fill={getNodeStyle("llm").fill}
                  stroke={getNodeStyle("llm").stroke}
                  strokeWidth={getNodeStyle("llm").strokeWidth}
                  opacity={getNodeStyle("llm").opacity}
                />
                <text x="170" y="112" textAnchor="middle" fill={nodeText("llm")} fontSize="13" fontWeight="bold">LLM Node</text>
                <text x="170" y="127" textAnchor="middle" fill={nodeText("llm")} fontSize="10" opacity="0.7">gpt-4o-mini</text>
              </motion.g>

              {/* Condition diamond */}
              <polygon points="170,150 210,175 170,200 130,175"
                fill="#111827"
                stroke={activeEdge ? "#f97316" : "#374151"}
                strokeWidth="1.5"
              />
              <text x="170" y="172" textAnchor="middle" fill="#6b7280" fontSize="9">condition</text>
              <text x="170" y="184" textAnchor="middle" fill="#6b7280" fontSize="9">check</text>

              {/* LLM → Condition */}
              <line x1="170" y1="135" x2="170" y2="150"
                stroke="#374151" strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />

              {/* Left branch: needs_tool → Tools */}
              <line x1="130" y1="175" x2="60" y2="225"
                {...getEdgeStyle("llm-tools")}
                markerEnd={activeEdge === "llm-tools" ? "url(#arrow-active)" : "url(#arrow)"}
              />
              <text x="75" y="210" fill="#6b7280" fontSize="9" textAnchor="middle">needs tool</text>

              {/* Right branch: has_answer → END */}
              <line x1="210" y1="175" x2="280" y2="225"
                {...getEdgeStyle("llm-end")}
                markerEnd="url(#arrow)"
              />
              <text x="265" y="210" fill="#6b7280" fontSize="9" textAnchor="middle">done</text>

              {/* Tools Node */}
              <motion.g
                animate={activeNode === "tools" ? {
                  filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 8px #f97316)", "drop-shadow(0 0 0px #f97316)"],
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <rect x="5" y="230" width="110" height="45" rx="10"
                  fill={getNodeStyle("tools").fill}
                  stroke={getNodeStyle("tools").stroke}
                  strokeWidth={getNodeStyle("tools").strokeWidth}
                  opacity={getNodeStyle("tools").opacity}
                />
                <text x="60" y="252" textAnchor="middle" fill={nodeText("tools")} fontSize="13" fontWeight="bold">Tool Node</text>
                <text x="60" y="267" textAnchor="middle" fill={nodeText("tools")} fontSize="10" opacity="0.7">calculator</text>
              </motion.g>

              {/* END Node */}
              <rect x="230" y="230" width="100" height="45" rx="8"
                fill={getNodeStyle("end").fill}
                stroke={getNodeStyle("end").stroke}
                strokeWidth={getNodeStyle("end").strokeWidth}
                opacity={getNodeStyle("end").opacity}
              />
              <text x="280" y="258" textAnchor="middle" fill={nodeText("end")} fontSize="13" fontWeight="bold">END</text>

              {/* Tools → LLM (loop back) */}
              <path d="M 5 252 C -20 252 -20 112 95 112"
                fill="none"
                {...getEdgeStyle("tools-llm")}
                markerEnd={activeEdge === "tools-llm" ? "url(#arrow-active)" : "url(#arrow)"}
              />
              <text x="-10" y="200" fill="#6b7280" fontSize="9" textAnchor="middle" transform="rotate(-90, -10, 200)">loop back</text>
            </svg>

            {/* Run button */}
            <div className="mt-4">
              <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2 mb-3">
                Query: <span className="text-gray-300">{QUERY}</span>
              </div>
              <motion.button
                onClick={runGraph}
                disabled={isRunning}
                className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isRunning ? (
                  <>
                    <Network className="w-4 h-4 animate-pulse" />
                    Running Graph...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run with LangGraph
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Log panel */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4 text-sm">Execution Log</h3>
            <div className="space-y-2 overflow-y-auto max-h-80">
              {logs.length === 0 ? (
                <p className="text-gray-600 text-xs">Logs will appear here when you run the graph...</p>
              ) : (
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-l-2 border-gray-700 pl-3"
                    >
                      <div className={`text-xs font-medium ${
                        log.node === "llm" ? "text-blue-400" :
                        log.node === "tools" ? "text-orange-400" :
                        log.node === "end" ? "text-green-400" :
                        log.node === "router" ? "text-yellow-400" :
                        "text-gray-400"
                      }`}>
                        {log.node.toUpperCase()} — {log.status}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{log.log}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Final answer */}
            <AnimatePresence>
              {finalAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4"
                >
                  <div className="text-xs text-green-400 font-bold mb-2">Final Answer</div>
                  <p className="text-green-200/80 text-sm leading-relaxed">{finalAnswer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Code reveal */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setShowCode(!showCode)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📖</span>
              <span className="font-medium text-white text-sm">View LangGraph Code</span>
              <span className="text-xs text-gray-500">(Python)</span>
            </div>
            {showCode ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-gray-800"
              >
                <pre className="p-5 text-sm text-green-300 font-mono bg-gray-950 overflow-x-auto leading-relaxed">
                  {CODE}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom callout */}
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-lg font-bold text-pink-300 mb-2">Next Class: Build This From Scratch</h3>
          <p className="text-pink-200/70 text-sm max-w-lg mx-auto">
            In the next class, we build a full LangGraph agent from the ground up.
            Today, you&apos;ve seen what it can do — the graph, the nodes, the conditional edges.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}
