"use client";

import React, { useState } from "react";
import { Phone, CheckCircle2, ArrowRight, Instagram } from "lucide-react";
import { VISRO_PHONE, VISRO_PHONE_TEL, VISRO_INSTAGRAM_URL } from "@/components/brand/VisroSlotLogo";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "An unexpected error occurred. Please call +91 93913 54003 or message @visroslot on Instagram."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-[#F7F6F0] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#046A38] dark:text-[#9EF6B6] block">
            Get In Touch
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
            Talk to our team
          </h2>
          <p className="text-base text-[#404944] dark:text-[#D8DED8] leading-relaxed">
            Have questions about VISROSLOT or need help setting up your booking page? Contact us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Direct channels (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#046A38] dark:text-[#9EF6B6] uppercase tracking-wider block mb-1">
                Direct Phone Call
              </span>
              <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Call our support team
              </h3>
              <p className="mt-1 text-xs text-[#404944] dark:text-[#D8DED8]">
                Speak directly with our team for questions or onboarding assistance.
              </p>
              <a
                href={VISRO_PHONE_TEL}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#10251D] dark:text-[#FFFFFF] hover:text-[#046A38] transition-colors font-mono"
              >
                <div className="w-8 h-8 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{VISRO_PHONE}</span>
              </a>
            </div>

            <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#046A38] dark:text-[#9EF6B6] uppercase tracking-wider block mb-1">
                Instagram Direct
              </span>
              <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Message us on Instagram
              </h3>
              <p className="mt-1 text-xs text-[#404944] dark:text-[#D8DED8]">
                Send a quick message anytime for fast answers and onboarding help.
              </p>
              <a
                href={VISRO_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#10251D] dark:text-[#FFFFFF] hover:text-[#046A38] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </div>
                <span>@visroslot</span>
              </a>
            </div>
          </div>

          {/* Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  Message Sent
                </h3>
                <p className="text-sm text-[#404944] dark:text-[#D8DED8] max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out, <strong>{formData.name}</strong>. We will get back to you promptly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", phone: "", message: "" });
                  }}
                  className="px-5 py-2 rounded-md text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:bg-[#F7F6F0] transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF] mb-2">
                  Send us a message
                </h3>

                {errorMessage && (
                  <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-bold text-[#10251D] dark:text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#10251D] dark:text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#10251D] dark:text-[#FFFFFF] mb-1.5 uppercase tracking-wider">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your business or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-md text-xs font-bold uppercase tracking-wider font-mono text-[#FFFFFF] bg-[#046A38] hover:bg-[#043D2E] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? "Sending Message..." : "Send Message"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
