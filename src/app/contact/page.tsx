import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ContactSection from "@/components/landing/ContactSection";

export const metadata = {
  title: "Contact Us — VisroSlot",
  description: "Talk to our team. Call +91 93913 54003 or message us on Instagram @visroslot.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
