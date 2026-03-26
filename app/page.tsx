"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Zap,
  EyeOff,
  Wrench,
  Layers,
  GitBranch,
  RefreshCw,
  Network,
  ArrowRight,
  Bot,
  ChevronRight,
} from "lucide-react";

const labs = [
  {
    id: 1,
    path: "/lab1-chat",
    title: "Chat with an LLM",
    description: "Experience raw LLM I/O — text in, text out, nothing else.",
    icon: MessageSquare,
    color: "from-blue-600 to-blue-700",
    badge: "Foundation",
  },
  {
    id: 2,
    path: "/lab2-superpowers",
    title: "LLM Superpowers",
    description: "One model handles summarization, code, translation, and explanation.",
    icon: Zap,
    color: "from-yellow-600 to-orange-600",
    badge: "Capabilities",
  },
  {
    id: 3,
    path: "/lab3-blind-spot",
    title: "The Blind Spot",
    description: "Discover what LLMs can't do — time, real-time data, precise math.",
    icon: EyeOff,
    color: "from-red-600 to-red-700",
    badge: "Limitations",
  },
  {
    id: 4,
    path: "/lab4-one-tool",
    title: "One Tool Changes Everything",
    description: "Watch a calculator tool eliminate LLM math errors instantly.",
    icon: Wrench,
    color: "from-orange-500 to-orange-600",
    badge: "Tool Calling",
  },
  {
    id: 5,
    path: "/lab5-tool-selection",
    title: "LLM Picks the Right Tool",
    description: "The LLM decides: calculator, Wikipedia, or web search?",
    icon: Layers,
    color: "from-green-600 to-green-700",
    badge: "Intelligence",
  },
  {
    id: 6,
    path: "/lab6-pipeline",
    title: "Fixed Pipeline",
    description: "Tools in a fixed sequence: search → summarize → report.",
    icon: GitBranch,
    color: "from-cyan-600 to-cyan-700",
    badge: "Patterns",
  },
  {
    id: 7,
    path: "/lab7-react-loop",
    title: "ReAct — The Reasoning Loop",
    description: "Thought → Action → Observation, live and streaming. The crown jewel.",
    icon: RefreshCw,
    color: "from-purple-600 to-purple-700",
    badge: "Core Lab",
    star: true,
  },
  {
    id: 8,
    path: "/lab8-langgraph",
    title: "Hello LangGraph",
    description: "Give your agent a backbone with state machines and graph visualization.",
    icon: Network,
    color: "from-pink-600 to-pink-700",
    badge: "Next Level",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">AI Agents Learning Lab</div>
              <div className="text-xs text-gray-500">Tech Leaders Hub — Class 7</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
              Tool Calling &amp; ReAct
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Class 7 — Interactive Lab Session
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            AI Agents:{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              From LLM to Agent
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Journey from a simple chat interface to a full ReAct reasoning loop.
            Each lab builds on the last — by Lab 7, you&apos;ll watch an AI agent
            think, search, calculate, and reason in real time.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/lab1-chat">
              <motion.button
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Lab 1
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/lab7-react-loop">
              <motion.button
                className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold px-8 py-3.5 rounded-xl transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Jump to ReAct Lab
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex items-center justify-center gap-12 mt-14 pt-10 border-t border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { value: "8", label: "Interactive Labs" },
            { value: "3", label: "AI Tools" },
            { value: "Live", label: "Streaming AI" },
            { value: "ReAct", label: "Pattern Demo" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Lab Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {labs.map((lab, index) => {
            const Icon = lab.icon;
            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <Link href={lab.path}>
                  <motion.div
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-full cursor-pointer group relative overflow-hidden"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Lab number */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-gray-600 bg-gray-800 px-2 py-1 rounded-md">
                        Lab {lab.id}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        lab.star
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-gray-800 text-gray-500"
                      }`}>
                        {lab.star ? "⭐ " : ""}{lab.badge}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-white text-base mb-2 group-hover:text-blue-300 transition-colors leading-tight">
                      {lab.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {lab.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center gap-1 text-gray-600 group-hover:text-blue-400 transition-colors mt-4 text-xs font-medium">
                      Open Lab
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Learning path */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-6">Learning Journey</h2>
          <div className="flex flex-wrap items-center gap-2">
            {labs.map((lab, index) => {
              const Icon = lab.icon;
              return (
                <div key={lab.id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 bg-gradient-to-r ${lab.color} rounded-lg px-3 py-2 text-white text-xs font-medium`}>
                    <Icon className="w-3 h-3" />
                    {lab.title}
                  </div>
                  {index < labs.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
