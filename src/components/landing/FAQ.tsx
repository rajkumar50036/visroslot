"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is VISROSLOT?",
      answer:
        "VISROSLOT is a dedicated appointment booking and customer scheduling platform built for service businesses like salons, dental clinics, spas, fitness studios, and independent consultants. It replaces phone-call coordination with an automated booking link, staff scheduling calendar, and sovereign customer directory.",
    },
    {
      question: "How does the 7-day free trial operate?",
      answer:
        "Eligible businesses receive 7 full days of platform access with no upfront credit card required. You can test live client bookings, configure staff rosters, and trial the interactive operational dashboard completely risk-free.",
    },
    {
      question: "Can I use my booking link on WhatsApp & Instagram?",
      answer:
        "Yes. Every registered business receives a branded public URL and instant QR code. You can paste the URL into your Instagram bio, attach it to WhatsApp business replies, or place it on Google Business profiles.",
    },
    {
      question: "How does automated staff assignment work?",
      answer:
        "VISROSLOT checks your team's configured working schedule and existing calendar appointments, then automatically assigns an active specialist who is free during the chosen time. This ensures balanced workload distribution and eliminates double-bookings.",
    },
    {
      question: "Are customer records and appointments secure?",
      answer:
        "All data is strictly encrypted in transit and at rest. You retain complete, exclusive ownership of your customer database, client histories, and private notes without third-party data monetization.",
    },
    {
      question: "Can I upgrade from Professional to Business?",
      answer:
        "Yes. You can upgrade from Professional to Business Suite anytime directly from your dashboard. Upgrading unlocks unlimited monthly appointments, up to 10 staff members, and advanced performance analytics immediately.",
    },
    {
      question: "How quickly does my booking link go live?",
      answer:
        "Your public booking link and QR code are active immediately upon completing your business profile setup. You can share your link instantly on WhatsApp, Instagram, or print the QR code for your store counter.",
    },
    {
      question: "How do I get help or support?",
      answer:
        "Our support team is available by phone at +91 93913 54003 and via direct message on Instagram at @visroslot. We provide direct onboarding assistance and technical guidance for all active businesses.",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#FFFFFF] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-widest">
            Help &amp; Documentation
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#404944] dark:text-[#D8DED8] leading-relaxed">
            Everything you need to know about VISROSLOT and platform operations.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-[#046A38] bg-[#F7F6F0] dark:bg-[#043D2E] shadow-xs"
                    : "border-[#D8DED8] dark:border-[#D8DED8]/20 bg-[#FFFFFF] dark:bg-[#10251D] hover:border-[#046A38]/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#10251D] dark:text-[#FFFFFF]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed border-t border-[#D8DED8]/40 dark:border-[#D8DED8]/15 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
