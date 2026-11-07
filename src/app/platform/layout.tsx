"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Receipt,
  PhoneCall,
  BarChart3,
  Settings,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ExternalLink,
  Loader2,
  Lock,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";

const FOUNDER_UIDS = ["vMZQTGlYSfM8adohQAZmSE3cNX02", "B0BY4eXhWzdPfzT5dl2dTieDkKp1"];
const FOUNDER_EMAILS = ["rajkumar50036@gmail.com"];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const { auth, isConfigured } = getFirebaseClient();
    const sessionUid =
      auth?.currentUser?.uid ||
      (typeof document !== "undefined" &&
        (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
          document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

    const userEmail = auth?.currentUser?.email?.toLowerCase() || "";
    const isFounder =
      FOUNDER_UIDS.includes(sessionUid || "") ||
      FOUNDER_EMAILS.includes(userEmail) ||
      process.env.NODE_ENV !== "production";

    if (isFounder) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const navItems = [
    { href: "/platform/overview", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/platform/businesses", label: "Tenant Businesses", icon: Building2 },
    { href: "/platform/users", label: "Platform Users", icon: Users },
    { href: "/platform/plans", label: "Plans & Pricing Config", icon: CreditCard },
    { href: "/platform/subscriptions", label: "Subscriptions Ledger", icon: ShieldCheck },
    { href: "/platform/payments", label: "Razorpay Transactions", icon: Receipt },
    { href: "/platform/leads", label: "Sales CRM & Leads", icon: PhoneCall },
    { href: "/platform/support", label: "Support Tickets", icon: HelpCircle },
    { href: "/platform/analytics", label: "Global Platform Analytics", icon: BarChart3 },
    { href: "/platform/settings", label: "Master Settings", icon: Settings },
  ];

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-navy-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase text-navy-300">
          Verifying Founder Authority...
        </span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-navy-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
          Restricted Founder Platform
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-navy-300 max-w-md">
          Access to /platform/* is reserved strictly for the Platform Owner (rajkumar50036@gmail.com).
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-gold-400 text-navy-950 font-mono text-xs font-bold shadow-gold"
          >
            Sign in as Founder
          </Link>
          <Link
            href="/app/overview"
            className="px-6 py-2.5 rounded-full bg-navy-900 border border-navy-700 text-white font-mono text-xs font-bold"
          >
            Tenant Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D1E] text-white font-sans flex">
      {/* Super Admin Fixed Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col shrink-0 z-40 bg-[#070D1E] text-navy-200 border-r border-gold-500/20 select-none overflow-y-auto">
        <div className="w-64 min-h-full flex flex-col justify-between p-4 bg-[#070D1E]">
          <div className="space-y-4">
            <div className="pb-3 border-b border-navy-800">
              <VisroSlotLogo variant="light" size="sm" href="/platform/overview" />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-navy-900 text-[10px] font-mono">
                <span className="text-gold-400 font-bold">SUPER ADMIN CONSOLE</span>
                <span className="px-1.5 py-0.2 rounded bg-gold-400/20 text-gold-300 border border-gold-500/40 font-bold">
                  ROOT
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 font-bold shadow-gold"
                        : "text-navy-300 hover:text-white hover:bg-navy-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-navy-950" : "text-gold-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-navy-800 space-y-2 mt-4">
            <Link
              href="/app/overview"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-navy-300 hover:text-white hover:bg-navy-900 transition-colors"
            >
              <span>← Tenant Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 min-h-screen p-6 sm:p-8 md:p-10 bg-[#070D1E] overflow-x-hidden">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
