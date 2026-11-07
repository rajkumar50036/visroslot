import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HowItWorks from "@/components/landing/HowItWorks";
import Link from "next/link";
import { ArrowRight, Phone, Instagram } from "lucide-react";

export const metadata = {
  title: "How It Works — VisroSlot",
  description: "Get started with VisroSlot in three simple steps. Create your profile, add services, and share your booking link.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6] block mb-2">
            Simple Process
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#10251D] dark:text-[#FFFFFF]">
            Get started in three simple steps
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#404944] dark:text-[#D8DED8] max-w-2xl mx-auto leading-relaxed">
            Setting up your online booking page is quick and straightforward. You can be ready to receive customer bookings in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-md text-sm font-bold text-white bg-[#046A38] hover:bg-[#043D2E] shadow-sm transition-all flex items-center gap-2"
            >
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+919391354003"
              className="px-6 py-3 rounded-md text-sm font-semibold text-[#10251D] dark:text-[#FFFFFF] bg-white dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:bg-[#F7F6F0] transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
              <span>Free Onboarding Call</span>
            </a>
          </div>
        </div>

        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}
