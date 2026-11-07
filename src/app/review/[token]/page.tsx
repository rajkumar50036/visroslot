"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CalendarDays,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";

const RATING_LABELS: Record<number, { label: string; desc: string }> = {
  1: { label: "Poor", desc: "Did not meet expectations" },
  2: { label: "Fair", desc: "Could have been better" },
  3: { label: "Good", desc: "Met expectations" },
  4: { label: "Very Good", desc: "Really enjoyed the service" },
  5: { label: "Excellent", desc: "Outstanding experience!" },
};

export default function ReviewPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [loading, setLoading] = useState(true);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Verify eligibility on mount
  useEffect(() => {
    async function verifyEligibility() {
      if (!token) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/review/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok && res.status !== 403 && res.status !== 409) {
          throw new Error(data.message || data.error || "Unable to verify review eligibility.");
        }

        setEligibilityData(data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load appointment verification.");
      } finally {
        setLoading(false);
      }
    }

    verifyEligibility();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to submit review.");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#046A38] mb-3" />
        <span className="font-mono text-xs text-slate-500 dark:text-navy-400 uppercase tracking-wider">
          Verifying Appointment Completion...
        </span>
      </div>
    );
  }

  // 2. Fatal Error or Token Not Found
  if (errorMsg || (!eligibilityData && !loading)) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 text-red-500 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
          Review Link Invalid
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-navy-300 max-w-sm">
          {errorMsg || "The appointment token is invalid or has expired."}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#046A38] text-white hover:bg-[#043D2E] font-mono text-xs font-bold hover:brightness-105"
        >
          VisroSlot Home
        </Link>
      </div>
    );
  }

  const { eligible, appointment, alreadyReviewed, message } = eligibilityData;

  // 3. Already Reviewed State
  if (alreadyReviewed) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#D8DED8]/20">
            <VisroSlotLogo size="sm" href="/" />
            <VisroContactPhone showIcon={true} />
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Review Already Submitted
              </span>
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white mt-3">
                Thank You for Your Feedback!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-navy-300 mt-2 max-w-md mx-auto">
                {message || "You have already submitted a verified review for this completed appointment."}
              </p>
            </div>

            {appointment && (
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Business:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointment.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking Ref:</span>
                  <span className="text-[#046A38] font-bold">{appointment.bookingReference}</span>
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-[#046A38] text-white hover:bg-[#043D2E] font-mono text-xs font-bold hover:brightness-105"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Ineligible State (e.g. Appointment not completed yet)
  if (!eligible) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#D8DED8]/20">
            <VisroSlotLogo size="sm" href="/" />
            <VisroContactPhone showIcon={true} />
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                Review Not Yet Available
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-3">
                Appointment In Progress
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-navy-300 mt-2 max-w-md mx-auto leading-relaxed">
                {message || "Reviews can only be submitted after your appointment has been completed by the business."}
              </p>
            </div>

            {appointment && (
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Business:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointment.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Date:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointment.appointmentDate}</span>
                </div>
              </div>
            )}

            <div className="pt-3">
              <Link
                href={`/book/manage/${token}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#043D2E] dark:bg-white text-white dark:text-white font-mono text-xs font-bold"
              >
                <span>View Booking Details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Success Screen After Submission
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#D8DED8]/20">
            <VisroSlotLogo size="sm" href="/" />
            <VisroContactPhone showIcon={true} />
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Review Published
              </span>
              <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white mt-3">
                Thank You, {appointment.customerName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-navy-300 mt-2 max-w-md mx-auto">
                Your verified {rating}-star rating and feedback for <strong className="text-slate-900 dark:text-white">{appointment.businessName}</strong> have been published to their public booking page.
              </p>
            </div>

            <div className="flex justify-center items-center gap-1.5 text-2xl text-[#046A38]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${s <= rating ? "fill-[#046A38] text-[#046A38]" : "text-slate-300 dark:text-navy-700"}`}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#D8DED8]/20 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-[#046A38] text-white hover:bg-[#043D2E] font-mono text-xs font-bold hover:brightness-105"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Active Review Submission Form
  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#D8DED8]/20">
          <VisroSlotLogo size="sm" href="/" />
          <VisroContactPhone showIcon={true} />
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Customer Review</span>
            </div>
            <h1 className="font-display text-2xl font-black uppercase text-slate-900 dark:text-white mt-2">
              Rate Your Experience
            </h1>
            <p className="text-xs text-slate-500 dark:text-navy-400 mt-1">
              Your feedback is linked to your completed appointment with <strong className="text-slate-800 dark:text-white">{appointment.businessName}</strong>.
            </p>
          </div>

          {/* Verified Booking Dossier Preview */}
          <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Service</span>
              <span className="font-bold text-slate-900 dark:text-white">{appointment.serviceName}</span>
            </div>
            {appointment.staffName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Specialist</span>
                <span className="font-bold text-[#046A38]">{appointment.staffName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Date</span>
              <span className="font-bold text-slate-800 dark:text-navy-200">{appointment.appointmentDate}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#D8DED8]/20/80">
              <span className="text-slate-400 font-mono">Client Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{appointment.customerName}</span>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interactive Star Rating */}
            <div className="space-y-2 text-center">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-navy-300">
                Your Overall Rating <span className="text-[#046A38]">*</span>
              </label>

              <div className="flex justify-center items-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeStar;
                  return (
                    <button
                      type="button"
                      key={starVal}
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 sm:p-2 rounded-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      title={`${starVal} Star - ${RATING_LABELS[starVal]?.label}`}
                    >
                      <Star
                        className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                          isFilled
                            ? "fill-[#046A38] text-[#046A38] drop-shadow-sm"
                            : "text-slate-200 dark:text-navy-800"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="h-10 flex flex-col items-center justify-center">
                <span className="font-display text-base font-bold text-[#046A38]">
                  {rating} Star{rating > 1 ? "s" : ""} – {RATING_LABELS[rating]?.label}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-navy-500 font-mono">
                  {RATING_LABELS[rating]?.desc}
                </span>
              </div>
            </div>

            {/* Written Feedback Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-navy-200">
                  Written Feedback (Optional)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {feedback.length}/1000
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Share details of your experience, specialist performance, or service quality..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38] transition-colors resize-none shadow-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#046A38] hover:bg-[#043D2E] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-current" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
