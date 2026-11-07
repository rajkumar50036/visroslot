"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Layers,
  CalendarCheck2,
  CalendarDays,
  Clock,
  XCircle,
  Phone,
  BookmarkCheck,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { Business, Service, CustomerAIChatMessage } from "@/types/database";

interface CustomerAiChatProps {
  business: Business;
  services: Service[];
  onBack: () => void;
  onBookService: (service: Service) => void;
  onExploreServices: () => void;
  onMyAppointments: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}

export function CustomerAiChat({
  business,
  services,
  onBack,
  onBookService,
  onExploreServices,
  onMyAppointments,
  onReschedule,
  onCancel,
}: CustomerAiChatProps) {
  const [messages, setMessages] = useState<CustomerAIChatMessage[]>([
    {
      id: "m_welcome",
      role: "assistant",
      content: `Hello! I am your VISROSLOT Customer AI concierge for ${business.name}. How can I assist you today? You can ask me about our services, transparent pricing, specialists, opening hours, or booking policies.`,
      suggestion_chips: [
        { label: "Explore Services", action: "EXPLORE_SERVICES" },
        { label: "My Appointments", action: "MY_APPOINTMENTS" },
        ...(services.length > 0
          ? [
              {
                label: `Book ${services[0].name} (₹${services[0].price})`,
                action: "SELECT_SERVICE" as const,
                payload: { serviceId: services[0].id, serviceName: services[0].name },
              },
            ]
          : []),
      ],
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage("");
    const userMsg: CustomerAIChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/customer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          customerPhone: customerPhone ? customerPhone.trim() : undefined,
          consentGiven,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Chat failed");

      const aiMsg: CustomerAIChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        suggestion_chips: data.suggestionChips || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: "I apologize, I am having trouble connecting right now. You can use the buttons below to browse our services or manage your appointments.",
          suggestion_chips: [
            { label: "Explore Services", action: "EXPLORE_SERVICES" },
            { label: "My Appointments", action: "MY_APPOINTMENTS" },
          ],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip: any) => {
    if (chip.action === "SELECT_SERVICE" && chip.payload?.serviceId) {
      const matched = services.find((s) => s.id === chip.payload.serviceId);
      if (matched) {
        onBookService(matched);
        return;
      }
    }

    if (chip.action === "EXPLORE_SERVICES") {
      onExploreServices();
      return;
    }

    if (chip.action === "MY_APPOINTMENTS") {
      onMyAppointments();
      return;
    }

    if (chip.action === "RESCHEDULE") {
      onReschedule();
      return;
    }

    if (chip.action === "CANCEL") {
      onCancel();
      return;
    }

    if (chip.action === "CONTACT_BUSINESS") {
      if (business.phone) {
        window.location.href = `tel:${business.phone}`;
      }
      return;
    }

    // Default: send chip label as message
    handleSendMessage(chip.label);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Options</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-[#046A38]" />
            <span>Preferences</span>
          </button>

          <div className="flex items-center gap-1 text-xs text-[#046A38] font-mono font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Customer AI</span>
          </div>
        </div>
      </div>

      {/* Customer Preferences Drawer / Panel */}
      {showPreferences && (
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-[#043D2E]/20 border border-[#046A38]/30 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-[#046A38]" />
              Smart Preferences & Memory
            </span>
            <button
              onClick={() => setShowPreferences(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            With your explicit consent, Customer AI remembers your preferred specialist and treatments so you don't have to repeat them.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="tel"
              placeholder="Your mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-48 text-slate-900 dark:text-white"
            />
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 text-[11px]">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded text-[#046A38] focus:ring-[#046A38]"
              />
              <span>Consent to remember</span>
            </label>
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-h-[460px] overflow-y-auto">
        {messages.map((m) => {
          const isAi = m.role === "assistant";
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isAi ? "items-start" : "items-start justify-end"}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-[#046A38]/10 text-[#046A38] border border-[#046A38]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] space-y-2.5 ${
                  isAi ? "text-left" : "text-right"
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi
                      ? "bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                      : "bg-[#043D2E] text-white dark:bg-[#046A38] dark:text-white font-medium"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#046A38]/10 text-[#046A38] border border-[#046A38]/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#046A38]" />
              <span>Customer AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask a question about services, prices, or policies..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#046A38]"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
          className="p-3 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white shadow-xs disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
