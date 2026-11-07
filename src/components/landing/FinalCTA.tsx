"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-[#10251D] py-16 sm:py-24 text-[#FFFFFF] border-b border-[#D8DED8]/10 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[300px] rounded-full bg-[#046A38]/20 blur-[110px]"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="text-[#9EF6B6] text-xs font-mono font-bold tracking-widest uppercase bg-[#046A38]/30 px-3.5 py-1 rounded-full border border-[#046A38]/50 inline-block">
          Empower Your Team Today
        </span>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#FFFFFF]">
          Give Every Appointment a Better Experience.
        </h2>

        <p className="text-base sm:text-lg text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
          Join salon owners, medical clinics, wellness spas and consultants saving hours every week with automated online scheduling.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-8 py-3.5 rounded-md text-xs sm:text-sm font-bold text-[#FFFFFF] bg-[#046A38] hover:bg-[#043D2E] shadow-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="tel:+919391354003"
            className="w-full sm:w-auto px-7 py-3.5 rounded-md text-xs sm:text-sm font-semibold text-[#FFFFFF] bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#9EF6B6]" />
            <span>Call +91 93913 54003</span>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A7B9AA]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#9EF6B6]" />
            <span>7-day free trial included</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#9EF6B6]" />
            <span>No charge during trial</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#9EF6B6]" />
            <span>Dedicated booking link &amp; QR code</span>
          </span>
        </div>
      </div>
    </section>
  );
}
