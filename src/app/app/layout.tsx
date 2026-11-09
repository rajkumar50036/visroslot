"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VisroSlotSidebar } from "@/components/dashboard/VisroSlotSidebar";
import { VisroSlotLogo } from "@/components/brand/VisroSlotLogo";
import { Menu, LayoutDashboard, CalendarCheck2, CalendarDays, Layers, MoreHorizontal } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { RealtimeAppointmentAlerts } from "@/components/dashboard/RealtimeAppointmentAlerts";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getUserPersonalBusiness } from "@/lib/auth/userBusiness";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const { auth, db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) return;

    const unsubscribe = auth?.onAuthStateChanged(async (user) => {
      const uid =
        user?.uid ||
        (typeof document !== "undefined"
          ? document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]
          : null);
      if (!uid) return;

      try {
        const userCtx = await getUserPersonalBusiness(db, uid, user?.email);
        if (userCtx.business?.id) {
          setBusinessId(userCtx.business.id);
        } else {
          const busSnap = await getDocs(
            query(collection(db, "businesses"), where("owner_id", "==", uid))
          );
          if (!busSnap.empty) {
            setBusinessId(busSnap.docs[0].id);
          }
        }
      } catch (e) {
        console.warn("AppLayout business lookup error:", e);
      }
    });

    return () => unsubscribe?.();
  }, []);

  const mobileTabs = [
    { href: "/app/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/app/appointments", label: "Bookings", icon: CalendarCheck2 },
    { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/app/services", label: "Services", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-navy-950 dark:text-white font-sans flex flex-col lg:flex-row transition-colors duration-200">
      {/* Mobile Top Header (Visible strictly on mobile & tablet < 1024px) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200 dark:border-gold-500/20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-gold-500" />
          </button>
          <VisroSlotLogo size="sm" href="/app/overview" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="segmented" size="sm" />
        </div>
      </header>

      {/* Sidebar: Off-canvas drawer on mobile, static 64-width column on desktop */}
      <VisroSlotSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main App Content Area: 100% full screen on mobile, offset by lg:ml-64 on desktop */}
      <main className="w-full lg:ml-64 flex-1 min-h-[calc(100vh-53px)] lg:min-h-screen p-3.5 sm:p-6 lg:p-10 pb-24 lg:pb-10 bg-slate-50/60 dark:bg-navy-950/95 overflow-x-hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>

      {/* Mobile Bottom Quick Navigation Bar (Sticky at bottom on phones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href === "/app/overview" && pathname === "/app");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-gold-600 dark:text-gold-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-gold-500" : ""}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <MoreHorizontal className="w-5 h-5 text-gold-500" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* Real-time Web Audio Booking Chime and In-App Alert for Owner */}
      {businessId && <RealtimeAppointmentAlerts businessId={businessId} />}
    </div>
  );
}
