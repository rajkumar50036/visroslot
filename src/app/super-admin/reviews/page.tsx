"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  CornerDownRight,
  MessageSquare,
} from "lucide-react";

export default function SuperAdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchReportedReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/moderate");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load moderation queue.");
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || "Failed to load reported reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedReviews();
  }, []);

  const handleModeration = async (reviewId: string, action: "publish" | "hide") => {
    setActingId(reviewId);
    try {
      const res = await fetch("/api/reviews/moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          action,
          moderationNotes: moderationNotes[reviewId] || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Moderation action failed.");

      setFeedback({
        type: "success",
        message: action === "publish" ? "Review approved and published." : "Review hidden from public page.",
      });
      setTimeout(() => setFeedback(null), 4000);
      fetchReportedReviews();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Action failed." });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
              Platform Review Moderation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {reviews.length} Reported
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Super Admin moderation authority • Review flagged content, policy violations, and appeals
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReportedReviews}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-mono font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-navy-800 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Moderation Queue */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 dark:text-navy-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mx-auto" />
          <span className="font-mono text-xs">Loading reported reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Moderation Queue is Clean
          </h3>
          <p className="text-xs text-slate-500 dark:text-navy-400 max-w-sm mx-auto">
            No customer reviews are currently flagged or reported for platform moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isActing = actingId === rev.id;

            return (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-white dark:bg-navy-900 border-2 border-amber-400/40 dark:border-amber-500/30 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {rev.customer_name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Review ID: {rev.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>Service: {rev.service_name}</span>
                        <span>•</span>
                        <span>Appointment #{rev.appointment_id?.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      FLAGGED
                    </span>
                  </div>
                </div>

                {/* Reason Reported Card */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                  <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase">
                    Report Reason by Owner:
                  </span>
                  <p className="text-amber-900 dark:text-amber-200">
                    {rev.report_reason || "Reported for platform moderation review."}
                  </p>
                </div>

                {/* Customer Review Content */}
                <div className="space-y-1 text-xs">
                  <span className="font-mono text-slate-400 uppercase font-bold text-[10px]">
                    Customer Submitted Feedback:
                  </span>
                  <p className="text-slate-800 dark:text-navy-100 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 leading-relaxed">
                    {rev.feedback || "(No written text provided; numerical rating only)"}
                  </p>
                </div>

                {/* Owner Response (if exists) */}
                {rev.owner_response && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs space-y-1">
                    <div className="font-mono text-[11px] font-bold text-[#C49A46] flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Existing Owner Response:</span>
                    </div>
                    <p className="text-slate-700 dark:text-navy-300 pl-4">
                      {rev.owner_response.response_text}
                    </p>
                  </div>
                )}

                {/* Moderation Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Moderation audit note (optional)..."
                    value={moderationNotes[rev.id] || ""}
                    onChange={(e) =>
                      setModerationNotes({ ...moderationNotes, [rev.id]: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleModeration(rev.id, "publish")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>Approve & Publish</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleModeration(rev.id, "hide")}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>Hide Review</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
