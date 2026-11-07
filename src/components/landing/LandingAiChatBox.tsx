"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, ArrowRight, ExternalLink } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  suggestionChips?: Array<{ label: string; action: string; url?: string }>;
}

export function LandingAiChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Welcome to **VISROSLOT**! I am your AI assistant. How can I help you today? Ask me about our appointment booking features, ₹499/₹999 pricing, 7-day free trial, or testing our demo salon.",
      suggestionChips: [
        { label: "💳 View Pricing Plans", action: "SEND", url: "/#pricing" },
        { label: "✂️ Try Live Demo Salon", action: "NAVIGATE", url: "/book/demo-salon" },
        { label: "🚀 How 7-Day Trial Works", action: "SEND" },
        { label: "🔔 Background Notifications", action: "SEND" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/landing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: "assistant",
            content: data.reply,
            suggestionChips: data.suggestionChips,
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to get AI reply");
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "VISROSLOT offers smart appointment scheduling, multi-staff calendar, and public booking links with a 7-day free trial. Explore our [Pricing Plans](/#pricing) or [Test Demo Salon](/book/demo-salon).",
          suggestionChips: [
            { label: "View Pricing", action: "NAVIGATE", url: "/#pricing" },
            { label: "Open Demo Salon", action: "NAVIGATE", url: "/book/demo-salon" },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip: { label: string; action: string; url?: string }) => {
    if (chip.action === "NAVIGATE" && chip.url) {
      window.location.href = chip.url;
    } else {
      handleSend(chip.label.replace(/^[^\w\s]+/, "").trim());
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Pill - Compact & Sleek */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group px-3 py-2 rounded-full bg-[#101A2B] hover:bg-[#16233B] text-white border border-[#C49A46]/60 shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 cursor-pointer"
          title="Open VISROSLOT AI Assistant"
          aria-label="Open AI Help Chat"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#C49A46] shrink-0 bg-navy-950 flex items-center justify-center">
            <Image
              src="/assets/visroslot-logo.png"
              alt="VISROSLOT AI"
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-bold tracking-wide text-white">
            AI Help
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#C49A46] group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Expanded Chat Box Window - Small & Compact */}
      {isOpen && (
        <div className="w-[88vw] sm:w-[320px] md:w-[330px] h-[410px] max-h-[70vh] rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#101A2B] via-[#16233B] to-[#101A2B] text-white flex items-center justify-between border-b border-[#C49A46]/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg overflow-hidden border border-[#C49A46]/50 bg-navy-950 flex items-center justify-center shrink-0">
                <Image
                  src="/assets/visroslot-logo.png"
                  alt="VISROSLOT AI"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display text-xs font-bold text-white leading-tight">
                  VISROSLOT AI
                </h3>
                <p className="text-[9px] text-[#D9B66E] leading-tight">
                  Booking Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-navy-900/40 text-[11px]">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isAssistant ? "items-start" : "items-end justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-5 h-5 rounded-md bg-navy-950 border border-[#C49A46]/40 text-[#C49A46] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}

                  <div className="space-y-1.5 max-w-[85%]">
                    <div
                      className={`p-2.5 rounded-xl leading-relaxed whitespace-pre-line text-[11px] ${
                        isAssistant
                          ? "bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-navy-800 shadow-2xs"
                          : "bg-[#101A2B] dark:bg-[#C49A46] text-white dark:text-navy-950 font-medium"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Suggestion Chips */}
                    {isAssistant && msg.suggestionChips && msg.suggestionChips.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {msg.suggestionChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChipClick(chip)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-[#C49A46] hover:text-[#C49A46] dark:hover:text-[#D9B66E] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{chip.label}</span>
                            {chip.action === "NAVIGATE" && (
                              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] py-0.5">
                <Loader2 className="w-3 h-3 animate-spin text-[#C49A46]" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#C49A46]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-[#C49A46] text-navy-950 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
