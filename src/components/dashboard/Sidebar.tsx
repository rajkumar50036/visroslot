"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Layers, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  UserCheck,
  Lock
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import SlotoraLogo from "@/components/brand/SlotoraLogo";
import { getUserPersonalBusiness, OWNER_EMAIL } from "@/lib/auth/userBusiness";

export function Sidebar() {
  const pathname = usePathname();
  const [businessSlug, setBusinessSlug] = useState<string>("aura-wellness");
  const [businessName, setBusinessName] = useState<string>("Slotora Business");
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadCurrentBusiness() {
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) return;

      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

      if (uid) {
        try {
          const userEmail = auth?.currentUser?.email?.toLowerCase() || "";

          const [userSnap, userCtx] = await Promise.all([
            getDoc(doc(db, "users", uid)),
            getUserPersonalBusiness(db, uid, userEmail),
          ]);

          const userData = userSnap.exists() ? userSnap.data() : null;
          const isOwner =
            userCtx.isOwner ||
            userCtx.isFounder ||
            uid === "vMZQTGlYSfM8adohQAZmSE3cNX02" ||
            userEmail === OWNER_EMAIL;

          if (isOwner) {
            setIsPaid(true);
            setBusinessName("Rajkumar Headquarters");
            setBusinessSlug("rajkumar-hq");
            return;
          }

          const bus = userCtx.business;
          const sub = userCtx.subscription;

          const slug = bus?.slug || userData?.bookingSlug || userData?.slug || "aura-wellness";
          const name = bus?.name || userData?.businessName || userData?.fullName || "Slotora Business";

          if (slug) setBusinessSlug(slug);
          if (name) setBusinessName(name);

          const now = new Date();
          const subExpiresAt =
            sub?.paid_through_date ||
            sub?.expires_at ||
            sub?.renewal_date ||
            sub?.trialEndAt ||
            (bus as any)?.subscription_expires_at ||
            (bus as any)?.trial_ends_at ||
            userData?.paid_through_date;

          const isDateExpired = subExpiresAt ? new Date(subExpiresAt) < now : false;

          const subStatus = (
            sub?.status ||
            sub?.subscriptionStatus ||
            bus?.subscription_status ||
            userData?.subscription_status ||
            ""
          ).toLowerCase();

          const isStatusActive =
            subStatus === "active" ||
            subStatus === "trialing" ||
            subStatus === "trial";

          const hasPaymentVerified = Boolean(
            userData?.payment_verified === true ||
            userData?.paymentVerified === true ||
            userData?.sharingLinkUnlocked === true ||
            (bus as any)?.payment_verified === true ||
            (bus as any)?.paymentVerified === true ||
            (bus as any)?.sharingLinkUnlocked === true ||
            bus?.lifetime_free === true ||
            (bus as any)?.is_paid === true
          );

          if (!isDateExpired && (hasPaymentVerified || isStatusActive || Boolean(sub))) {
            setIsPaid(true);
          } else {
            setIsPaid(false);
          }
        } catch (err) {
          console.error("Sidebar load error:", err);
        }
      }
    }
    loadCurrentBusiness();
  }, []);

  const navItems = [
    {
      href: "/dashboard",
      label: "Appointments",
      icon: CalendarIcon,
    },
    {
      href: "/dashboard/services",
      label: "Services",
      icon: Layers,
    },
    {
      href: "/dashboard/availability",
      label: "Working Hours",
      icon: Clock,
    },
    {
      href: "/dashboard/customers",
      label: "Customers CRM",
      icon: Users,
    },
    {
      href: "/dashboard/staff",
      label: "Staff Team",
      icon: UserCheck,
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      href: "/dashboard/settings",
      label: "Business Settings",
      icon: Settings,
    },
  ];

  const handleCopyBookingLink = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/book/${businessSlug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSigningOut(true);

    try {
      const { auth } = getFirebaseClient();
      if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Firebase auth signOut error:", err);
    }

    if (typeof document !== "undefined") {
      document.cookie = "visroslot_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "slotora_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("visroslot_session");
        window.localStorage.removeItem("slotora_session");
        window.sessionStorage.clear();
      }
    } catch (e) {}

    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      console.error("Server logout error:", err);
    }

    if (typeof window !== "undefined") {
      window.location.replace("/login?logout=true");
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col shrink-0 z-40 bg-[#171717] text-[#DCD8CF] border-r border-[#262626] select-none font-sans">
      <div className="w-64 h-full flex flex-col justify-between p-4 bg-[#171717]">
        
        {/* Top Brand Context */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex flex-col gap-1.5 pb-3 border-b border-[#262626] group">
            <SlotoraLogo variant="light" size="sm" />
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8E56A] animate-pulse"></span>
              <span className="text-[11px] text-[#A39E93] font-medium truncate font-mono">
                {businessName}
              </span>
            </div>
          </Link>

          {/* Copy Public Booking Link Button - Only available AFTER paying */}
          {isPaid ? (
            <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-[#A39E93]">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#E75A32]">●</span> Booking Link
                </span>
                <Link 
                  href={`/book/${businessSlug}`} 
                  target="_blank" 
                  className="hover:text-[#F5F0E6] transition-colors"
                  title="Open client booking page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-[10px] font-mono text-[#DCD8CF] truncate bg-[#171717] px-2.5 py-1.5 rounded-lg border border-[#2e2e2e]">
                /book/{businessSlug}
              </div>
              <button
                onClick={handleCopyBookingLink}
                className="w-full py-2 px-2.5 rounded-lg bg-[#E75A32] hover:bg-[#D24823] text-white text-[11px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied!" : "Copy Booking URL"}</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-amber-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Booking Link Locked
                </span>
              </div>
              <p className="text-[10px] text-[#A39E93] leading-tight font-sans">
                Sharing link is provided after subscription activation.
              </p>
              <Link
                href="/pricing"
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1 transition-all"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Unlock Sharing Link</span>
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-[#E75A32] text-white font-bold shadow-md shadow-[#E75A32]/20"
                      : "text-[#A39E93] hover:text-[#F5F0E6] hover:bg-[#222222]"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#77736D]"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Account & Logout */}
        <div className="pt-3 border-t border-[#262626] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#A39E93] hover:text-[#E75A32] hover:bg-[#222222] transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-mono text-xs">{signingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
