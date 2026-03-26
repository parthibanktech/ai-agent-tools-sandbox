"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, FileText, Code, Globe, Brain, ChevronDown, ChevronUp } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface TaskCard {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
  placeholder: string;
}

const TASKS: TaskCard[] = [
  {
    id: "summarize",
    title: "Summarize",
    icon: FileText,
    color: "from-blue-600 to-blue-700",
    prompt: "Summarize the following text in 3 bullet points:\n\nArtificial intelligence has transformed numerous industries over the past decade. In healthcare, AI systems can now detect cancers from medical images with accuracy surpassing human radiologists. In finance, algorithmic trading systems process millions of transactions per second, identifying patterns invisible to human analysts. The transportation sector is being revolutionized by self-driving vehicles that use computer vision and machine learning to navigate complex environments. Meanwhile, natural language processing has enabled virtual assistants to understand and respond to human speech with remarkable accuracy. These advances raise profound questions about the future of work, privacy, and human agency.",
    placeholder: "Enter text to summarize...",
  },
  {
    id: "code",
    title: "Write Code",
    icon: Code,
    color: "from-green-600 to-green-700",
    prompt: "Write a Python function to reverse a string. Include a docstring and example usage.",
    placeholder: "Describe what code you need...",
  },
  {
    id: "translate",
    title: "Translate",
    icon: Globe,
    color: "from-purple-600 to-purple-700",
    prompt: "Translate to French: The weather is beautiful today. The sun is shining and there is a gentle breeze. It is the perfect day for a walk in the park.",
    placeholder: "Enter text to translate...",
  },
  {
    id: "explain",
    title: "Explain Simply",
    icon: Brain,
    color: "from-orange-500 to-orange-600",
    prompt: "Explain how the internet works to a 10-year-old. Use a simple analogy and avoid technical jargon.",
    placeholder: "What would you like explained?",
  },
];

function TaskCardComponent({ task }: { task: TaskCard }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState(task.prompt);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const Icon = task.icon;

  const run = async () => {
    setIsLoading(true);
    setIsExpanded(true);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
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
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
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
      {/* Card header */}
      <div className={`bg-gradient-to-r ${task.color} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{task.title}</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/70 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Prompt input */}
      <div className="p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
        <motion.button
          onClick={run}
          disabled={isLoading || !prompt.trim()}
          className={`mt-3 w-full bg-gradient-to-r ${task.color} hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isLoading ? "Running..." : `Run ${task.title}`}
        </motion.button>
      </div>

      {/* Response */}
      <AnimatePresence>
        {(isExpanded || response) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-800 p-4"
          >
            {isLoading && !response && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
            {response && (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {response}
                {isLoading && <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Lab2() {
  return (
    <LabLayout currentLab={2}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 2</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">LLM Superpowers</h1>
          <p className="text-gray-400 max-w-2xl">
            One model. Four completely different tasks. All through natural language.
          </p>
        </div>

        {/* Task cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {TASKS.map((task) => (
            <TaskCardComponent key={task.id} task={task} />
          ))}
        </div>

        {/* Callout */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-semibold mb-1">The same model. Four completely different tasks.</p>
              <p className="text-yellow-200/70 text-sm">
                GPT-4o-mini can summarize, write code, translate languages, and explain concepts — all through natural language.
                No special configuration. No different models. Just text in, text out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
