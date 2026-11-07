"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  MessageSquare,
  ShieldAlert,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Send,
  CornerDownRight,
  ShieldCheck,
  Calendar,
  Briefcase,
  UserCheck,
  TrendingUp,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Review } from "@/types/database";

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalReviews: 0,
    publishedCount: 0,
    reportedCount: 0,
    hiddenCount: 0,
    respondedCount: 0,
    responseRate: 0,
    averageRating: 0,
    ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [filterRating, setFilterRating] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Response state
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>("");
  const [savingResponse, setSavingResponse] = useState<boolean>(false);

  // Report state
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadReviews = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (filterRating !== "ALL") params.set("rating", filterRating);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/reviews/owner?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to load reviews.");
      }

      setReviews(data.reviews || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterRating, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviews();
  };

  // Submit or edit owner response
  const handleSaveResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      showFeedback("error", "Response text cannot be empty.");
      return;
    }

    setSavingResponse(true);
    try {
      const res = await fetch(`/api/reviews/owner/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          responseText: responseText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save response.");
      }

      showFeedback("success", "Response published successfully.");
      setRespondingId(null);
      setResponseText("");
      loadReviews();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to submit response.");
    } finally {
      setSavingResponse(false);
    }
  };

  // Delete owner response
  const handleDeleteResponse = async (reviewId: string) => {
    if (!confirm("Are you sure you want to remove your response?")) return;

    try {
      const res = await fetch(`/api/reviews/owner/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_response" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove response.");
      }

      showFeedback("success", "Response removed successfully.");
      loadReviews();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to delete response.");
    }
  };

  // Report review for moderation
  const handleReportReview = async (reviewId: string) => {
    if (!reportReason.trim()) {
      showFeedback("error", "Please provide a reason for moderation.");
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/reviews/owner/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          reportReason: reportReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to report review.");
      }

      showFeedback("success", "Review reported to platform moderation.");
      setReportingId(null);
      setReportReason("");
      loadReviews();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to report review.");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
              Customer Reviews & Ratings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C49A46]/20 text-[#C49A46]">
              Verified Feedback
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Genuine ratings linked to completed appointments • Public business reputation manager
          </p>
        </div>

        {/* Global Toast */}
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Metrics & Rating Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Average Rating */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400 dark:text-navy-400 font-bold">
            Average Star Rating
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-black text-slate-900 dark:text-white">
              {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="flex items-center text-[#C49A46]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(metrics.averageRating)
                      ? "fill-[#C49A46] text-[#C49A46]"
                      : "text-slate-200 dark:text-navy-800"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Out of 5.0 across {metrics.publishedCount} published ratings
          </div>
        </div>

        {/* Card 2: Total Verified Reviews */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400 dark:text-navy-400 font-bold">
            Total Verified Reviews
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-4xl font-black text-slate-900 dark:text-white">
              {metrics.totalReviews}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              100% Real
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {metrics.publishedCount} published • {metrics.reportedCount} reported
          </div>
        </div>

        {/* Card 3: Owner Response Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400 dark:text-navy-400 font-bold">
            Owner Response Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.responseRate}%
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-navy-200">
              {metrics.respondedCount}/{metrics.totalReviews}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Public responses build trust with clients
          </div>
        </div>

        {/* Card 4: Star Distribution Bar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400 dark:text-navy-400 font-bold">
            Rating Breakdown
          </span>
          <div className="space-y-1 pt-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = metrics.ratingBreakdown?.[String(s)] || 0;
              const pct = metrics.publishedCount > 0 ? Math.round((count / metrics.publishedCount) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-4 text-slate-600 dark:text-navy-300 font-bold">{s}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-[#C49A46] rounded-full" />
                  </div>
                  <span className="w-6 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Star Rating Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "5", "4", "3", "2", "1"].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                filterRating === r
                  ? "bg-[#C49A46] text-[#0B1425] shadow-xs"
                  : "bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-navy-300 hover:bg-slate-200 dark:hover:bg-navy-700"
              }`}
            >
              {r === "ALL" ? "All Stars" : `${r} ★`}
            </button>
          ))}
        </div>

        {/* Status Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-white font-mono font-bold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="REPORTED">Reported for Moderation</option>
            <option value="HIDDEN">Hidden by Policy</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search feedback, client, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46]"
            />
          </form>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-navy-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mx-auto" />
            <span className="font-mono text-xs">Loading customer reviews from Firestore...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              No customer reviews found
            </h3>
            <p className="text-xs text-slate-500 dark:text-navy-400 max-w-sm mx-auto">
              When appointments are completed, clients receive a review invitation to rate their service.
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const isResponding = respondingId === rev.id;
            const isReporting = reportingId === rev.id;
            const hasResponse = Boolean(rev.owner_response?.response_text);
            const isReported = (rev.status || "").toUpperCase() === "REPORTED";
            const isHidden = (rev.status || "").toUpperCase() === "HIDDEN";

            return (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4 transition-all"
              >
                {/* Header Row: Customer, Stars, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#101A2B] dark:bg-navy-950 text-[#C49A46] font-black flex items-center justify-center text-sm shrink-0">
                      {(rev.customer_name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {rev.customer_name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3 h-3" /> Verified Booking
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{rev.service_name}</span>
                        {rev.staff_name && (
                          <>
                            <span>•</span>
                            <span className="text-[#C49A46]">{rev.staff_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(rev.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-[#C49A46]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Number(rev.rating)
                              ? "fill-[#C49A46] text-[#C49A46]"
                              : "text-slate-200 dark:text-navy-800"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isReported
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : isHidden
                          ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {rev.status || "PUBLISHED"}
                    </span>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="text-xs sm:text-sm text-slate-700 dark:text-navy-200 leading-relaxed">
                  {rev.feedback ? (
                    <p className="whitespace-pre-line">{rev.feedback}</p>
                  ) : (
                    <p className="text-slate-400 italic font-mono text-xs">
                      Customer submitted rating with no written comments.
                    </p>
                  )}
                </div>

                {/* Existing Owner Response (if any) */}
                {hasResponse && !isResponding && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-[#C49A46] font-bold">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Business Response</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          • {new Date(rev.owner_response.responded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRespondingId(rev.id);
                            setResponseText(rev.owner_response.response_text);
                          }}
                          className="text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResponse(rev.id)}
                          className="text-[11px] font-mono text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-navy-300 leading-relaxed pl-5">
                      {rev.owner_response.response_text}
                    </p>
                  </div>
                )}

                {/* Inline Response Form */}
                {isResponding && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-[#C49A46]/5 border border-[#C49A46]/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#C49A46]">
                      <span>{hasResponse ? "Edit Public Response" : "Write Public Response"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRespondingId(null);
                          setResponseText("");
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Thank the client or address their feedback professionally..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="w-full p-3 text-xs bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRespondingId(null);
                          setResponseText("");
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-600 dark:text-navy-300 hover:bg-slate-100 dark:hover:bg-navy-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingResponse}
                        onClick={() => handleSaveResponse(rev.id)}
                        className="px-4 py-1.5 rounded-xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {savingResponse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Publish Response</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Report for Moderation Form */}
                {isReporting && (
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-400/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      <span>Report Review to Platform Moderation</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(null);
                          setReportReason("");
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-navy-400">
                      If this review contains inappropriate language, harassment, or violates platform policies, submit it for Super Admin review.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Specify reason for moderation (e.g. Profanity, offensive harassment, wrong business)..."
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-3 text-xs bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(null);
                          setReportReason("");
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-600 dark:text-navy-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submittingReport}
                        onClick={() => handleReportReview(rev.id)}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        <span>Submit Report</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-[11px] text-slate-400">
                    Appointment #{rev.appointment_id?.slice(0, 8)}
                  </div>

                  <div className="flex items-center gap-3">
                    {!hasResponse && !isResponding && (
                      <button
                        type="button"
                        onClick={() => {
                          setRespondingId(rev.id);
                          setResponseText("");
                        }}
                        className="text-[#C49A46] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply to Review</span>
                      </button>
                    )}

                    {!isReported && !isReporting && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(rev.id);
                          setReportReason("");
                        }}
                        className="text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                        title="Report inappropriate content for platform moderation"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
