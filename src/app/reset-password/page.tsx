"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { confirmPasswordReset, updatePassword } from "firebase/auth";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const { auth, isConfigured } = getFirebaseClient();
      if (!isConfigured || !auth) {
        setErrorMessage("Firebase is currently not configured with live credentials.");
        setLoading(false);
        return;
      }

      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, password);
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, password);
      } else {
        throw new Error("Invalid or expired password reset link. Please request a new one.");
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      let msg = err.message || "Failed to update password.";
      if (err.code === "auth/invalid-action-code") {
        msg = "This password reset link is invalid or has expired. Please request a new link.";
      }
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 dark:border-navy-800 transition-colors">
      {success ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Password Updated!</h2>
          <p className="text-xs text-slate-600 dark:text-navy-300 leading-relaxed">
            Your password has been securely changed. Redirecting you to sign in...
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="text-xs font-mono font-bold text-gold-600 dark:text-gold-400 hover:underline"
            >
              Click here if not redirected automatically
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
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-navy-500" />
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-navy-500 focus:bg-white dark:focus:bg-navy-950 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-navy-500" />
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
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
          href="/"
          className="font-mono font-bold text-gold-600 dark:text-gold-400 hover:underline"
        >
          VisroSlot Home
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3">
        <VisroSlotLogo size="sm" href="/" />
        <ThemeToggle variant="segmented" size="sm" />
      </header>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <VisroSlotLogo variant="full" size="md" href="/" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
            Create New Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-navy-400 font-medium">
            Choose a strong master password for your business account
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 dark:text-navy-500">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>

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
