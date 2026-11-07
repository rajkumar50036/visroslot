import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import FAQ from "@/components/landing/FAQ";

export const metadata = {
  title: "Frequently Asked Questions — VisroSlot",
  description: "Find clear answers to questions about online bookings, automatic staff assignment, pricing, and getting started on VisroSlot.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
