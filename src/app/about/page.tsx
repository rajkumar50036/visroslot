import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Instagram, ArrowRight, Heart, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: "About Us — VisroSlot",
  description: "VisroSlot was created to make appointment management easier for service businesses. Learn our story and mission.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6] block">
              Our Story
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#10251D] dark:text-[#FFFFFF] leading-tight">
              VisroSlot was created to make appointment management easier for service businesses.
            </h1>
            <p className="text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
              We build simple, dependable software so business owners can focus on what they do best: serving their clients.
            </p>
          </div>

          {/* Emblem & Mission Box */}
          <div className="p-8 sm:p-12 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 flex flex-col md:flex-row items-center gap-8 shadow-xs">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-[#046A38]/30">
              <Image
                src="/assets/visroslot-logo.png"
                alt="VisroSlot Official Emblem"
                width={128}
                height={128}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6]">
                Every slot. Simplified.
              </span>
              <h2 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Straightforward software for real businesses
              </h2>
              <p className="text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                VisroSlot began after watching friends and local business owners struggle every day with missed phone calls, endless back-and-forth messaging, and handwritten appointment registers. We knew there had to be a more humane, reliable way to organize appointments.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Helpful, not confusing
              </h3>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                You should never need an IT degree or days of training to set your working hours or manage your appointments.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Honest and transparent
              </h3>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                No hidden transaction fees, no surprise price increases, and no locked features behind unexpected paywalls.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Real human support
              </h3>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                When you call us or send a message on Instagram, you talk to real people who care about keeping your schedule smooth.
              </p>
            </div>
          </div>

          {/* Contact & Onboarding Callout */}
          <div className="p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 text-center space-y-5">
            <h3 className="font-display text-2xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
              We are here to support your business
            </h3>
            <p className="text-sm text-[#404944] dark:text-[#D8DED8] max-w-lg mx-auto leading-relaxed">
              Whether you need help setting up your team schedules, adding services, or printing your QR code, our team is just a call or message away.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              <a
                href="tel:+919391354003"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:text-[#046A38] transition-colors font-mono text-xs font-semibold"
              >
                <Phone className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <span>+91 93913 54003</span>
              </a>
              <a
                href="https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:text-[#046A38] transition-colors text-xs font-semibold"
              >
                <Instagram className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <span>@visroslot</span>
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#046A38] text-white hover:bg-[#043D2E] transition-colors text-xs font-bold shadow-sm"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
