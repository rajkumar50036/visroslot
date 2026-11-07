import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { VisroContactPhone } from "@/components/brand/VisroSlotLogo";

export const metadata = {
  title: "Privacy Policy — VISROSLOT",
  description: "Privacy policy and data protection standards for VISROSLOT.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] text-[#1B1C19] dark:bg-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="border-b border-[#D8DED8] dark:border-[#D8DED8]/20 pb-8">
            <span className="font-mono text-xs uppercase tracking-widest text-[#046A38] dark:text-[#9EF6B6]">
              DATA PROTECTION STANDARDS
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-[#10251D] dark:text-[#FFFFFF] mt-2">
              PRIVACY POLICY
            </h1>
            <p className="text-xs font-mono text-[#707974] dark:text-[#A7B9AA] mt-2">
              Effective Date: November 1, 2026 • Platform: VISROSLOT
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-[#404944] dark:text-[#D8DED8] text-sm leading-relaxed space-y-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">1. Information We Collect</h2>
              <p>
                We collect information provided directly by businesses and clients during account registration, service configuration, and appointment booking. This includes business name, address, contact phone, email, staff rosters, and customer booking details (name, phone, email, notes).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">2. How Information Is Used</h2>
              <p>
                Information is strictly used to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-navy-300">
                <li>Facilitate atomic appointment booking and automated employee dispatch</li>
                <li>Generate and deliver digital QR vouchers and reschedule tokens</li>
                <li>Provide business tenants with CRM customer records and real analytics</li>
                <li>Process subscription payments and tax invoicing through Razorpay</li>
                <li>Prevent fraudulent transactions and system abuse</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">3. Multi-Tenant Data Isolation</h2>
              <p>
                VISROSLOT enforces business-level isolation via Cloud Firestore security rules. No tenant can view, access, or query customer or appointment data belonging to another tenant. Public booking endpoints expose only approved public business metadata (services, duration, prices, live availability slots).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">4. Third-Party Integrations</h2>
              <p>
                Payment card and UPI transactions are handled directly by Razorpay under industry-standard PCI-DSS compliance. VISROSLOT does not store full credit card numbers or banking secrets.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white uppercase font-display">5. Data Privacy Inquiries</h2>
              <p>
                If you have questions regarding your data or wish to exercise data deletion rights, contact support@visroslot.com or reach out on Instagram @visroslot.
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
