"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Users,
  CalendarCheck2,
  ChevronDown,
  Lock,
  Percent,
  XCircle,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";

export default function Pricing() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const { auth, isConfigured } = getFirebaseClient();
    if (isConfigured && auth) {
      const unsub = auth.onAuthStateChanged((user) => {
        if (user) {
          setIsLoggedIn(true);
        } else {
          const hasCookie =
            typeof document !== "undefined" &&
            (document.cookie.includes("visroslot_session=") ||
              document.cookie.includes("slotora_session="));
          setIsLoggedIn(hasCookie);
        }
      });
      return () => unsub();
    }
  }, []);

  const handleGetStarted = (plan: "starter" | "premium" | "professional" | "business") => {
    const canonicalPlan = plan === "premium" || plan === "business" ? "business" : "professional";
    if (isLoggedIn) {
      router.push(`/onboarding?step=plan&plan=${canonicalPlan}&cycle=${billingCycle}`);
    } else {
      router.push(`/register?step=plan&plan=${canonicalPlan}&cycle=${billingCycle}`);
    }
  };

  const comparisonFeatures = [
    { name: "Staff Members", starter: "Up to 3 Staff", premium: "Up to 10 Staff" },
    { name: "Monthly Bookings", starter: "300 per month", premium: "Unlimited (No Caps)" },
    { name: "Public Booking Link & QR Code", starter: "Included", premium: "Included" },
    { name: "Calendar & Schedule Matrix", starter: "Included", premium: "Included" },
    { name: "Customer CRM Directory", starter: "Standard", premium: "Advanced with private notes" },
    { name: "Operating Hours & Break Setup", starter: "Included", premium: "Included" },
    { name: "Analytics & Performance Reports", starter: "Basic", premium: "Advanced real-time metrics" },
    { name: "VISROSLOT AI Allowance", starter: "Starter Tier", premium: "Premium Tier" },
    { name: "Priority Support", starter: "Email & Phone", premium: "VIP Dedicated Priority" },
  ];

  const pricingFaqs = [
    {
      q: "What is included in the free trial?",
      a: "Eligible businesses receive 7 full days of platform access with no upfront credit card required. You can test live client bookings, configure staff rosters, and trial the interactive operational dashboard completely risk-free.",
    },
    {
      q: "Can I change my plan later?",
      a: "Yes. You can upgrade from Professional to Business Suite anytime directly from your business dashboard. Upgrading immediately expands your staff capacity and removes booking limits.",
    },
    {
      q: "How many staff members can I add?",
      a: "The Professional plan supports up to 3 individual staff members with independent working hours. The Business plan supports up to 10 staff members.",
    },
    {
      q: "Can I use my public booking link on WhatsApp or Instagram?",
      a: "Yes. Every registered business receives a branded public URL and instant QR code. You can paste the URL into your Instagram bio, attach it to WhatsApp business replies, or place it on Google Business profiles.",
    },
    {
      q: "Are there any hidden transaction fees?",
      a: "No hidden fees. 0% booking commission, unlimited appointment management, and simple transparent billing for your chosen tier.",
    },
    {
      q: "Are customer records and appointments secure?",
      a: "All data is strictly encrypted in transit and at rest. You retain complete, exclusive ownership of your customer database, client histories, and private notes without third-party data monetization.",
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 sm:py-24 bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-widest">
            Predictable Investment
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            Simple, Predictable Pricing
          </h2>
          <p className="text-base text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
            Choose the right plan for your business. Both plans include our 7-day trial and all core scheduling tools.
          </p>

          {/* Billing Cycle Selector */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#046A38] text-[#FFFFFF] shadow-xs"
                    : "text-[#404944] dark:text-[#D8DED8] hover:text-[#10251D] dark:hover:text-[#FFFFFF]"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "bg-[#046A38] text-[#FFFFFF] shadow-xs"
                    : "text-[#404944] dark:text-[#D8DED8] hover:text-[#10251D] dark:hover:text-[#FFFFFF]"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#10251D] dark:bg-[#FFFFFF] text-[#9EF6B6] dark:text-[#043D2E] font-bold">
                  Save 2 Months Free
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2 Official Server-Controlled Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* PLAN 1: STARTER */}
          <div className="bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#707974] dark:text-[#A7B9AA]">
                  Standard Plan
                </span>
                <span className="text-[11px] bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] px-2.5 py-0.5 rounded font-semibold border border-[#D8DED8] dark:border-[#D8DED8]/20">
                  7-Day Free Trial
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-[#10251D] dark:text-[#FFFFFF]">
                  Starter
                </h3>
                <p className="text-xs text-[#404944] dark:text-[#D8DED8] mt-1">
                  Suitable for growing businesses and solo professionals.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tabular-nums">
                    ₹{billingCycle === "monthly" ? "499" : "4,990"}
                  </span>
                  <span className="text-xs text-[#707974] dark:text-[#A7B9AA] font-mono">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {billingCycle === "yearly" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-mono font-bold text-[#046A38] dark:text-[#9EF6B6] bg-[#046A38]/10 px-2 py-0.5 rounded">
                      ₹415/mo equivalent
                    </span>
                    <span className="text-[11px] text-[#707974] dark:text-[#A7B9AA]">
                      Total payable: ₹4,990/year (Save ₹1,000)
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#707974] dark:text-[#A7B9AA]">
                    Total payable: ₹499/month billed monthly
                  </p>
                )}
              </div>

              <div className="bg-[#F7F6F0] dark:bg-[#10251D]/60 p-3 rounded text-xs flex justify-between font-semibold text-[#10251D] dark:text-[#FFFFFF] border border-[#D8DED8] dark:border-[#D8DED8]/20">
                <span>Capacity: Up to 3 Staff</span>
                <span className="font-mono">Limit: 300 Bookings / mo</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span><strong>Maximum 3 staff members</strong> with individual rosters</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span><strong>Maximum 300 successful appointments</strong> / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span>Dedicated public booking page &amp; QR code</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span>Calendar conflict prevention engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span>Customer directory &amp; appointment history</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                  <span>VISROSLOT AI allowance for Starter tier</span>
                </li>
              </ul>

              <div className="pt-2 text-[11px] text-[#707974] dark:text-[#A7B9AA] border-t border-[#D8DED8]/40 dark:border-[#D8DED8]/15">
                <span>Renewal Terms: Auto-renews at ₹{billingCycle === "monthly" ? "499/mo" : "4,990/yr"}.</span>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleGetStarted("starter")}
                className="w-full bg-[#FFFFFF] hover:bg-[#F7F6F0] border-2 border-[#10251D] text-[#10251D] dark:bg-[#10251D] dark:hover:bg-[#10251D]/80 dark:border-[#FFFFFF] dark:text-[#FFFFFF] py-3.5 rounded-md text-xs sm:text-sm font-bold text-center transition-all cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>

          {/* PLAN 2: PREMIUM (FEATURED) */}
          <div className="bg-[#10251D] text-[#FFFFFF] border-2 border-[#046A38] rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3.5 right-6 bg-[#046A38] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Most Popular • Unlimited
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8DED8]/15">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A7B9AA]">
                  Enterprise Suite
                </span>
                <span className="text-[11px] bg-[#FFFFFF]/10 text-[#9EF6B6] px-2.5 py-0.5 rounded font-semibold border border-[#FFFFFF]/10">
                  7-Day Free Trial
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-[#FFFFFF]">
                  Premium
                </h3>
                <p className="text-xs text-[#D8DED8] mt-1">
                  Suitable for established businesses and growing teams.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-black text-[#FFFFFF] tabular-nums">
                    ₹{billingCycle === "monthly" ? "999" : "9,990"}
                  </span>
                  <span className="text-xs text-[#A7B9AA] font-mono">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {billingCycle === "yearly" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-mono font-bold text-[#9EF6B6] bg-[#046A38] px-2 py-0.5 rounded">
                      ₹832/mo equivalent
                    </span>
                    <span className="text-[11px] text-[#A7B9AA]">
                      Total payable: ₹9,990/year (Save ₹2,000)
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#A7B9AA]">
                    Total payable: ₹999/month billed monthly
                  </p>
                )}
              </div>

              <div className="bg-[#FFFFFF]/10 p-3 rounded text-xs flex justify-between font-semibold text-[#FFFFFF] border border-[#FFFFFF]/10">
                <span>Capacity: Up to 10 Staff</span>
                <span className="text-[#9EF6B6] font-mono font-bold">UNLIMITED Bookings</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#D8DED8]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span><strong>Maximum 10 staff members</strong> with independent rosters</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span><strong>Unlimited appointment bookings</strong> (Zero monthly caps)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span>Everything in Starter included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span>Advanced CRM with customer retention private notes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span>Multi-staff roster &amp; conflict governance</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#9EF6B6] shrink-0" />
                  <span>Dedicated priority phone &amp; email support</span>
                </li>
              </ul>

              <div className="pt-2 text-[11px] text-[#A7B9AA] border-t border-[#FFFFFF]/10">
                <span>Renewal Terms: Auto-renews at ₹{billingCycle === "monthly" ? "999/mo" : "9,990/yr"}.</span>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleGetStarted("premium")}
                className="w-full bg-[#046A38] hover:bg-[#043D2E] text-[#FFFFFF] py-3.5 rounded-md text-xs sm:text-sm font-bold text-center transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Trust Reassurance Footnote */}
        <div className="text-center text-xs text-[#707974] dark:text-[#A7B9AA] flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
            <span>Bank-grade encryption</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Percent className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
            <span>0% Booking Commissions</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
            <span>Transparent Pricing • Zero Hidden Fees</span>
          </span>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
              Detailed Feature Comparison
            </h3>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 bg-[#FFFFFF] dark:bg-[#10251D] shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F7F6F0] dark:bg-[#043D2E] border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
                  <th className="py-3 px-4 font-bold text-[#10251D] dark:text-[#FFFFFF]">Features</th>
                  <th className="py-3 px-4 font-bold text-[#10251D] dark:text-[#FFFFFF] text-center">Starter</th>
                  <th className="py-3 px-4 font-bold text-[#046A38] dark:text-[#9EF6B6] text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8DED8] dark:divide-[#D8DED8]/15">
                {comparisonFeatures.map((row: any) => (
                  <tr key={row.name} className="hover:bg-[#F7F6F0]/50 dark:hover:bg-[#043D2E]/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#10251D] dark:text-[#FFFFFF]">{row.name}</td>
                    <td className="py-3 px-4 text-center text-[#404944] dark:text-[#D8DED8] font-mono">{row.starter || row.pro}</td>
                    <td className="py-3 px-4 text-center font-semibold text-[#046A38] dark:text-[#9EF6B6] font-mono">{row.premium || row.biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="max-w-3xl mx-auto pt-6 space-y-4">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
              Pricing &amp; Trial Questions
            </h3>
          </div>

          {pricingFaqs.map((faq, idx) => (
            <div
              key={faq.q}
              className="bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#10251D] dark:text-[#FFFFFF]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed border-t border-[#D8DED8]/40 dark:border-[#D8DED8]/15 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
