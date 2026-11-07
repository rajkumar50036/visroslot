"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  Users,
  UserCheck,
  Layers,
  TrendingUp,
  Star,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-[#FFFFFF] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-widest">
            Built for Precision
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            One Platform. Complete Clarity.
          </h2>
          <p className="text-base text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
            Purpose-built scheduling infrastructure for modern appointment-driven enterprises. Everything you need to eliminate friction and elevate client relations.
          </p>
        </div>

        {/* 3 Core Architecture Pillars Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pillar 1: Appointment Intelligence (7 cols) */}
          <div className="lg:col-span-7 bg-[#F7F6F0] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
                  <Calendar className="w-3.5 h-3.5" /> Pillar 01
                </span>
                <span className="text-xs text-[#707974] dark:text-[#A7B9AA] font-mono">
                  Automatic Conflict Prevention
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                Appointment Intelligence
              </h3>
              <p className="text-sm text-[#404944] dark:text-[#D8DED8] mb-6 leading-relaxed">
                Smart buffer algorithms protect your specialists against burnout. Custom slot durations, automated sanitization buffers, and real-time bay conflict resolution keep day-to-day operations frictionless.
              </p>
            </div>

            {/* Interactive Calendar Matrix Mini-Console */}
            <div className="bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded p-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8DED8] dark:border-[#D8DED8]/20 mb-3">
                <span className="font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  Wednesday Schedule • Floor Bay 1
                </span>
                <span className="text-[#046A38] dark:text-[#9EF6B6] font-semibold font-mono">
                  15m Buffer Applied
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#043D2E] text-[#FFFFFF] p-2.5 rounded font-medium">
                  <div className="font-mono">09:00 - 10:00</div>
                  <div className="text-[10px] text-[#9EF6B6] mt-0.5">Reserved (VIP)</div>
                </div>
                <div className="bg-[#F7F6F0] dark:bg-[#043D2E]/60 text-[#10251D] dark:text-[#D8DED8] border border-[#D8DED8] dark:border-[#D8DED8]/20 p-2.5 rounded">
                  <div className="font-mono">10:00 - 10:15</div>
                  <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA] mt-0.5">Sanitize Buffer</div>
                </div>
                <div className="bg-[#046A38] text-[#FFFFFF] p-2.5 rounded font-medium">
                  <div className="font-mono">10:15 - 11:30</div>
                  <div className="text-[10px] opacity-90 mt-0.5">Styling &amp; Spa</div>
                </div>
                <div className="border border-dashed border-[#046A38] text-[#046A38] dark:text-[#9EF6B6] p-2.5 rounded">
                  <div className="font-mono">11:30 - 12:30</div>
                  <div className="text-[10px] font-bold mt-0.5">+ Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Seamless Staff Coordination (5 cols) */}
          <div className="lg:col-span-5 bg-[#F7F6F0] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
                  <UserCheck className="w-3.5 h-3.5" /> Pillar 02
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                Staff Coordination
              </h3>
              <p className="text-sm text-[#404944] dark:text-[#D8DED8] mb-4 leading-relaxed">
                Assign independent working hours, personal break rules, and distinct specialty tier assignments across your roster.
              </p>
            </div>

            {/* Staff Rostering Widget */}
            <div className="space-y-2 bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded p-3 text-xs">
              <div className="flex items-center justify-between py-2 px-2.5 bg-[#F7F6F0] dark:bg-[#043D2E]/50 rounded">
                <div className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">
                  Kavita Sharma (Lead Stylist)
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-[10px] font-bold">
                  On Shift
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-2.5 bg-[#F7F6F0] dark:bg-[#043D2E]/50 rounded">
                <div className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">
                  Rahul Mehta (Specialist)
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-[10px] font-bold">
                  On Shift
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-2.5 bg-[#FFFFFF] dark:bg-[#10251D] border border-dashed border-[#D8DED8] dark:border-[#D8DED8]/20 rounded">
                <div className="font-medium text-[#707974] dark:text-[#A7B9AA]">
                  Dr. Ananya Rao (Consultant)
                </div>
                <span className="text-[10px] text-[#707974] dark:text-[#A7B9AA] font-mono">
                  Starts 12:30 PM
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Customer Management & Retention (12 cols) */}
          <div className="lg:col-span-12 bg-[#F7F6F0] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
                  <Users className="w-3.5 h-3.5" /> Pillar 03
                </span>
                <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  Customer CRM &amp; Lifetime Ledger
                </h3>
                <p className="text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                  Store historical records, contact data, service notes, and repeat booking frequency in one sovereign database. Zero commissions, zero third-party lock-in.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#10251D] dark:text-[#FFFFFF] font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                    <span>Private notes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                    <span>VIP tagging</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                    <span>Lifetime spend tracking</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded p-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8DED8] dark:border-[#D8DED8]/20 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#046A38] text-[#FFFFFF] flex items-center justify-center font-bold text-xs">
                      PS
                    </div>
                    <div>
                      <div className="font-bold text-[#10251D] dark:text-[#FFFFFF] flex items-center gap-2">
                        <span>Priya Sharma</span>
                        <span className="bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] px-1.5 py-0.5 rounded text-[10px] font-bold">
                          VIP Client
                        </span>
                      </div>
                      <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA]">
                        +91 98402 11984 • 12 Past Visits
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#10251D] dark:text-[#FFFFFF] font-mono">
                      ₹18,400 LTV
                    </div>
                    <div className="text-[10px] text-[#046A38] dark:text-[#9EF6B6] font-medium">
                      High Retention
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-[#F7F6F0] dark:bg-[#043D2E]/40 p-2.5 rounded text-[#404944] dark:text-[#D8DED8]">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Stylist Note:</span> Prefers chemical-free Keratin blend, window-facing bay, sparkling water upon arrival.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Grid Core Capabilities */}
        <div className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                Online Self-Service Booking
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Give customers a clean booking link and QR code to reserve appointments 24/7 without endless back-and-forth messaging.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                Service Catalog &amp; Menus
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Configure service descriptions, slot durations, buffer intervals, and transparent prices with instant customer visibility.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                Real-Time Analytics
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Track slot utilization, peak business hours, team productivity, and repeat booking trends directly from your console.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <Star className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                Verified Reviews System
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Collect genuine customer feedback tied strictly to completed appointments with owner moderation controls.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                AI Business Assistant
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Smart natural language copilot for owners to analyze daily revenue trends and client queries automatically.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2 font-display">
                Enterprise Cloud Security
              </h4>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Google Firebase multi-tenant isolation, atomic slot transaction locking, and strict role-based data security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
