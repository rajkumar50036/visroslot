"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Pricing from "@/components/landing/Pricing";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function VisroSlotLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-white font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      {/* Official Top Navigation */}
      <Navbar />

      <main>
        {/* 1. Hero Section with 7-Day Free Trial & Fast Plan Option Animation */}
        <Hero />

        {/* 2. Simple, Predictable Pricing Plans (Starter ₹499 vs Premium ₹999 + AutoPay 7-Day Free Trial) */}
        <Pricing />

        {/* 3. Three-Step Customer Journey (Plan -> AutoPay Mandate -> Business Profile) */}
        <HowItWorks />

        {/* 4. Core Scheduling & Appointment Features */}
        <Features />

        {/* 5. Frequently Asked Questions */}
        <FAQ />

        {/* 6. Final Call to Action */}
        <FinalCTA />
      </main>

      {/* 7. Official Clean Footer */}
      <Footer />
    </div>
  );
}
