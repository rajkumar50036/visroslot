"use client";

import React from "react";
import Link from "next/link";
import {
  Link2,
  QrCode,
  Bell,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Repeat,
} from "lucide-react";

export default function FeatureSpotlights() {
  return (
    <section className="py-20 md:py-28 bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
        
        {/* STORY 1: Effortless Self-Service Booking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>24/7 Client Booking Experience</span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight leading-tight">
              Booking should feel effortless.
            </h2>
            
            <p className="text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] leading-relaxed">
              Give customers an elegant self-service checkout link that works seamlessly on every device without requiring an app download or account creation.
            </p>
            
            <ul className="space-y-3.5 pt-2">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-[#10251D] dark:text-[#FFFFFF]">
                  Drop your unique link into your Instagram bio, WhatsApp business chat, or Google profile.
                </span>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-[#10251D] dark:text-[#FFFFFF]">
                  Print storefront QR codes for instant walk-in scheduling right at your front desk.
                </span>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-[#10251D] dark:text-[#FFFFFF]">
                  Instant booking confirmations sent directly via SMS and WhatsApp.
                </span>
              </li>
            </ul>
          </div>

          {/* Interactive Mobile Booking Card Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#043D2E] border-2 border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#D8DED8] dark:border-[#D8DED8]/20 pb-3 mb-4">
                <div>
                  <div className="font-bold text-sm text-[#10251D] dark:text-[#FFFFFF]">
                    Aura Salon &amp; Studio
                  </div>
                  <div className="text-[11px] text-[#707974] dark:text-[#A7B9AA] font-mono">
                    Verified VISROSLOT Storefront
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                    Select Specialist
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 border-2 border-[#046A38] bg-[#046A38]/5 dark:bg-[#046A38]/20 rounded-lg text-center font-medium">
                      <div className="font-bold text-[#10251D] dark:text-[#FFFFFF]">Kabir Sharma</div>
                      <div className="text-[10px] text-[#046A38] dark:text-[#9EF6B6] font-bold">Available Today</div>
                    </div>
                    <div className="p-2.5 border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg text-center opacity-60">
                      <div className="font-medium text-[#10251D] dark:text-[#FFFFFF]">Rahul Mehta</div>
                      <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA]">Fully Booked</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                    Choose Available Slot (Today)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button className="py-2 border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md hover:border-[#046A38] text-[#10251D] dark:text-[#FFFFFF] font-mono">
                      09:30 AM
                    </button>
                    <button className="py-2 bg-[#046A38] text-[#FFFFFF] font-bold rounded-md font-mono shadow-xs">
                      10:15 AM
                    </button>
                    <button className="py-2 border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md hover:border-[#046A38] text-[#10251D] dark:text-[#FFFFFF] font-mono">
                      11:30 AM
                    </button>
                  </div>
                </div>

                <div className="bg-[#FAF9F3] dark:bg-[#10251D]/60 p-3.5 rounded-lg text-xs space-y-1.5 border border-[#D8DED8] dark:border-[#D8DED8]/20">
                  <div className="flex justify-between text-[#404944] dark:text-[#D8DED8]">
                    <span>Selected Service</span>
                    <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Signature Hair Spa (60m)</span>
                  </div>
                  <div className="flex justify-between text-[#10251D] dark:text-[#FFFFFF] font-bold pt-1.5 border-t border-[#D8DED8] dark:border-[#D8DED8]/20">
                    <span>Total Amount</span>
                    <span className="font-mono text-sm text-[#046A38] dark:text-[#9EF6B6]">₹1,499</span>
                  </div>
                </div>

                <Link
                  href="/book/demo-salon"
                  className="w-full inline-block bg-[#046A38] text-[#FFFFFF] py-3 rounded-lg text-xs font-bold text-center uppercase tracking-wider hover:bg-[#043D2E] transition-colors shadow-sm"
                >
                  Confirm Booking Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* STORY 2: Master Unified Schedule Control */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Multi-specialist Calendar Matrix Showcase */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#D8DED8] dark:border-[#D8DED8]/20 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <span className="text-sm font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  Multi-Specialist Bay Matrix
                </span>
              </div>
              <div className="flex gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-[#043D2E] text-[#FFFFFF] rounded text-[11px] font-medium">Kabir S.</span>
                <span className="px-2 py-0.5 bg-[#046A38] text-[#FFFFFF] rounded text-[11px] font-medium">Rahul M.</span>
                <span className="px-2 py-0.5 bg-[#10251D] text-[#FFFFFF] rounded text-[11px] font-medium">Dr. Ananya R.</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16 font-mono text-[#707974] dark:text-[#A7B9AA] text-[11px]">09:00 AM</div>
                <div className="flex-1 bg-[#043D2E] text-[#FFFFFF] p-3 rounded-lg font-medium flex justify-between items-center shadow-2xs">
                  <span>Priya Sharma (Blow Dry &amp; Style)</span>
                  <span className="opacity-75 font-mono text-[11px]">Bay 1</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 font-mono text-[#707974] dark:text-[#A7B9AA] text-[11px]">10:00 AM</div>
                <div className="flex-1 bg-[#FAF9F3] dark:bg-[#10251D]/50 border border-dashed border-[#046A38]/40 text-[#046A38] dark:text-[#9EF6B6] p-2 rounded-lg text-center font-mono text-[11px]">
                  +15 Min Sanitization &amp; Turnaround Buffer
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 font-mono text-[#707974] dark:text-[#A7B9AA] text-[11px]">10:15 AM</div>
                <div className="flex-1 bg-[#046A38] text-[#FFFFFF] p-3 rounded-lg font-medium flex justify-between items-center shadow-2xs">
                  <span>Rohit Verma (Styling &amp; Beard Sculpt)</span>
                  <span className="opacity-75 font-mono text-[11px]">Bay 2</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 font-mono text-[#707974] dark:text-[#A7B9AA] text-[11px]">11:30 AM</div>
                <div className="flex-1 bg-[#10251D] text-[#FFFFFF] p-3 rounded-lg font-medium flex justify-between items-center shadow-2xs">
                  <span>Sonia Kapoor (Skin Therapy Consultation)</span>
                  <span className="opacity-75 font-mono text-[11px]">Suite 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Roster &amp; Calendar Grid</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight leading-tight">
              Your schedule. Always in control.
            </h2>

            <p className="text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] leading-relaxed">
              Review, confirm, reschedule and manage your daily appointments from one unified calendar screen without repetitive phone tag. Real-time updates prevent double bookings automatically.
            </p>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-[#10251D] dark:text-[#FFFFFF] font-bold text-sm">
                <Repeat className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <span>Instant Drag-and-Drop Rescheduling</span>
              </div>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] mt-1 leading-relaxed">
                Easily slide client appointments to different times or reassign specialists with immediate client text notifications.
              </p>
            </div>
          </div>
        </div>

        {/* STORY 3: Analytics & Clarity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Intelligent Insights</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight leading-tight">
              See your business more clearly.
            </h2>

            <p className="text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] leading-relaxed">
              Understand booking velocity, peak working hours, specialist utilization, and client retention at a single glance. Make informed decisions powered by real appointment history.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-5 rounded-xl border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
                <div className="text-xs font-mono uppercase tracking-wider text-[#707974] dark:text-[#A7B9AA]">
                  Peak Booking Window
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF] mt-1">
                  11 AM – 3 PM
                </div>
                <div className="text-xs font-semibold text-[#046A38] dark:text-[#9EF6B6] mt-0.5">
                  84% Capacity
                </div>
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-5 rounded-xl border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
                <div className="text-xs font-mono uppercase tracking-wider text-[#707974] dark:text-[#A7B9AA]">
                  Repeat Rate
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF] mt-1">
                  72.4%
                </div>
                <div className="text-xs font-semibold text-[#046A38] dark:text-[#9EF6B6] mt-0.5">
                  +8.1% vs Last Mo
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 p-6 sm:p-7 rounded-xl shadow-sm">
            <div className="text-sm font-bold text-[#10251D] dark:text-[#FFFFFF] mb-4">
              Weekly Appointment Utilization Matrix
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Monday</span>
                  <span className="text-[#707974] dark:text-[#A7B9AA]">18 / 20 Slots (90%)</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F3] dark:bg-[#10251D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#046A38] rounded-full" style={{ width: "90%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Tuesday</span>
                  <span className="text-[#707974] dark:text-[#A7B9AA]">22 / 24 Slots (91.6%)</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F3] dark:bg-[#10251D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#046A38] rounded-full" style={{ width: "91.6%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Wednesday</span>
                  <span className="text-[#046A38] dark:text-[#9EF6B6] font-bold">25 / 25 Slots (100% Full)</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F3] dark:bg-[#10251D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#043D2E] dark:bg-[#9EF6B6] rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Thursday</span>
                  <span className="text-[#707974] dark:text-[#A7B9AA]">21 / 24 Slots (87.5%)</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F3] dark:bg-[#10251D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#046A38] rounded-full" style={{ width: "87.5%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="font-semibold text-[#10251D] dark:text-[#FFFFFF]">Friday &amp; Weekend</span>
                  <span className="text-[#046A38] dark:text-[#9EF6B6] font-bold">36 / 36 Slots (100% Full)</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F3] dark:bg-[#10251D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#043D2E] dark:bg-[#9EF6B6] rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
