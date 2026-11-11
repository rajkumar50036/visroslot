"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, Globe, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      badgeColor: "bg-[#10251D] text-[#FFFFFF]",
      title: "Choose 7-Day Free Trial Plan",
      description: "Pick Starter (₹499/mo) or Premium (₹999/mo). Test all booking features risk-free with ₹0 charged today.",
      icon: CheckCircle2,
    },
    {
      num: "02",
      badgeColor: "bg-[#046A38] text-[#FFFFFF]",
      title: "1-Click AutoPay Mandate Setup",
      description: "Authorize your trial securely via Razorpay. The ₹2 verification token is automatically refunded to your bank account immediately.",
      icon: CreditCard,
    },
    {
      num: "03",
      badgeColor: "bg-[#043D2E] text-[#FFFFFF]",
      title: "Create Business Profile & Launch",
      description: "Enter your business name, get your dedicated live booking link and instant storefront QR code, and start taking appointments!",
      icon: Globe,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#FFFFFF] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-widest">
            Rapid Deployment
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            Get your business organised in three simple steps.
          </h2>
          <p className="text-base text-[#404944] dark:text-[#D8DED8] max-w-xl mx-auto leading-relaxed">
            Set up your online appointment booking system in minutes with zero technical overhead.
          </p>
        </div>

        {/* 3 Step Cards Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-[#F7F6F0] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-full ${step.badgeColor} flex items-center justify-center font-bold text-sm font-mono shadow-xs`}>
                      {step.num}
                    </div>
                    <Icon className="w-5 h-5 text-[#046A38] dark:text-[#9EF6B6]" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-xs sm:text-sm font-bold text-[#FFFFFF] bg-[#046A38] hover:bg-[#03522b] shadow-md transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span>Start 7-Day Free Trial (₹0 Today)</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
