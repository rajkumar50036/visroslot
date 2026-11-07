"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import {
  Calendar,
  Clock,
  RefreshCw,
  Ban,
  Users,
  FileText,
  Bell,
  Star,
  UserCheck,
  Tag,
  BarChart3,
  Smartphone,
  Sparkles,
  Bot,
  MessageSquare,
  ArrowRight,
  Phone,
  CheckCircle2,
} from "lucide-react";

interface FeaturePillar {
  title: string;
  category: string;
  description: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
}

const featurePillars: FeaturePillar[] = [
  {
    category: "Pillar 1",
    title: "Appointment Management",
    description: "Streamline how clients book, reschedule, and attend services with zero scheduling headaches.",
    items: [
      {
        icon: Calendar,
        title: "24/7 Self-Service Online Booking",
        description: "Your personalized booking link is always open. Clients book at their convenience from any smartphone or browser.",
      },
      {
        icon: Clock,
        title: "Real-Time Slot Calendar & Conflict Prevention",
        description: "Intelligent slot matrix ensures no double-booking ever occurs. Slots update immediately as appointments are booked.",
      },
      {
        icon: RefreshCw,
        title: "Automatic Buffer Times",
        description: "Set custom intervals (e.g., 10 or 15 minutes) between appointments so your team can sanitize, rest, or prepare.",
      },
      {
        icon: Ban,
        title: "Seamless Rescheduling & Cancellation",
        description: "Empower clients to reschedule or cancel with proper advance notice, immediately releasing the slot for other customers.",
      },
    ],
  },
  {
    category: "Pillar 2",
    title: "Customer Management",
    description: "Build long-term client relationships with a centralized customer ledger and automated communications.",
    items: [
      {
        icon: Users,
        title: "Customer Directory & Visit Ledger",
        description: "Automatic profiles for every customer showing their full visit history, favorite services, and lifetime bookings.",
      },
      {
        icon: FileText,
        title: "Client Notes & Preferences",
        description: "Record specific styling instructions, allergy notes, or preferences to deliver a personalized experience on every visit.",
      },
      {
        icon: Bell,
        title: "Automated Confirmations & Reminders",
        description: "Instant booking confirmations and timely reminder notifications keep clients informed and drastically cut no-shows.",
      },
      {
        icon: Star,
        title: "Feedback & Reviews Collection",
        description: "Collect direct customer ratings and reviews right after service completion to build your local business reputation.",
      },
    ],
  },
  {
    category: "Pillar 3",
    title: "Business Management",
    description: "Control your staff schedules, service menus, and performance analytics from a single command center.",
    items: [
      {
        icon: UserCheck,
        title: "Staff Scheduling & Working Hours",
        description: "Configure individual working shifts, breaks, and days off for up to 10 staff members across multiple disciplines.",
      },
      {
        icon: Tag,
        title: "Service Catalog & Custom Pricing",
        description: "Set distinct prices, descriptions, and durations for each service. Enable or disable seasonal offerings easily.",
      },
      {
        icon: BarChart3,
        title: "Real-Time Analytics & Usage Reports",
        description: "Track appointment volume, busiest days, popular services, and staff capacity with clear, exportable metrics.",
      },
      {
        icon: Smartphone,
        title: "Multi-Device Responsive Access",
        description: "Optimized for mobile, tablet, and desktop so you and your team can monitor bookings on the go.",
      },
    ],
  },
  {
    category: "Pillar 4 • Next-Gen",
    title: "Smart Business Assistance (VISROSLOT AI)",
    description: "Next-generation artificial intelligence to assist business owners and customers alike.",
    items: [
      {
        icon: Bot,
        title: "Conversational Booking Concierge",
        description: "Upcoming customer AI allows clients to book via natural language chat, answering questions and finding open slots automatically.",
      },
      {
        icon: Sparkles,
        title: "Daily Owner Morning Briefing",
        description: "Get an instant summary of your day's schedule, VIP client visits, high-revenue slots, and staff workload every morning.",
      },
      {
        icon: MessageSquare,
        title: "Automated Customer FAQ Resolution",
        description: "AI answers routine inquiries about opening hours, pricing, location, and parking without interrupting your work.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6] block mb-2">
            VISROSLOT Platform Capabilities
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#10251D] dark:text-[#FFFFFF]">
            Built for Businesses That Value Time
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
            Everything your business needs to let customers book appointments online, manage your team schedules, and grow revenue without confusion.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-md text-xs sm:text-sm font-bold text-white bg-[#046A38] hover:bg-[#043D2E] shadow-sm transition-all flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+919391354003"
              className="px-6 py-3 rounded-md text-xs sm:text-sm font-semibold text-[#10251D] dark:text-[#FFFFFF] bg-white dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:bg-[#F7F6F0] transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
              <span>Call +91 93913 54003</span>
            </a>
          </div>
        </div>

        {/* 4 Feature Pillars */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {featurePillars.map((pillar, pIdx) => (
            <div
              key={pillar.title}
              className="p-8 sm:p-12 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 bg-[#FFFFFF] dark:bg-[#043D2E] shadow-xs"
            >
              <div className="max-w-3xl mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <span>{pillar.category}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {pillar.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="p-6 rounded-md bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#10251D] dark:text-[#FFFFFF]">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 rounded-lg bg-[#10251D] text-white border border-[#D8DED8]/20 shadow-xl space-y-6">
            <h3 className="font-display text-2xl sm:text-3xl font-bold">
              Ready to simplify your business appointments?
            </h3>
            <p className="text-sm text-[#D8DED8] max-w-lg mx-auto leading-relaxed">
              Start your 7-day free trial today. Set up in under 5 minutes with full access to online booking, calendar management, and staff scheduling.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/pricing"
                className="px-8 py-3.5 rounded-md text-xs sm:text-sm font-bold text-white bg-[#046A38] hover:bg-[#043D2E] shadow-md transition-all"
              >
                Start 7-Day Free Trial
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3.5 rounded-md text-xs sm:text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all"
              >
                View Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
