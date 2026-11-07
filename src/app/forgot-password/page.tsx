"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { sendPasswordResetEmail } from "firebase/auth";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { auth, isConfigured } = getFirebaseClient();
      if (!isConfigured || !auth) {
        setErrorMessage("Firebase Authentication is not configured.");
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
      setLoading(false);
    } catch (err: any) {
      let msg = "An unexpected error occurred.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        msg = "The provided email address is invalid.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-navy-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle variant="segmented" size="sm" />
      </header>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <VisroSlotLogo variant="full" size="md" href="/" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
            Reset Your Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-navy-400 font-medium">
            Enter your business email and we will send you a secure password reset link
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 dark:border-navy-800 transition-colors">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Check your inbox</h2>
              <p className="text-xs text-slate-600 dark:text-navy-300 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, a password reset link has been dispatched.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full py-3 px-4 rounded-full text-xs font-mono font-bold text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 flex items-center justify-center transition-all shadow-md"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Account Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-navy-500" />
                  <input
                    type="email"
                    required
                    placeholder="owner@yourbusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-navy-500 focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-navy-800 text-center flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="font-mono text-slate-500 dark:text-navy-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
            <Link
              href="/register"
              className="font-mono font-bold text-gold-600 dark:text-gold-400 hover:underline"
            >
              Register Account →
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <VisroContactPhone variant="dark" />
        </div>
      </div>

      <footer className="w-full text-center py-3 text-[11px] font-mono text-slate-400 dark:text-navy-500">
        © 2026 VISROSLOT • EVERY SLOT. SIMPLIFIED.
      </footer>
    </div>
  );
}
