import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";

export const metadata = {
  title: "Pricing Plans — VisroSlot",
  description: "Simple and transparent pricing for VisroSlot. Starter plan at ₹499/month and Premium plan at ₹999/month, with 2 months free on annual plans.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <Pricing />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
