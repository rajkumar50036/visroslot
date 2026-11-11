"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Hero() {
  const router = useRouter();

  const handleScrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.classList.add("ring-4", "ring-[#046A38]", "shadow-2xl", "transition-all", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-[#046A38]", "shadow-2xl");
      }, 1800);
    } else {
      router.push("/pricing");
    }
  };

  const handleSelectQuickPlan = (plan: "starter" | "premium") => {
    const canonicalPlan = plan === "premium" ? "business" : "professional";
    const hasSession =
      typeof document !== "undefined" &&
      (document.cookie.includes("visroslot_session=") ||
        document.cookie.includes("slotora_session="));

    if (hasSession) {
      router.push(`/onboarding?step=plan&plan=${canonicalPlan}&cycle=monthly`);
    } else {
      router.push(`/register?step=plan&plan=${canonicalPlan}&cycle=monthly`);
    }
  };

  return (
    <section className="bg-[#043D2E] text-[#FFFFFF] pt-28 pb-16 md:pt-36 md:pb-24 border-b border-[#D8DED8]/20 relative overflow-hidden transition-colors">
      {/* Subtle architectural ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 -z-10 w-[700px] h-[500px] rounded-full bg-[#046A38]/30 blur-[130px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6">
            {/* Prominent 7-Day Free Trial Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#046A38]/40 border border-[#9EF6B6]/40 text-[#9EF6B6] text-[11px] font-mono font-bold tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#9EF6B6] animate-pulse" />
              <span>7-Day Free Trial • ₹0 Charged Today • Cancel Anytime</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-[#FFFFFF] tracking-tight leading-[1.08]">
              Make Time for <br className="hidden sm:inline" />
              What Matters.
            </h1>

            <p className="text-base sm:text-lg text-[#D8DED8] max-w-xl font-normal leading-relaxed">
              Your appointments, staff and customers — seamlessly connected. VISROSLOT brings your entire booking operation into one beautifully organised platform with instant audio booking alerts.
            </p>

            {/* Fast Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleScrollToPricing}
                className="w-full sm:w-auto bg-[#046A38] hover:bg-[#03522b] text-[#FFFFFF] px-6 py-3.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 group cursor-pointer ring-2 ring-[#9EF6B6]/30"
              >
                <span>Claim 7-Day Free Trial (₹0 Today)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/30 text-[#FFFFFF] px-5 py-3.5 rounded-md text-xs sm:text-sm font-semibold transition-all flex items-center justify-center cursor-pointer"
              >
                <span>3 Simple Steps</span>
              </a>
            </div>

            {/* Fast Interactive Plan Selectors (Starter vs Premium) */}
            <div className="pt-2 w-full space-y-2">
              <div className="text-[11px] font-mono uppercase text-[#A7B9AA] flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-[#9EF6B6]" />
                <span>Select Your 7-Day Free Trial Plan (₹0 Today):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Starter Plan Mini-Card */}
                <div
                  onClick={() => handleSelectQuickPlan("starter")}
                  className="p-3.5 rounded-lg bg-[#FFFFFF]/5 hover:bg-[#FFFFFF]/10 border border-[#D8DED8]/20 hover:border-[#9EF6B6]/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Starter Plan</span>
                      <span className="text-[10px] font-mono bg-[#046A38] text-white px-2 py-0.5 rounded font-bold">
                        ₹0 Today
                      </span>
                    </div>
                    <div className="text-base font-black text-[#9EF6B6] mt-0.5">
                      ₹499
                      <span className="text-[10px] text-[#A7B9AA] font-normal">/mo</span>
                    </div>
                    <p className="text-[11px] text-[#D8DED8] mt-1">Up to 3 Staff • 300 Bookings</p>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-[#9EF6B6] flex items-center gap-1 group-hover:underline">
                    <span>Start 7-Day Trial →</span>
                  </div>
                </div>

                {/* Premium Plan Mini-Card */}
                <div
                  onClick={() => handleSelectQuickPlan("premium")}
                  className="p-3.5 rounded-lg bg-[#046A38]/30 hover:bg-[#046A38]/45 border-2 border-[#9EF6B6]/60 transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  <div className="absolute -top-2.5 right-3 bg-[#9EF6B6] text-[#043D2E] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                    Most Popular
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Premium Plan</span>
                      <span className="text-[10px] font-mono bg-[#9EF6B6] text-[#043D2E] font-bold px-2 py-0.5 rounded">
                        ₹0 Today
                      </span>
                    </div>
                    <div className="text-base font-black text-white mt-0.5">
                      ₹999
                      <span className="text-[10px] text-[#A7B9AA] font-normal">/mo</span>
                    </div>
                    <p className="text-[11px] text-[#D8DED8] mt-1">Up to 10 Staff • UNLIMITED Bookings</p>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-[#9EF6B6] flex items-center gap-1 group-hover:underline">
                    <span>Start 7-Day Trial →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#D8DED8]/15 w-full text-xs text-[#A7B9AA]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#9EF6B6]" />
                <span className="text-[#F7F6F0]">₹0 Charged Today</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-[#A7B9AA]/40"></span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#9EF6B6]" />
                <span className="text-[#F7F6F0]">2-Minute Setup</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-[#A7B9AA]/40"></span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#9EF6B6]" />
                <span className="text-[#F7F6F0]">Cancel Anytime</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Dashboard Mockup Preview */}
          <div className="lg:col-span-6 relative">
            <div className="bg-[#10251D] border border-[#D8DED8]/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
              {/* Window Header */}
              <div className="bg-[#10251D] px-4 py-3 border-b border-[#D8DED8]/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-[#046A38] inline-block"></span>
                  <span className="ml-2 text-[11px] text-[#A7B9AA] font-mono hidden sm:inline">
                    visroslot.com/app/overview
                  </span>
                </div>
              </div>

              {/* Dashboard Interior */}
              <div className="p-4 sm:p-6 space-y-4 bg-[#10251D]/95">
                {/* 3 Metrics Bar */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#FFFFFF]/5 border border-[#D8DED8]/10 p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[11px] text-[#A7B9AA]">Today&apos;s Bookings</div>
                    <div className="text-xl font-black text-[#FFFFFF] flex items-baseline justify-center sm:justify-start gap-1.5 mt-0.5">
                      <span className="tabular-nums">14</span>
                      <span className="text-[10px] text-[#9EF6B6] font-normal">+18%</span>
                    </div>
                  </div>
                  <div className="bg-[#FFFFFF]/5 border border-[#D8DED8]/10 p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[11px] text-[#A7B9AA]">Active Staff</div>
                    <div className="text-xl font-black text-[#FFFFFF] mt-0.5">
                      <span className="tabular-nums">3</span>{" "}
                      <span className="text-[10px] text-[#A7B9AA] font-normal">Specialists</span>
                    </div>
                  </div>
                  <div className="bg-[#FFFFFF]/5 border border-[#D8DED8]/10 p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[11px] text-[#A7B9AA]">Audio Alerts</div>
                    <div className="text-xl font-black text-[#9EF6B6] flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Volume2 className="w-4 h-4 text-[#9EF6B6]" />
                      <span>ON</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Booking Stream */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A7B9AA] px-1 flex items-center justify-between">
                    <span>Upcoming Appointments Stream</span>
                    <Link
                      href="/book/demo-salon"
                      className="text-[#9EF6B6] hover:underline normal-case font-sans font-medium"
                    >
                      Try Client Booking Flow →
                    </Link>
                  </div>

                  {/* Tile 1 */}
                  <div className="p-3 rounded-lg bg-[#FFFFFF]/5 border border-[#D8DED8]/10 flex items-center justify-between hover:bg-[#FFFFFF]/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#046A38] text-[#FFFFFF] flex items-center justify-center font-bold text-xs">
                        PS
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#FFFFFF]">Priya Sharma</div>
                        <div className="text-[11px] text-[#A7B9AA]">Hair Spa &amp; Blow Dry • Kavita (Stylist)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-[#9EF6B6]">10:00 AM</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#046A38] text-[#FFFFFF] uppercase font-bold tracking-wider">
                        Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Tile 2 */}
                  <div className="p-3 rounded-lg bg-[#FFFFFF]/5 border border-[#D8DED8]/10 flex items-center justify-between hover:bg-[#FFFFFF]/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#043D2E] border border-[#D8DED8]/20 text-[#FFFFFF] flex items-center justify-center font-bold text-xs">
                        RM
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#FFFFFF]">Rahul Mehta</div>
                        <div className="text-[11px] text-[#A7B9AA]">Consultation &amp; Grooming • Rahul (Barber)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-[#D8DED8]">11:15 AM</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFFFFF]/20 text-[#FFFFFF] uppercase font-bold tracking-wider">
                        In Progress
                      </span>
                    </div>
                  </div>

                  {/* Tile 3 */}
                  <div className="p-3 rounded-lg bg-[#FFFFFF]/5 border border-[#D8DED8]/10 flex items-center justify-between hover:bg-[#FFFFFF]/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#243930] text-[#9EF6B6] flex items-center justify-center font-bold text-xs">
                        AR
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#FFFFFF]">Dr. Ananya Rao</div>
                        <div className="text-[11px] text-[#A7B9AA]">Specialist Suite 2 • Clinical Check</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-[#D8DED8]">12:30 PM</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFFFFF]/10 text-[#D8DED8] uppercase font-bold tracking-wider">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar with Audio Pulse */}
                <div className="p-2.5 rounded bg-[#046A38]/20 border border-[#046A38]/40 flex items-center justify-between text-[11px] text-[#D8DED8]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#9EF6B6]"></span>
                    <span>Instant push &amp; audio notification chime</span>
                  </div>
                  <span className="text-[#9EF6B6] font-mono text-[10px]">Synced 2s ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
