"use client";

import React, { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import {
  UserPlus,
  CreditCard,
  Building,
  Briefcase,
  Users,
  Share2,
  Calendar,
  ShieldCheck,
  HelpCircle,
  Phone,
  Instagram,
  ArrowRight,
  ChevronDown,
  Search,
} from "lucide-react";

interface HelpSection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  steps: {
    title: string;
    description: string;
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    number: "01",
    title: "Getting Started & Account Setup",
    icon: UserPlus,
    summary: "How to register your account and log into the VISROSLOT platform.",
    steps: [
      {
        title: "Create your account",
        description:
          "Visit the platform website and click 'Get Started'. Enter your full name, email address, and a secure password, or sign in instantly with Google.",
      },
      {
        title: "Verify your email",
        description:
          "You will receive an automated verification email. Click the confirmation link to secure your account credentials.",
      },
      {
        title: "Log in anytime",
        description:
          "Use the 'Sign In' button on the top right to access your business administration portal on desktop, tablet, or mobile browser.",
      },
    ],
  },
  {
    id: "plan-trial",
    number: "02",
    title: "Plan Selection & 7-Day Free Trial",
    icon: CreditCard,
    summary: "Choose between Professional and Business plans and activate your 7-day trial.",
    steps: [
      {
        title: "Select your tier and billing cycle",
        description:
          "Choose Professional (₹499/mo or ₹4,990/yr for up to 3 staff) or Business (₹999/mo or ₹9,990/yr for up to 10 staff).",
      },
      {
        title: "Authorize Razorpay AutoPay mandate",
        description:
          "Authorize your recurring mandate securely through UPI or card. Zero rupees are charged upfront during trial setup.",
      },
      {
        title: "Trial parameters and safeguards",
        description:
          "During your 7-day trial, you can test with 1 staff member and accept up to 10 real appointments. If you cancel before Day 8, zero charges are ever billed.",
      },
    ],
  },
  {
    id: "business-profile",
    number: "03",
    title: "Business Profile Setup",
    icon: Building,
    summary: "Configure your business name, trade category, and personalized web address.",
    steps: [
      {
        title: "Enter trade details",
        description:
          "Add your public business name, select your business category (Salon, Clinic, Spa, Fitness, Advisory, etc.), and provide your business contact number.",
      },
      {
        title: "Claim your custom booking URL",
        description:
          "Enter your preferred link name (e.g. /book/yourbusiness). The system verifies that this address is unique to you.",
      },
      {
        title: "Set operating hours",
        description:
          "Define your weekly opening and closing times, lunch breaks, and non-working holidays.",
      },
    ],
  },
  {
    id: "services",
    number: "04",
    title: "Adding & Managing Services",
    icon: Briefcase,
    summary: "Add your menu of services with prices and time durations.",
    steps: [
      {
        title: "Add your first service",
        description:
          "In your dashboard under 'Services', click 'Add Service'. Enter the service title (e.g., 'Signature Haircut' or 'Initial Consultation').",
      },
      {
        title: "Set duration and buffer time",
        description:
          "Select how long the appointment takes (e.g., 30 mins, 45 mins, 60 mins) and configure optional buffer intervals so staff can prepare between appointments.",
      },
      {
        title: "Set pricing & visibility",
        description:
          "Specify the service fee. You can mark services as active or hide seasonal services whenever needed.",
      },
    ],
  },
  {
    id: "staff",
    number: "05",
    title: "Adding & Managing Staff",
    icon: Users,
    summary: "Add team members and assign them to specific service offerings.",
    steps: [
      {
        title: "Add team members",
        description:
          "Go to 'Staff' in your dashboard and click 'Add Staff Member'. Input their name, contact information, and role.",
      },
      {
        title: "Assign individual shifts",
        description:
          "Configure each staff member's working days and shift hours. Appointments can only be booked during their scheduled availability.",
      },
      {
        title: "Link staff to services",
        description:
          "Select which services each team specialist is qualified to perform so customers are booked with the right practitioner.",
      },
    ],
  },
  {
    id: "booking-link",
    number: "06",
    title: "Public Customer Booking Link",
    icon: Share2,
    summary: "Share your dedicated booking page and print your custom QR code.",
    steps: [
      {
        title: "Copy your direct link",
        description:
          "Your unique link (e.g., /book/your-brand) is active 24/7. Copy it from your dashboard with one click.",
      },
      {
        title: "Place in social bios & messaging",
        description:
          "Add the link to your Instagram bio, WhatsApp business profile greeting, Google Business profile, and website.",
      },
      {
        title: "Download printable QR code",
        description:
          "Download your high-resolution QR code to print on reception desk tents, front windows, or appointment reminder cards.",
      },
    ],
  },
  {
    id: "calendar-bookings",
    number: "07",
    title: "Appointment Calendar & Managing Bookings",
    icon: Calendar,
    summary: "Review daily appointments, manage cancellations, and avoid overlaps.",
    steps: [
      {
        title: "Real-time calendar view",
        description:
          "View all bookings by day, week, or specific staff member. Colors show status (Confirmed, Completed, Cancelled).",
      },
      {
        title: "Conflict prevention",
        description:
          "VISROSLOT automatically prevents double-bookings. Once a slot is taken for a specialist, that interval is instantly removed from the public page.",
      },
      {
        title: "Rescheduling & cancellations",
        description:
          "Both business owners and clients can reschedule appointments directly, automatically opening up the previous slot for other customers.",
      },
    ],
  },
  {
    id: "billing",
    number: "08",
    title: "Razorpay AutoPay & Billing",
    icon: ShieldCheck,
    summary: "Learn how recurring subscriptions work and how to pause or cancel.",
    steps: [
      {
        title: "Scheduled debit on Day 8",
        description:
          "Your mandate only processes payment after the 7-day free trial concludes, provided your account remains active.",
      },
      {
        title: "Cancel anytime from your dashboard",
        description:
          "You can cancel your AutoPay mandate with a single click from 'Billing' inside your dashboard before Day 8 to prevent any debit.",
      },
      {
        title: "Account data preservation",
        description:
          "If a subscription expires, your business information, customer ledger, and past appointments are safely preserved. Simply reactivate to open your public booking link again.",
      },
    ],
  },
  {
    id: "support",
    number: "09",
    title: "Support, Contact & Assistance",
    icon: HelpCircle,
    summary: "Reach our dedicated team for onboarding support or troubleshooting.",
    steps: [
      {
        title: "Phone & WhatsApp assistance",
        description:
          "Call or WhatsApp our team at +91 93913 54003 during business hours for live onboarding assistance.",
      },
      {
        title: "Direct Instagram messaging",
        description:
          "Message our verified profile @visroslot on Instagram for feature walkthroughs and quick questions.",
      },
      {
        title: "VISROSLOT AI Assistant",
        description:
          "Coming soon: Built-in conversational AI will help you summarize your day's appointments and automatically answer common customer queries.",
      },
    ],
  },
];

export default function HelpCentrePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSectionId, setOpenSectionId] = useState<string | null>("getting-started");

  const filteredSections = helpSections.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = sec.title.toLowerCase().includes(query);
    const summaryMatch = sec.summary.toLowerCase().includes(query);
    const stepMatch = sec.steps.some(
      (s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
    return titleMatch || summaryMatch || stepMatch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#101A2B] dark:text-white font-sans transition-colors duration-200 selection:bg-[#C49A46] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#C49A46] block mb-2 font-mono">
            VISROSLOT Knowledge Base
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Help Centre & Documentation
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Step-by-step guides to help you set up your account, configure services and staff, accept customer bookings, and manage subscriptions.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. staff, trial, AutoPay, booking link)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C49A46] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* 9 Structured Categories */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isOpen = openSectionId === sec.id;

            return (
              <div
                key={sec.id}
                id={sec.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7F5F0] dark:bg-slate-900 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenSectionId(isOpen ? null : sec.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-[#C49A46] flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-[#C49A46]">
                          {sec.number}
                        </span>
                        <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {sec.title}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {sec.summary}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? "rotate-180 text-[#C49A46]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4 bg-white/50 dark:bg-slate-950/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {sec.steps.map((st, sIdx) => (
                        <div
                          key={st.title}
                          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <span className="inline-block w-6 h-6 rounded-full bg-[#C49A46]/10 text-[#C49A46] font-mono text-xs font-bold text-center leading-6 mb-2">
                              {sIdx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {st.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {st.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="text-center py-12 p-8 rounded-2xl bg-[#F7F5F0] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No guides matching &quot;{searchQuery}&quot;. Try searching for &quot;trial&quot;, &quot;staff&quot;, or &quot;booking&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Live Support Box */}
        <div className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#F7F5F0] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Still have questions? We are here to help.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg">
                Speak directly with our team for assistance setting up your booking page, configuring team schedules, or managing your subscription.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href="tel:+919391354003"
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:text-[#C49A46] text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Phone className="w-4 h-4 text-[#C49A46]" />
                <span>+91 93913 54003</span>
              </a>
              <a
                href="https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:text-[#C49A46] text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Instagram className="w-4 h-4 text-[#C49A46]" />
                <span>@visroslot</span>
              </a>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-[#C49A46] hover:bg-[#D9B66E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
