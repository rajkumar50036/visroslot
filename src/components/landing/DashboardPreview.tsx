"use client";

import React from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Users, 
  CalendarCheck,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Clock,
  ShieldCheck,
  Volume2
} from "lucide-react";

export default function DashboardPreview() {
  const sampleAppointments = [
    {
      id: "APT-201",
      customer: "Priya Sharma",
      service: "Hair Spa & Blow Dry",
      time: "10:00 AM",
      staff: "Kavita (Stylist)",
      status: "Confirmed",
      statusBadge: "bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] border border-[#046A38]/20",
      price: "₹1,200",
    },
    {
      id: "APT-202",
      customer: "Rahul Mehta",
      service: "Consultation & Grooming",
      time: "11:15 AM",
      staff: "Rahul (Barber)",
      status: "In Progress",
      statusBadge: "bg-[#043D2E]/10 text-[#043D2E] dark:bg-[#FFFFFF]/10 dark:text-[#D8DED8] border border-[#D8DED8]",
      price: "₹800",
    },
  ];

  return (
    <section id="preview" className="py-12 sm:py-16 bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] transition-colors duration-200 border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#046A38]/10 border border-[#046A38]/30 text-[11px] font-bold text-[#046A38] dark:text-[#9EF6B6] font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Console Overview</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            One clean dashboard to run your day
          </h2>
          <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8]">
            Real-time customer bookings, staff schedules, and audio alerts organized in one place.
          </p>
        </div>

        {/* Small Size Box of Demo Overview */}
        <div className="max-w-3xl mx-auto rounded-xl border border-[#D8DED8] dark:border-[#D8DED8]/20 bg-[#FFFFFF] dark:bg-[#043D2E] shadow-sm overflow-hidden">
          
          {/* Top Window Bar */}
          <div className="px-3.5 py-2.5 bg-[#F7F6F0] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#046A38]" />
              <span className="ml-2 font-mono text-[10px] text-[#707974] dark:text-[#A7B9AA] hidden sm:inline">
                visroslot.com/app/overview
              </span>
            </div>
            
            <Link
              href="/book/demo-salon"
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] hover:bg-[#046A38]/20 border border-[#046A38]/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Try Live Demo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Compact Dashboard Content */}
          <div className="p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#043D2E] space-y-4">
            
            {/* Header Strip with 3 Mini KPIs */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center">
                <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA] font-mono">Today&apos;s Bookings</div>
                <div className="text-base sm:text-lg font-bold text-[#10251D] dark:text-[#FFFFFF] mt-0.5 tabular-nums">14</div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center">
                <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA] font-mono">Active Staff</div>
                <div className="text-base sm:text-lg font-bold text-[#10251D] dark:text-[#FFFFFF] mt-0.5">3 Specialists</div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center">
                <div className="text-[10px] text-[#707974] dark:text-[#A7B9AA] font-mono">Audio Alerts</div>
                <div className="text-base sm:text-lg font-bold text-[#046A38] dark:text-[#9EF6B6] mt-0.5 flex items-center justify-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ON</span>
                </div>
              </div>
            </div>

            {/* Compact Table */}
            <div className="border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F6F0] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 text-[11px] font-mono text-[#707974] dark:text-[#A7B9AA]">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Service</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Staff</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DED8] dark:divide-[#D8DED8]/15">
                  {sampleAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-[#F7F6F0]/60 dark:hover:bg-[#10251D]/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#10251D] dark:text-[#FFFFFF]">
                        {apt.time}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#10251D] dark:text-[#FFFFFF]">
                        {apt.customer}
                      </td>
                      <td className="py-2.5 px-3 text-[#404944] dark:text-[#D8DED8] hidden sm:table-cell">
                        {apt.service}
                      </td>
                      <td className="py-2.5 px-3 text-[#707974] dark:text-[#A7B9AA] hidden sm:table-cell">
                        {apt.staff}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${apt.statusBadge}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#046A38] dark:text-[#9EF6B6] font-semibold text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Instant audio alert upon every new booking</span>
              </div>

              <Link
                href="/register"
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#046A38] hover:bg-[#043D2E] text-[#FFFFFF] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer text-xs"
              >
                <span>Launch Your Business</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
