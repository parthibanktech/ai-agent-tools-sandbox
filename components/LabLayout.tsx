"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronRight,
  Home,
  Bot,
} from "lucide-react";

const labs = [
  { id: 1, path: "/lab1-chat", title: "Chat with an LLM", icon: MessageSquare, color: "text-blue-400" },
  { id: 2, path: "/lab2-superpowers", title: "LLM Superpowers", icon: Zap, color: "text-yellow-400" },
  { id: 3, path: "/lab3-blind-spot", title: "The Blind Spot", icon: EyeOff, color: "text-red-400" },
  { id: 4, path: "/lab4-one-tool", title: "One Tool Changes Everything", icon: Wrench, color: "text-orange-400" },
  { id: 5, path: "/lab5-tool-selection", title: "LLM Picks the Right Tool", icon: Layers, color: "text-green-400" },
  { id: 6, path: "/lab6-pipeline", title: "Fixed Pipeline", icon: GitBranch, color: "text-cyan-400" },
  { id: 7, path: "/lab7-react-loop", title: "ReAct — The Reasoning Loop", icon: RefreshCw, color: "text-purple-400" },
  { id: 8, path: "/lab8-langgraph", title: "Hello LangGraph", icon: Network, color: "text-pink-400" },
];

interface LabLayoutProps {
  children: React.ReactNode;
  currentLab: number;
}

export default function LabLayout({ children, currentLab }: LabLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">AI Agents Modules</div>
              <div className="text-xs text-gray-500">Educational Project</div>
            </div>
          </Link>
        </div>

        {/* Home link */}
        <div className="px-3 pt-3">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Overview</span>
          </Link>
        </div>

        {/* Labs list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs text-gray-600 uppercase tracking-wider px-3 py-2 font-semibold">
            Modules
          </div>
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = pathname === lab.path;
            const isCompleted = lab.id < currentLab;

            return (
              <Link key={lab.id} href={lab.path}>
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-gray-800 border border-gray-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex-shrink-0 ${isActive ? lab.color : isCompleted ? "text-green-500" : "text-gray-600"}`}>
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Module {lab.id}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-gray-500" />}
                    </div>
                    <div className={`text-xs font-medium truncate ${isActive ? "text-white" : ""}`}>
                      {lab.title}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 text-center">
            Educational Purpose
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
