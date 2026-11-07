"use client";

import React from "react";
import Link from "next/link";
import { Phone, Instagram, ArrowUp } from "lucide-react";
import { VisroSlotLogo, VISRO_PHONE, VISRO_PHONE_TEL, VISRO_INSTAGRAM_URL } from "@/components/brand/VisroSlotLogo";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#10251D] text-[#A7B9AA] text-xs sm:text-sm border-t border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#D8DED8]/15">
          {/* Brand info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <VisroSlotLogo size="md" href="/" />

            <p className="text-xs sm:text-sm text-[#A7B9AA] leading-relaxed max-w-sm">
              Appointments made simple for your business. Let your customers book online while you manage appointments, staff, and customer details in one place.
            </p>

            <div className="pt-2 space-y-2 text-xs text-[#D8DED8]">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <a href={VISRO_PHONE_TEL} className="hover:text-[#FFFFFF] transition-colors font-mono">
                  {VISRO_PHONE}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
                <a
                  href={VISRO_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FFFFFF] transition-colors"
                >
                  @visroslot
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Product Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#F7F6F0]">
              Product
            </div>
            <ul className="space-y-2.5 text-xs text-[#A7B9AA]">
              <li>
                <Link href="/#features" className="hover:text-[#FFFFFF] transition-colors">
                  Features &amp; Calendar
                </Link>
              </li>
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Supported Industries
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#FFFFFF] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#FFFFFF] transition-colors">
                  Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link href="/book/demo-salon" className="hover:text-[#9EF6B6] font-semibold transition-colors">
                  Live Booking Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Industries (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#F7F6F0]">
              Industries
            </div>
            <ul className="space-y-2.5 text-xs text-[#A7B9AA]">
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Salons &amp; Barbers
                </Link>
              </li>
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Clinics &amp; Dental
                </Link>
              </li>
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Spas &amp; Wellness
                </Link>
              </li>
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Fitness Studios
                </Link>
              </li>
              <li>
                <Link href="/#industries" className="hover:text-[#FFFFFF] transition-colors">
                  Consultants
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#F7F6F0]">
              Company &amp; Legal
            </div>
            <ul className="space-y-2.5 text-xs text-[#A7B9AA]">
              <li>
                <Link href="/about" className="hover:text-[#FFFFFF] transition-colors">
                  About VISROSLOT
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FFFFFF] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#FFFFFF] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FFFFFF] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-[#FFFFFF] transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#A7B9AA] gap-4">
          <div>
            © 2025 VISROSLOT Technologies Inc. All rights reserved. Every Slot. Simplified. Direct: {VISRO_PHONE}
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#FFFFFF]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#FFFFFF]">
              Privacy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-[#FFFFFF]">
              Cancellation
            </Link>
            <button
              type="button"
              onClick={scrollToTop}
              className="text-[#9EF6B6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
