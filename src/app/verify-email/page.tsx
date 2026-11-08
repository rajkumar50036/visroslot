"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your business email";

  return (
    <div className="bg-white dark:bg-navy-900 py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 dark:border-navy-800 text-center space-y-6 transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-gold-400/20 text-[#C49A46] flex items-center justify-center mx-auto border border-gold-400/30">
        <Mail className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
          Verify your email
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
          We sent an account verification email to:
          <span className="block mt-1 font-bold text-slate-900 dark:text-white break-all font-mono">{email}</span>
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 text-left space-y-2">
        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Next Steps:</span>
        </div>
        <p>1. Open the verification email sent to your inbox.</p>
        <p>2. Click the confirmation link to secure your account credentials.</p>
        <p>3. You can continue setting up your business profile below.</p>
      </div>

      <div className="pt-2 flex flex-col gap-2.5">
        <Link
          href="/onboarding"
          className="w-full py-3.5 px-4 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Continue Business Setup</span>
          <ArrowRight className="w-4 h-4 text-navy-950" />
        </Link>
        <Link
          href="/login"
          className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-navy-400 dark:hover:text-white py-1 transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
            Account Activation
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-navy-400 font-medium">
            Confirm your email to complete VISROSLOT verification
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 dark:text-navy-500">Loading...</div>}>
          <VerifyEmailContent />
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
