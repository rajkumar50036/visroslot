import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { VisroContactPhone } from "@/components/brand/VisroSlotLogo";

export const metadata = {
  title: "Terms of Service — VISROSLOT",
  description: "Terms and conditions for VISROSLOT appointment booking SaaS.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="border-b border-[#D8DED8] dark:border-[#D8DED8]/20 pb-8">
            <span className="font-mono text-xs uppercase tracking-widest text-[#046A38] dark:text-[#9EF6B6]">
              LEGAL DOCUMENTATION
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-[#10251D] dark:text-[#FFFFFF] mt-2">
              TERMS OF SERVICE
            </h1>
            <p className="text-xs font-mono text-[#707974] dark:text-[#A7B9AA] mt-2">
              Effective Date: November 1, 2026 • Platform: VISROSLOT
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-[#404944] dark:text-[#D8DED8] text-sm leading-relaxed space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the VISROSLOT platform (including web dashboards, APIs, and public booking portals), you agree to be bound by these Terms of Service. If you are entering into these terms on behalf of a business entity, you represent that you have legal authority to bind such entity.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">2. Business Accounts & Responsibilities</h2>
              <p>
                Tenants are responsible for maintaining the confidentiality of their credentials, configuring accurate staff shift rosters, services, and pricing. You agree not to upload fraudulent data or use the appointment booking platform for any unlawful purpose.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">3. Subscriptions & Billing</h2>
              <p>
                VISROSLOT offers Professional (₹499/month, ₹4,990/year) and Business (₹999/month, ₹9,990/year) subscription tiers. Payments are processed securely via Razorpay. Subscriptions are billed in advance on a recurring monthly or annual basis. When a subscription expires or fails to renew, booking is paused until renewal is completed, while existing confirmed records and customer profiles remain preserved.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">4. Automated Staff Allocation</h2>
              <p>
                VISROSLOT automatically assigns available staff to appointments to prevent workload imbalances and scheduling conflicts. While our atomic Firestore engine guarantees zero double bookings, tenants remain responsible for ensuring staff honor assigned schedules.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">5. Contact & Support</h2>
              <p>
                For questions regarding these terms, contact our support team at support@visroslot.com or on Instagram @visroslot.
              </p>
            </section>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-navy-800">
            <VisroContactPhone showIcon={true} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
