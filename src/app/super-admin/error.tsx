"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Super Admin captured error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#101A2B] border border-slate-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center mx-auto text-[#C49A46]">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Dashboard View Reload Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error?.message || "A temporary client-side data mismatch occurred while rendering platform metrics."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#101A2B] dark:bg-[#C49A46] text-white dark:text-[#101A2B] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>

          <Link
            href="/super-admin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-900 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
