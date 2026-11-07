"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Benefits from "@/components/landing/Benefits";
import Features from "@/components/landing/Features";
import FeatureSpotlights from "@/components/landing/FeatureSpotlights";
import BusinessTypes from "@/components/landing/BusinessTypes";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import { LandingAiChatBox } from "@/components/landing/LandingAiChatBox";

export default function VisroSlotLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-white font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      {/* Official Top Navigation */}
      <Navbar />

      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Realistic Dashboard Preview */}
        <DashboardPreview />

        {/* 3. Six Practical Benefits */}
        <Benefits />

        {/* 4. Eight Core Product Features */}
        <Features />

        {/* 4b. Three Editorial Product Spotlights */}
        <FeatureSpotlights />

        {/* 5. Business Categories / Industries */}
        <BusinessTypes />

        {/* 6. How It Works (Three-Step Payment-First Journey) */}
        <HowItWorks />

        {/* 7. Pricing Plans (Professional & Business Suite + 7-Day Free Trial) */}
        <Pricing />

        {/* 8. Frequently Asked Questions */}
        <FAQ />

        {/* 9. Final Call to Action */}
        <FinalCTA />
      </main>

      {/* Interactive AI Customer Help Box */}
      <LandingAiChatBox />

      {/* 10. Official Clean Footer */}
      <Footer />
    </div>
  );
}
