"use client";

import React from "react";
import {
  CalendarCheck,
  Users,
  Clock,
  TrendingUp,
  Globe,
  Smile,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Benefits() {
  const benefitsList = [
    {
      title: "Simplify appointment management",
      description: "Review, confirm, reschedule and manage your daily appointments from one unified calendar screen without phone-tag.",
      icon: CalendarCheck,
    },
    {
      title: "Keep customer records organised",
      description: "Maintain a clean customer directory with booking histories, contact information, and service preferences automatically saved.",
      icon: Users,
    },
    {
      title: "Manage staff schedules",
      description: "Assign independent shifts, break times, and specific service assignments across your team with conflict prevention.",
      icon: Clock,
    },
    {
      title: "Understand business performance",
      description: "View real-time booking trends, popular services, busiest hours, and appointment completion rates to guide decisions.",
      icon: TrendingUp,
    },
    {
      title: "Make online booking easier",
      description: "Give your clients a 24/7 dedicated booking link that works seamlessly on any mobile phone without downloading an app.",
      icon: Globe,
    },
    {
      title: "Improve customer experience",
      description: "Provide instant confirmation and self-service rescheduling so your clients always experience prompt, professional service.",
      icon: Smile,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#F7F6F0] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Brand Editorial Intro & 3 High-Impact Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-wider">
              Thoughtful Architecture
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight leading-tight">
              Every detail of your business, <br className="hidden sm:inline" />
              thoughtfully organised.
            </h2>
            <p className="text-base text-[#404944] dark:text-[#D8DED8] leading-relaxed max-w-2xl pt-1">
              From the first customer booking to the completed appointment, VISROSLOT helps your business operate with clarity and confidence. Eliminating repetitive manual coordination and giving hours back to what you do best.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-5 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-[#046A38] dark:text-[#9EF6B6] tabular-nums font-display">
                0%
              </div>
              <div className="text-[11px] font-semibold text-[#404944] dark:text-[#D8DED8] mt-1">
                Double Bookings
              </div>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-5 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-[#10251D] dark:text-[#FFFFFF] tabular-nums font-display">
                100%
              </div>
              <div className="text-[11px] font-semibold text-[#404944] dark:text-[#D8DED8] mt-1">
                Data Sovereignty
              </div>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-5 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-[#046A38] dark:text-[#9EF6B6] tabular-nums font-display">
                &lt;5m
              </div>
              <div className="text-[11px] font-semibold text-[#404944] dark:text-[#D8DED8] mt-1">
                Storefront Setup
              </div>
            </div>
          </div>
        </div>

        {/* 6 Practical Clarity Cards */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-wider">
              Day-to-Day Clarity
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
              Engineered for effortless operation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitsList.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs hover:border-[#046A38] dark:hover:border-[#9EF6B6] transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
