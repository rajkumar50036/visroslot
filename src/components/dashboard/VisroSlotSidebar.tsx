"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Layers,
  UserCheck,
  Users,
  Clock,
  BarChart3,
  CreditCard,
  Receipt,
  Settings,
  HelpCircle,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Lock,
  Instagram,
  X,
  Star,
  Sparkles,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { getUserPersonalBusiness, OWNER_EMAIL } from "@/lib/auth/userBusiness";

interface VisroSlotSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function VisroSlotSidebar({ isOpen = false, onClose }: VisroSlotSidebarProps) {
  const pathname = usePathname();
  const [businessSlug, setBusinessSlug] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Personal Workspace");
  const [isFounder, setIsFounder] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    onClose?.();
  }, [pathname]);

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

          // Fetch user profile doc and personal business context in parallel
          const [userSnap, userCtx] = await Promise.all([
            getDoc(doc(db, "users", uid)),
            getUserPersonalBusiness(db, uid, userEmail),
          ]);

          const userData = userSnap.exists() ? userSnap.data() : null;
          const isOwnerUser =
            userCtx.isOwner ||
            userCtx.isFounder ||
            userEmail === OWNER_EMAIL ||
            uid === "vMZQTGlYSfM8adohQAZmSE3cNX02";

          if (isOwnerUser) {
            setIsFounder(true);
            setIsPaid(true);
            setIsExpired(false);
            setBusinessName("Rajkumar Headquarters");
            setBusinessSlug("rajkumar-hq");
            return;
          }

          const bus = userCtx.business;
          const sub = userCtx.subscription;

          const slug = bus?.slug || userData?.bookingSlug || userData?.slug || "";
          const name = bus?.name || userData?.businessName || userData?.fullName || "Personal Workspace";

          if (slug) setBusinessSlug(slug);
          if (name) setBusinessName(name);

          // Authoritative Payment Verification & Plan Expiry Check
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
            userData?.subscriptionStatus ||
            ""
          ).toLowerCase();

          const isStatusActive =
            subStatus === "active" ||
            subStatus === "trialing" ||
            subStatus === "trial";

          const isStatusExpired =
            subStatus === "expired" || subStatus === "cancelled";

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

          // An active paid or trial access exists if payment was verified or active subscription exists, and not expired
          const isUnlocked = Boolean(
            (hasPaymentVerified || isStatusActive || Boolean(sub)) &&
            !isDateExpired &&
            !isStatusExpired
          );

          if (isDateExpired || isStatusExpired) {
            setIsExpired(true);
            setIsPaid(false);
          } else if (isUnlocked) {
            setIsPaid(true);
            setIsExpired(false);
          } else {
            setIsPaid(false);
            setIsExpired(false);
          }
        } catch (e) {
          console.error("Error loading business context:", e);
        }
      }
    }
    loadCurrentBusiness();
  }, []);

  const navItems = [
    { href: "/app/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/app/ai", label: "Owner AI", icon: Sparkles },
    { href: "/app/appointments", label: "Appointments", icon: CalendarCheck2 },
    { href: "/app/calendar", label: "Calendar Matrix", icon: CalendarDays },
    { href: "/app/services", label: "Services", icon: Layers },
    { href: "/app/staff", label: "Staff Roster", icon: UserCheck },
    { href: "/app/customers", label: "Customer CRM", icon: Users },
    { href: "/app/reviews", label: "Customer Reviews", icon: Star },
    { href: "/app/availability", label: "Hours & Buffer", icon: Clock },
    { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/app/payment-gateway", label: "Payment Gateway", icon: CreditCard },
    { href: "/app/billing-history", label: "Billing History", icon: Receipt },
    { href: "/app/settings", label: "Settings", icon: Settings },
    { href: "/app/support", label: "Help & Support", icon: HelpCircle },
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
      // 1. Sign out of Firebase Web Client SDK
      const { auth } = getFirebaseClient();
      if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Firebase auth signOut error:", err);
    }

    // 2. Clear client-side session cookies immediately
    if (typeof document !== "undefined") {
      document.cookie = "visroslot_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "slotora_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // 3. Clear local storage / session storage
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("visroslot_session");
        window.localStorage.removeItem("slotora_session");
        window.sessionStorage.clear();
      }
    } catch (e) {}

    // 4. Hit server logout endpoint
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      console.error("Server logout error:", err);
    }

    // 5. Force hard navigation to /login to ensure clean state
    if (typeof window !== "undefined") {
      window.location.replace("/login?logout=true");
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar when tapping outside */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 max-w-[85vw] flex flex-col shrink-0 z-50 bg-white text-slate-800 dark:bg-navy-950 dark:text-navy-200 border-r border-slate-200 dark:border-gold-500/20 select-none font-sans overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="w-full min-h-full flex flex-col justify-between p-4 bg-white dark:bg-navy-950 transition-colors duration-200">
          {/* Top Brand Context */}
          <div className="flex flex-col gap-4">
            <div className="pb-3 border-b border-slate-200 dark:border-navy-800">
              <div className="flex items-center justify-between">
                <VisroSlotLogo size="sm" href="/app/overview" />
                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-navy-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gold-500" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-navy-900">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] text-slate-900 dark:text-navy-200 font-bold truncate font-mono">
                    {businessName}
                  </span>
                </div>
                {isFounder && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-gold-400 text-navy-950 shadow-xs">
                    FOUNDER
                  </span>
                )}
              </div>
            </div>

            {/* Client Link Box - Unlocked automatically after payment or 7-day trial authorization */}
            {isPaid || isFounder ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-navy-900/90 border border-emerald-500/30 dark:border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Public Link Unlocked
                  </span>
                  {businessSlug && (
                    <Link
                      href={`/book/${businessSlug}`}
                      target="_blank"
                      onClick={() => onClose?.()}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Open client booking page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                {businessSlug ? (
                  <>
                    <div className="text-[10px] font-mono text-slate-800 dark:text-navy-100 truncate bg-white dark:bg-navy-950 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 dark:border-navy-800 font-semibold">
                      /book/{businessSlug}
                    </div>
                    <button
                      onClick={handleCopyBookingLink}
                      className="w-full py-2 px-2.5 rounded-xl bg-gold-400 hover:brightness-105 text-navy-950 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-navy-950" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Link Copied!" : "Copy Booking URL"}</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                      Your plan is verified! Set up your business profile to generate your custom public booking link.
                    </p>
                    <Link
                      href="/create-business-profile"
                      onClick={() => onClose?.()}
                      className="w-full py-2 px-2.5 rounded-xl bg-gold-400 hover:brightness-105 text-navy-950 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Create Business Profile</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    {isExpired ? "Client Link Paused" : "Client Link Locked"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                  {isExpired
                    ? "Your subscription plan has expired. Reactivate your plan to resume public online bookings."
                    : "Public booking link is provided after subscribing to a plan or starting your 7-day free trial."}
                </p>
                <Link
                  href="/pricing"
                  onClick={() => onClose?.()}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1 transition-all"
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>{isExpired ? "Reactivate Plan to Resume" : "Unlock Public Link"}</span>
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/app/overview" && pathname === "/app") ||
                  (item.href === "/app/payment-gateway" && (pathname === "/app/payment-gateway" || pathname === "/app/subscription"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose?.()}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-gold-400 text-navy-950 font-bold shadow-xs"
                        : "text-slate-600 dark:text-navy-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-navy-950" : "text-slate-500 dark:text-gold-400"}`} />
                    <span>{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-navy-950"></span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Unhighlighted Hotline & Sign Out */}
          <div className="pt-3 border-t border-slate-200 dark:border-navy-800 flex flex-col gap-2 mt-4">
            <a
              href="https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/60 dark:hover:bg-navy-900 border border-slate-200 dark:border-gold-500/20 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center justify-center gap-1.5"
              title="Help & Support on Instagram"
            >
              <Instagram className="w-3.5 h-3.5 opacity-80 text-pink-600 dark:text-pink-400" />
              <span>Help: @visroslot</span>
            </a>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-navy-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors disabled:opacity-50"
              title="Sign out of VisroSlot"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-mono text-xs">{signingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
