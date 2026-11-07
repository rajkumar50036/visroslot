"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, ShieldCheck, Clock, RefreshCw, AlertCircle } from "lucide-react";

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#707974] hover:text-[#046A38] dark:text-[#A7B9AA] dark:hover:text-[#FFFFFF] mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-4 mb-10">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6]">
            Legal &amp; Subscription Terms
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#10251D] dark:text-[#FFFFFF]">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-xs font-mono text-[#707974] dark:text-[#A7B9AA]">
            Last Updated: November 2026 • Brand: VISROSLOT
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed text-[#404944] dark:text-[#D8DED8]">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#10251D] dark:text-[#FFFFFF] font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#046A38] dark:text-[#9EF6B6]" />
              <span>1. 7-Day Free Trial Cancellation</span>
            </h2>
            <p>
              New eligible business accounts receive a 7-day free trial upon authorizing a recurring payment mandate. No subscription fee is charged during this 7-day trial period.
            </p>
            <p>
              You can cancel your trial at any time within the 7-day trial window directly from your business dashboard under <strong>Subscription & Billing</strong>. If you cancel prior to the conclusion of the 7-day trial, your recurring payment mandate is halted immediately and no subscription amount will ever be charged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#C49A46]" />
              <span>2. Recurring AutoPay Mandate & Cancellation</span>
            </h2>
            <p>
              VISROSLOT subscriptions renew automatically according to your selected billing frequency (Monthly or Yearly) through Razorpay Subscriptions (AutoPay / eMandate / Recurring Card).
            </p>
            <p>
              You may cancel future renewals at any time directly through your dashboard or directly from your UPI app (PhonePe, Google Pay, Paytm, BHIM). Under Reserve Bank of India (RBI) and NPCI eMandate regulations, you have complete sovereign control over your AutoPay mandate and can revoke it inside your UPI application at any time without needing to log in to the website.
            </p>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs space-y-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[11px] block">
                How to Cancel AutoPay in Your UPI App:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                <li><strong>PhonePe:</strong> Profile icon ➔ UPI AutoPay ➔ Select VISROSLOT ➔ Tap &quot;Cancel AutoPay&quot; ➔ Enter UPI PIN.</li>
                <li><strong>Google Pay:</strong> Profile icon (top-right) ➔ Autopay ➔ Select VISROSLOT ➔ Tap &quot;Cancel Autopay&quot; ➔ Enter UPI PIN.</li>
                <li><strong>Paytm:</strong> Profile icon ➔ UPI &amp; Payment Settings ➔ UPI AutoPay ➔ Select VISROSLOT ➔ Tap &quot;Cancel AutoPay&quot;.</li>
                <li><strong>BHIM / Bank Apps:</strong> Mandates / AutoPay menu ➔ Active Mandates ➔ Select VISROSLOT ➔ Revoke / Cancel.</li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
              <strong>Access Continuity Guarantee:</strong> Cancelling your subscription or revoking your mandate stops future scheduled collections without prematurely cutting off your access. You retain full access to your paid features and booking tools through the end of your current paid-through date.
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C49A46]" />
              <span>3. Data Preservation on Cancellation</span>
            </h2>
            <p>
              When a subscription expires or is cancelled:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Your business profile, settings, and login credentials are never deleted.</li>
              <li>Existing appointment records, customer lists, and staff accounts remain permanently intact.</li>
              <li>You can log in at any time to access your billing ledger, customer directory, and past appointment history in read-only mode.</li>
              <li>Public online booking is temporarily paused until you choose to renew or reactivate your subscription.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#C49A46]" />
              <span>4. Refund Policy</span>
            </h2>
            <p>
              Because VISROSLOT offers a full 7-day free trial with operational appointment booking prior to the first automatic collection, subscription payments already processed for an active billing cycle are generally non-refundable once the cycle has begun.
            </p>
            <p>
              If you experience an unauthorized transaction, duplicate charge, or technical discrepancy, please contact our support team immediately. Verified billing errors will be promptly refunded via the original payment channel.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              For any questions regarding cancellations or billing disputes, contact us directly:
            </p>
            <p>
              Phone: <strong>+91 93913 54003</strong> • Instagram: <strong>@visroslot</strong>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
