"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Cpu, MessageSquare } from "lucide-react";
import LabLayout from "@/components/LabLayout";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

const STARTERS = [
  "Explain quantum computing in simple terms",
  "Write a haiku about AI",
  "What is the capital of France?",
  "What are the main differences between supervised and unsupervised learning?",
];

export default function Lab1() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    const newMessages: Message[] = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setTokenUsage(null);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        setMessages([...newMessages, { role: "assistant", content: `Error: ${err.error}` }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { type: string; content?: string; usage?: TokenUsage };
              if (parsed.type === "content" && parsed.content) {
                accumulated += parsed.content;
                setMessages([...newMessages, { role: "assistant", content: accumulated }]);
              } else if (parsed.type === "usage" && parsed.usage) {
                setTokenUsage(parsed.usage);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: `Network error: ${err instanceof Error ? err.message : "Unknown"}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <LabLayout currentLab={1}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Lab 1: Chat with an LLM</h1>
                <p className="text-xs text-gray-400">Direct conversation with gpt-4o-mini</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5">
                <Cpu className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-300 font-medium">gpt-4o-mini</span>
              </div>
              {tokenUsage && (
                <div className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
                  {tokenUsage.total_tokens} tokens
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Start a conversation</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Type anything below or click a suggestion to begin
              </p>

              {/* Starter chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                {STARTERS.map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded-xl transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-200 border border-gray-700"
                    }`}
                  >
                    {msg.content}
                    {msg.role === "assistant" && isStreaming && i === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Callout */}
        <div className="px-6 py-3 bg-blue-500/5 border-t border-blue-500/10">
          <p className="text-xs text-blue-400 text-center">
            This is a plain LLM. No tools. No memory. Just <strong>text in → text out</strong>.
          </p>
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              disabled={isStreaming}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
            <motion.button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </LabLayout>
  );
}
