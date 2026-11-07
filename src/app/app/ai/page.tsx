"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Bot,
  TrendingUp,
  Users,
  CalendarCheck2,
  Clock,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Brain,
  FileText,
  UserCheck,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Target,
  ArrowRight,
  Sliders,
  Bell,
  Zap,
} from "lucide-react";
import { BusinessAIMemory, DailyBusinessReport, AIProposedAction } from "@/types/database";

export default function OwnerAiPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "chat" | "insights" | "daily" | "approval" | "memory"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; model?: string; isLiveLlm?: boolean }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I am **VISROSLOT Owner AI**, your executive business manager. I am connected directly to your live Firestore bookings, client records, and payment data. How can I assist you with your operations today?",
      model: "google/gemini-2.0-flash-001",
      isLiveLlm: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Daily Report State
  const [dailyReport, setDailyReport] = useState<DailyBusinessReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Approval Center State
  const [actions, setActions] = useState<AIProposedAction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [actingActionId, setActingActionId] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedDraftMessage, setEditedDraftMessage] = useState("");

  // Memory Settings State
  const [memory, setMemory] = useState<BusinessAIMemory | null>(null);
  const [savingMemory, setSavingMemory] = useState(false);
  const [newInstructionText, setNewInstructionText] = useState("");
  const [feedbackToast, setFeedbackToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedbackToast({ type, text });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // 1. Load Initial Insights & Snapshot
  const loadInsights = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/owner/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load business insights.");

      setSnapshot(data.snapshot);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to load AI snapshot.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Daily Report
  const loadDailyReport = async (forceRegenerate = false) => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/ai/owner/daily-report", {
        method: forceRegenerate ? "POST" : "GET",
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setDailyReport(data.report);
      }
    } catch (err) {
      console.warn("Daily report error:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // 3. Load Approval Actions
  const loadActions = async () => {
    try {
      const res = await fetch("/api/ai/owner/actions");
      const data = await res.json();
      if (res.ok && data.actions) {
        setActions(data.actions);
        setPendingCount(data.pendingCount || 0);
      }
    } catch (err) {
      console.warn("Actions error:", err);
    }
  };

  // 4. Load AI Memory
  const loadMemory = async () => {
    try {
      const res = await fetch("/api/ai/owner/memory");
      const data = await res.json();
      if (res.ok && data.memory) {
        setMemory(data.memory);
      }
    } catch (err) {
      console.warn("Memory load error:", err);
    }
  };

  useEffect(() => {
    loadInsights();
    loadDailyReport();
    loadActions();
    loadMemory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle Send Chat
  const handleSendChat = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || sendingChat) return;

    setInputMessage("");
    const userMsg = { role: "user" as const, content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setSendingChat(true);

    try {
      const res = await fetch("/api/ai/owner/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "AI response failed.");

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          model: data.model,
          isLiveLlm: data.isLiveLlm,
        },
      ]);

      if (data.proposedAction) {
        loadActions();
        showToast("success", "A new proposed action was added to your Approval Center.");
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err.message || "Could not retrieve AI response. Please try again."}`,
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  // Handle Action Approval
  const handleApproveAction = async (actionId: string) => {
    setActingActionId(actionId);
    try {
      const res = await fetch(`/api/ai/owner/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve action.");

      showToast("success", "Action approved and executed successfully.");
      loadActions();
    } catch (err: any) {
      showToast("error", err.message || "Approval error.");
    } finally {
      setActingActionId(null);
    }
  };

  // Handle Action Reject
  const handleRejectAction = async (actionId: string) => {
    setActingActionId(actionId);
    try {
      const res = await fetch(`/api/ai/owner/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject action.");

      showToast("success", "Action rejected.");
      loadActions();
    } catch (err: any) {
      showToast("error", err.message || "Rejection error.");
    } finally {
      setActingActionId(null);
    }
  };

  // Handle Action Edit & Save
  const handleSaveActionEdit = async (actionId: string) => {
    setActingActionId(actionId);
    try {
      const res = await fetch(`/api/ai/owner/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          editedPayload: { draftMessage: editedDraftMessage },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to edit action.");

      showToast("success", "Action draft updated.");
      setEditingActionId(null);
      loadActions();
    } catch (err: any) {
      showToast("error", err.message || "Edit error.");
    } finally {
      setActingActionId(null);
    }
  };

  // Handle Memory Save
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;

    setSavingMemory(true);
    try {
      const res = await fetch("/api/ai/owner/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_revenue_target: memory.monthly_revenue_target,
          customer_growth_target: memory.customer_growth_target,
          marketing_style: memory.marketing_style,
          communication_tone: memory.communication_tone,
          promotion_preferences: memory.promotion_preferences,
          target_customers: memory.target_customers,
          new_instruction: newInstructionText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save AI memory.");

      setMemory(data.memory);
      setNewInstructionText("");
      showToast("success", "AI Business Memory saved successfully.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to save memory.");
    } finally {
      setSavingMemory(false);
    }
  };

  // Handle Instruction Delete
  const handleDeleteInstruction = async (instId: string) => {
    try {
      const res = await fetch(`/api/ai/owner/memory?instructionId=${encodeURIComponent(instId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete instruction.");
      showToast("success", "Instruction removed.");
      loadMemory();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#C49A46]/40 shadow-xs bg-navy-950 flex items-center justify-center shrink-0">
              <Image
                src="/assets/visroslot-logo.png"
                alt="VISROSLOT Owner AI"
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
              VISROSLOT Owner AI
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Intelligent business manager, automated daily briefs & human-approval operations
          </p>
        </div>

        {feedbackToast && (
          <div
            className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm ${
              feedbackToast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300"
            }`}
          >
            {feedbackToast.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedbackToast.text}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        {[
          { id: "overview", label: "Overview", icon: Bot },
          { id: "chat", label: "AI Advisor (Chat)", icon: Send },
          { id: "insights", label: "Performance Analytics", icon: TrendingUp },
          { id: "daily", label: "Daily Intelligence", icon: FileText },
          { id: "approval", label: `Approval Center (${pendingCount})`, icon: ShieldCheck, badge: pendingCount > 0 },
          { id: "memory", label: "AI Memory & Goals", icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#101A2B] text-white dark:bg-white dark:text-[#101A2B] shadow-sm"
                  : "text-slate-600 dark:text-navy-300 hover:bg-slate-100 dark:hover:bg-navy-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#C49A46]" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          {snapshot && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  Verified Collected Cash
                </span>
                <div className="font-display text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{snapshot.financials.collectedRevenue.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Realized strictly from completed visits / paid records
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  Active Booking Load
                </span>
                <div className="font-display text-3xl font-black text-slate-900 dark:text-white">
                  {snapshot.appointments.today} Today • {snapshot.appointments.upcoming} Upcoming
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {snapshot.appointments.completed} completed visits lifetime
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  Customer Retention
                </span>
                <div className="font-display text-3xl font-black text-purple-600 dark:text-purple-400">
                  {snapshot.customers.returning} Returning
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {snapshot.customers.total} unique client profiles in CRM
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  Pending AI Actions
                </span>
                <div className="font-display text-3xl font-black text-[#C49A46]">
                  {pendingCount}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Awaiting your approval in the Approval Center
                </div>
              </div>
            </div>
          )}

          {/* Daily Intelligence Brief Card */}
          {dailyReport && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div className="flex items-center gap-2 text-[#C49A46]">
                  <FileText className="w-4 h-4" />
                  <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                    Today&apos;s AI Business Brief
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => loadDailyReport(true)}
                  disabled={generatingReport}
                  className="text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? "animate-spin" : ""}`} />
                  <span>Regenerate Brief</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-navy-200 leading-relaxed">
                {dailyReport.summary_text}
              </p>

              {/* Recommended Top 3 Priorities */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C49A46]">
                  Top 3 Recommended Priorities for Today:
                </span>
                <div className="space-y-2">
                  {dailyReport.recommended_priorities.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#101A2B] dark:bg-white text-white dark:text-[#101A2B] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 dark:text-navy-100 font-medium">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Business Improvement Suggestions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C49A46]" />
              <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                Grounded Strategic Recommendations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{s.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        s.priority === "HIGH"
                          ? "bg-red-500/10 text-red-600"
                          : s.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {s.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-navy-300 leading-relaxed">
                    {s.description}
                  </p>
                  <div className="text-[11px] font-mono text-[#C49A46] font-semibold pt-1">
                    Impact: {s.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ADVISOR CHAT */}
      {activeTab === "chat" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5 min-h-[600px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[#C49A46]" />
              <div>
                <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                  Executive AI Business Advisor
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Grounded with live Firestore database snapshot & AI memory
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setChatMessages([
                  {
                    role: "assistant",
                    content: "Chat cleared. What else can I analyze from your business data?",
                  },
                ])
              }
              className="text-xs font-mono text-slate-400 hover:text-slate-600"
            >
              Clear Chat
            </button>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {[
              "How is my business performing this week?",
              "Which customers have not returned recently?",
              "How much revenue did I actually collect this month?",
              "Which services are most popular?",
              "Suggest a promotion based on my business data",
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendChat(q)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-[#C49A46]/20 text-slate-700 dark:text-navy-200 text-xs font-mono transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-[#101A2B] text-white dark:bg-white dark:text-[#101A2B]"
                        : "bg-[#C49A46] text-[#0B1425]"
                    }`}
                  >
                    {isUser ? "You" : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-1 ${
                      isUser
                        ? "bg-[#101A2B] text-white dark:bg-white dark:text-[#101A2B]"
                        : "bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-navy-100"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {!isUser && (
                      <div className="text-[10px] font-mono text-slate-400 dark:text-navy-500 pt-1 border-t border-slate-200/40 dark:border-navy-800/60 flex items-center gap-2">
                        <span>VISROSLOT AI Assistant</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sendingChat && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C49A46]" />
                <span>Owner AI is querying Firestore and analyzing data...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-navy-800"
          >
            <input
              type="text"
              placeholder="Ask Owner AI about bookings, customer retention, revenue, or promotions..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46]"
            />
            <button
              type="submit"
              disabled={sendingChat || !inputMessage.trim()}
              className="px-5 py-3 rounded-2xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] text-xs font-mono font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
            >
              {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PERFORMANCE ANALYTICS */}
      {activeTab === "insights" && snapshot && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Appointment Matrix */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <span className="font-mono text-xs font-bold uppercase text-slate-400">
                  Booking Operations
                </span>
                <span className="font-mono text-xs text-[#C49A46] font-bold">
                  {snapshot.appointments.completionRate}% Completion
                </span>
              </div>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Lifetime Bookings</span>
                  <span className="font-bold text-slate-900 dark:text-white">{snapshot.appointments.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed Visits</span>
                  <span className="font-bold text-emerald-600">{snapshot.appointments.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cancelled Bookings</span>
                  <span className="font-bold text-red-600">{snapshot.appointments.cancelled} ({snapshot.appointments.cancellationRate}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded No-Shows</span>
                  <span className="font-bold text-amber-600">{snapshot.appointments.noShows}</span>
                </div>
              </div>
            </div>

            {/* Financial Distinction Matrix */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <span className="font-mono text-xs font-bold uppercase text-slate-400">
                  Revenue vs Pipeline
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Verified Realized
                </span>
              </div>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified Collected Revenue</span>
                  <span className="font-bold text-emerald-600">₹{snapshot.financials.collectedRevenue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booked Service Pipeline</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{snapshot.financials.bookedServiceValue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending Value to Realize</span>
                  <span className="font-bold text-amber-600">₹{snapshot.financials.pendingValue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Peak Hours & Service Demand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase text-[#C49A46]">
                Peak Booking Hours
              </h4>
              <div className="space-y-2">
                {snapshot.appointments.peakHours.map((p: any) => (
                  <div key={p.hour} className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-slate-50 dark:bg-navy-950">
                    <span className="font-bold text-slate-800 dark:text-white">{p.hour}</span>
                    <span className="text-slate-400">{p.count} appointments</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase text-[#C49A46]">
                Top Booked Services
              </h4>
              <div className="space-y-2">
                {snapshot.appointments.serviceBreakdown.map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-slate-50 dark:bg-navy-950">
                    <span className="font-bold text-slate-800 dark:text-white">{s.name}</span>
                    <span className="text-[#C49A46] font-bold">₹{s.value.toLocaleString("en-IN")} ({s.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY INTELLIGENCE */}
      {activeTab === "daily" && dailyReport && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-navy-800">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                DAILY BRIEFING • {dailyReport.report_date}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                Executive Daily Business Intelligence
              </h2>
            </div>
            <button
              type="button"
              onClick={() => loadDailyReport(true)}
              disabled={generatingReport}
              className="px-4 py-2 rounded-xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? "animate-spin" : ""}`} />
              <span>Regenerate Brief</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs sm:text-sm text-slate-700 dark:text-navy-200 leading-relaxed">
            {dailyReport.summary_text}
          </div>

          {/* Operational Warnings */}
          {dailyReport.operational_warnings.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase text-red-600 dark:text-red-400">
                Operational Warnings & Alerts:
              </span>
              <div className="space-y-2">
                {dailyReport.operational_warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 Priorities */}
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase text-[#C49A46]">
              Executive Action Plan (Top 3 Priorities):
            </span>
            <div className="space-y-2.5">
              {dailyReport.recommended_priorities.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 shadow-xs flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#101A2B] text-white dark:bg-white dark:text-[#101A2B] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-800 dark:text-navy-100 font-medium leading-relaxed">
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: APPROVAL CENTER */}
      {activeTab === "approval" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white">
                  AI Approval Center
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-navy-400 mt-0.5">
                Policy: Human Approval Required • Owner AI proposes actions, you control execution
              </p>
            </div>

            <button
              type="button"
              onClick={loadActions}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Actions
            </button>
          </div>

          {actions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                All Proposed Actions Cleared
              </h3>
              <p className="text-xs text-slate-500 dark:text-navy-400 max-w-sm mx-auto">
                No pending actions requiring your authorization. Ask Owner AI in chat to propose campaigns or optimizations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((act) => {
                const isPending = act.status === "PENDING";
                const isActing = actingActionId === act.id;
                const isEditing = editingActionId === act.id;

                return (
                  <div
                    key={act.id}
                    className={`p-6 rounded-3xl bg-white dark:bg-navy-900 border shadow-sm space-y-4 transition-all ${
                      isPending
                        ? "border-[#C49A46]/60 dark:border-[#C49A46]/40"
                        : "border-slate-200 dark:border-navy-800 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {act.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{act.id}
                          </span>
                        </div>
                        <span className="text-xs text-[#C49A46] font-mono font-bold">
                          Reason: {act.reason}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold self-start sm:self-auto ${
                          act.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            : act.status === "EXECUTED"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-navy-800 text-slate-500"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    {/* Expected Outcome */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs">
                      <span className="text-slate-400 font-mono font-bold uppercase text-[10px] block">
                        Expected Outcome (Estimate):
                      </span>
                      <span className="text-slate-800 dark:text-navy-100 font-medium">
                        {act.expected_outcome}
                      </span>
                    </div>

                    {/* Proposed Draft Payload */}
                    {act.action_payload?.draftMessage && (
                      <div className="space-y-1.5 text-xs">
                        <span className="text-slate-400 font-mono font-bold uppercase text-[10px]">
                          Proposed Draft Message:
                        </span>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              rows={3}
                              value={editedDraftMessage}
                              onChange={(e) => setEditedDraftMessage(e.target.value)}
                              className="w-full p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingActionId(null)}
                                className="px-3 py-1.5 text-xs font-mono text-slate-500"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveActionEdit(act.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#C49A46] text-[#0B1425] text-xs font-mono font-bold"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-navy-200 font-mono text-[11px] select-all">
                            {act.action_payload.draftMessage}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions Footer */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-end gap-2">
                        {!isEditing && act.action_payload?.draftMessage && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActionId(act.id);
                              setEditedDraftMessage(act.action_payload.draftMessage);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-600 dark:text-navy-300 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Draft
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleRejectAction(act.id)}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>

                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleApproveAction(act.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Approve & Execute</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AI MEMORY & GOALS */}
      {activeTab === "memory" && memory && (
        <form onSubmit={handleSaveMemory} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2 text-[#C49A46]">
                <Brain className="w-5 h-5" />
                <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                  Business AI Memory & Strategic Goals
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Updated: {new Date(memory.updated_at || Date.now()).toLocaleDateString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-navy-300">
                  Monthly Revenue Target (₹)
                </label>
                <input
                  type="number"
                  value={memory.monthly_revenue_target || 50000}
                  onChange={(e) => setMemory({ ...memory, monthly_revenue_target: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-navy-300">
                  Customer Growth Target (New clients/mo)
                </label>
                <input
                  type="number"
                  value={memory.customer_growth_target || 20}
                  onChange={(e) => setMemory({ ...memory, customer_growth_target: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-navy-300">
                  Preferred Communication Tone
                </label>
                <select
                  value={memory.communication_tone || "professional"}
                  onChange={(e) => setMemory({ ...memory, communication_tone: e.target.value as any })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
                >
                  <option value="professional">Professional & Direct</option>
                  <option value="warm">Warm & Welcoming</option>
                  <option value="concise">Concise & Executive</option>
                  <option value="playful">Engaging & Friendly</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-navy-300">
                  Marketing Style
                </label>
                <select
                  value={memory.marketing_style || "growth"}
                  onChange={(e) => setMemory({ ...memory, marketing_style: e.target.value as any })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
                >
                  <option value="growth">Growth (Active promotions & re-engagement)</option>
                  <option value="conservative">Conservative (Low frequency, strict quality)</option>
                  <option value="premium">Premium (Luxury, strictly zero discounts)</option>
                  <option value="promotional">Promotional (Volume-driven seasonal discounts)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-navy-300">
                Discount & Promotion Policy
              </label>
              <input
                type="text"
                placeholder="e.g. 10% off for inactive clients, no weekend discounts"
                value={memory.promotion_preferences || ""}
                onChange={(e) => setMemory({ ...memory, promotion_preferences: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Confirmed Instructions List */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#C49A46]">
                  Confirmed Instructions ({memory.confirmed_instructions?.length || 0})
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Prioritized by Owner AI during all analyses
                </span>
              </div>

              {memory.confirmed_instructions && memory.confirmed_instructions.length > 0 ? (
                <div className="space-y-2">
                  {memory.confirmed_instructions.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-900 dark:text-white">{inst.instruction}</span>
                        <div className="text-[10px] font-mono text-slate-400">
                          Source: {inst.source} • Added: {new Date(inst.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteInstruction(inst.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove instruction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No custom instructions added yet.</p>
              )}

              {/* Add New Instruction Field */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a new standing instruction for Owner AI (e.g. Always suggest Dr. Arjun for dental consultations)..."
                  value={newInstructionText}
                  onChange={(e) => setNewInstructionText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-end">
              <button
                type="submit"
                disabled={savingMemory}
                className="px-6 py-2.5 rounded-xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {savingMemory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save AI Memory</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
