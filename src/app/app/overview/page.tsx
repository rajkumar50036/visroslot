"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  Users,
  Clock,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Phone,
  ArrowRight,
  Loader2,
  CalendarDays,
  CreditCard,
  LogOut,
  AlertCircle,
  Sparkles,
  Building2,
  Lock,
  Share2,
  QrCode,
  CheckCircle2,
  XCircle,
  UserX,
  ChevronRight,
  BarChart3,
  PieChart,
  UserCheck,
  Calendar,
  IndianRupee,
  Activity,
  Briefcase,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { Appointment, Business } from "@/types/database";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getUserPersonalBusiness, OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { BookingAlarmManager } from "@/components/dashboard/BookingAlarmManager";

export default function OverviewPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [hasServices, setHasServices] = useState(false);
  const [hasStaff, setHasStaff] = useState(false);

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);

      const { auth, db, isConfigured } = getFirebaseClient();

      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const uid =
          auth?.currentUser?.uid ||
          (typeof document !== "undefined" &&
            (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
              document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

        if (uid) {
          const [userSnap, userCtx] = await Promise.all([
            getDoc(doc(db, "users", uid)),
            getUserPersonalBusiness(db, uid, auth?.currentUser?.email),
          ]);

          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }

          if (userCtx.isOwner || userCtx.userEmail === OWNER_EMAIL) {
            setIsFounder(true);
          }

          if (userCtx.business) {
            const bId = userCtx.business.id;
            setBusiness(userCtx.business);

            const [apptsSnap, servicesSnap, staffSnap, subSnap] = await Promise.all([
              getDocs(query(collection(db, "appointments"), where("business_id", "==", bId))),
              getDocs(query(collection(db, "services"), where("business_id", "==", bId))),
              getDocs(query(collection(db, "staff"), where("business_id", "==", bId))),
              userCtx.subscription
                ? Promise.resolve(null)
                : getDocs(query(collection(db, "subscriptions"), where("business_id", "==", bId))),
            ]);

            setHasServices(!servicesSnap.empty);
            setHasStaff(!staffSnap.empty);

            const list = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
            list.sort((a, b) => {
              const dateDiff = (b.appointment_date || "").localeCompare(a.appointment_date || "");
              if (dateDiff !== 0) return dateDiff;
              return (b.start_time || "").localeCompare(a.start_time || "");
            });
            setAppointments(list);

            if (userCtx.subscription) {
              setSubscription(userCtx.subscription);
            } else if (subSnap && !subSnap.empty) {
              setSubscription(subSnap.docs[0].data());
            } else if (uid) {
              const userSubSnap = await getDocs(
                query(collection(db, "subscriptions"), where("user_id", "==", uid))
              );
              if (!userSubSnap.empty) {
                setSubscription(userSubSnap.docs[0].data());
              }
            }
          } else {
            // Strict Privacy: Do not leak another user's business
            setBusiness(null);
            setAppointments([]);
            setSubscription(null);
            setHasServices(false);
            setHasStaff(false);
          }
        } else {
          // If no authenticated user, strictly redirect to login (tenant privacy)
          if (typeof window !== "undefined") {
            router.push("/login");
            return;
          }
        }
      } catch (err) {
        console.error("Error loading overview:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [router]);

  // Key Calculations from Firestore Records
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);
  const upcomingAppointments = appointments.filter(
    (a) => a.appointment_date > todayStr && a.status !== "CANCELLED"
  );
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED");
  const noShowAppointments = appointments.filter((a) => a.status === "NO_SHOW");
  const pendingAppointments = appointments.filter((a) => a.status === "PENDING");
  const confirmedAppointments = appointments.filter((a) => a.status === "CONFIRMED");

  // Booked Service Value (Total valid pipeline) vs Collected Revenue (Completed)
  const bookedServiceValue = appointments
    .filter((a) => a.status !== "CANCELLED")
    .reduce((sum, a) => sum + (Number(a.service_price) || 0), 0);

  const collectedRevenue = completedAppointments.reduce(
    (sum, a) => sum + (Number(a.service_price) || 0),
    0
  );

  const pendingRevenue = appointments
    .filter((a) => a.status === "CONFIRMED" || a.status === "PENDING")
    .reduce((sum, a) => sum + (Number(a.service_price) || 0), 0);

  const uniqueClientsCount = new Set(
    appointments
      .map((a) => a.customer_phone || a.customer_email || a.customer_name)
      .filter(Boolean)
  ).size;

  // 7-Day Booking Trends (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dayAppts = appointments.filter((a) => a.appointment_date === dStr);
    const dayCompleted = dayAppts.filter((a) => a.status === "COMPLETED").length;
    const dayCancelled = dayAppts.filter((a) => a.status === "CANCELLED").length;
    return {
      dateStr: dStr,
      dayName,
      formattedDate: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      count: dayAppts.length,
      completed: dayCompleted,
      cancelled: dayCancelled,
      isToday: dStr === todayStr,
    };
  });
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));

  // Service-wise appointment distribution
  const serviceDistribution = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of appointments) {
      if (a.status === "CANCELLED") continue;
      const key = a.service_name || "Standard Consultation";
      const existing = map.get(key) || { name: key, count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(a.service_price) || 0;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [appointments]);

  // Staff-wise workload distribution
  const staffDistribution = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; completed: number }>();
    for (const a of appointments) {
      const key = a.staff_name || "Any Available Specialist";
      const existing = map.get(key) || { name: key, count: 0, completed: 0 };
      existing.count += 1;
      if (a.status === "COMPLETED") existing.completed += 1;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [appointments]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && business?.slug) {
      navigator.clipboard.writeText(`${window.location.origin}/book/${business.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const effectivePlan = (
    business?.plan ||
    (business as any)?.subscription_plan ||
    subscription?.plan ||
    subscription?.plan_id ||
    "professional"
  )
    .toString()
    .toLowerCase();

  const isLifetimeFree = isFounder || subscription?.lifetime_free || (business as any)?.lifetime_free;

  const isBusiness =
    isFounder ||
    isLifetimeFree ||
    effectivePlan.includes("business") ||
    effectivePlan.includes("999") ||
    effectivePlan === "enterprise" ||
    subscription?.amount === 999 ||
    subscription?.amount === 9990 ||
    subscription?.amount === 99900 ||
    (business as any)?.is_unlimited === true ||
    subscription?.is_unlimited === true;

  const busStatus = (
    (business as any)?.subscription_status ||
    (business as any)?.subscriptionStatus ||
    ""
  ).toLowerCase();

  const subStatus = (
    subscription?.status ||
    ""
  ).toLowerCase();

  const isTrial = Boolean(
    subStatus === "trialing" ||
    busStatus === "trialing" ||
    subscription?.is_trial === true ||
    (business as any)?.is_trial === true ||
    subscription?.trialAppointmentLimit ||
    (business as any)?.trial_appointment_limit
  );

  const isStatusActive =
    subStatus === "active" ||
    subStatus === "trialing" ||
    subStatus === "captured" ||
    subStatus === "authenticated" ||
    busStatus === "active" ||
    busStatus === "trialing" ||
    busStatus === "captured";

  const isPaymentVerified = Boolean(
    isFounder ||
    isLifetimeFree ||
    userData?.paymentVerified ||
    userData?.payment_verified ||
    (business as any)?.paymentVerified ||
    (business as any)?.payment_verified ||
    (business as any)?.sharingLinkUnlocked ||
    (business as any)?.sharing_link_unlocked ||
    isStatusActive ||
    Boolean(business?.slug) ||
    Boolean(business?.name) ||
    appointments.length > 0
  );

  const hasPaidPlan =
    effectivePlan === "professional" ||
    effectivePlan === "business" ||
    effectivePlan.includes("pro") ||
    effectivePlan.includes("business") ||
    effectivePlan.includes("499") ||
    effectivePlan.includes("999");

  const isPaid = Boolean(
    isFounder ||
    isLifetimeFree ||
    isPaymentVerified ||
    isStatusActive ||
    Boolean(business?.slug) ||
    Boolean(business?.name) ||
    appointments.length > 0 ||
    (hasPaidPlan && busStatus !== "expired" && busStatus !== "cancelled" && subStatus !== "expired")
  );

  const activatedDate = subscription?.activated_at
    ? new Date(subscription.activated_at)
    : (business as any)?.subscription_activated_at
    ? new Date((business as any).subscription_activated_at)
    : (business as any)?.created_at
    ? new Date((business as any).created_at)
    : now;

  const rawExpiresAt =
    subscription?.expires_at ||
    subscription?.paid_through_date ||
    (business as any)?.subscription_expires_at ||
    (business as any)?.paid_through_date;

  const expiresDate = rawExpiresAt
    ? new Date(rawExpiresAt)
    : new Date(activatedDate.getTime() + (isTrial ? 7 : 30) * 86400000);

  const daysActive = Math.max(1, Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(1, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalCycleDays = isTrial ? 7 : subscription?.billing_cycle === "yearly" || (business as any)?.billing_cycle === "yearly" ? 365 : 30;

  const isPlanExpired =
    !isFounder &&
    !isLifetimeFree &&
    (subStatus === "expired" || busStatus === "expired") &&
    rawExpiresAt &&
    new Date(rawExpiresAt) < now;

  const isProfileCompleted = Boolean(
    business &&
    business.name &&
    business.slug
  );

  const isBookingLinkUnlocked = Boolean(
    isFounder ||
    isLifetimeFree ||
    (isPaymentVerified && isProfileCompleted && !isPlanExpired)
  );

  const bookingUrl =
    typeof window !== "undefined" && business?.slug
      ? `${window.location.origin}/book/${business.slug}`
      : business?.slug
      ? `https://visroslot.pages.dev/book/${business.slug}`
      : "";

  const handleNativeShare = async () => {
    if (!bookingUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${business?.name || "VISROSLOT"} Appointment Booking`,
          text: `Book your appointment online with ${business?.name || "us"} on VISROSLOT:`,
          url: bookingUrl,
        });
        return;
      } catch (e) {}
    }
    handleCopyLink();
  };

  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
  const monthlySuccessfulAppointments = appointments.filter(
    (a) =>
      (a.status || "").toUpperCase() !== "CANCELLED" &&
      (a.created_at || `${a.appointment_date}T00:00:00Z`) >= currentMonthStart
  );
  const monthlyCount = monthlySuccessfulAppointments.length;
  const isQuotaReached = !isBusiness && !isFounder && monthlyCount >= 300;

  const handleSignOut = async () => {
    try {
      const { auth } = getFirebaseClient();
      if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
    } catch (e) {}

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
      await fetch("/auth/logout", { method: "POST", headers: { Accept: "application/json" } });
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.location.replace("/login?logout=true");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status_update", status: newStatus }),
      });

      if (!res.ok) {
        // Fallback to direct client firestore update
        const { db } = getFirebaseClient();
        if (db) {
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };
          if (newStatus === "COMPLETED") updateData.completed_at = new Date().toISOString();
          if (newStatus === "CANCELLED") updateData.cancelled_at = new Date().toISOString();
          await updateDoc(doc(db, "appointments", id), updateData);
        }
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
      );
    } catch (e) {
      console.error("Error updating status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading live Firestore analytics & queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase text-slate-900 dark:text-white break-words">
              {business?.name || (isFounder ? "Rajkumar Headquarters" : "Personal Workspace")}
            </h1>
            {isFounder ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C49A46] text-[#0B1425] shadow-xs">
                FOUNDER ACCESS
              </span>
            ) : isBusiness ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-600 text-white shadow-xs">
                BUSINESS SUITE • UNLIMITED
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-gold-400 dark:bg-navy-900">
                PRO ACTIVE • 300 CAP
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Real-time appointment ledger & Firestore operational analytics • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Real-time Web Audio API Booking Chime & Alarm */}
          <BookingAlarmManager businessId={business?.id} userId={business?.owner_id} />

          {/* Desktop Theme Selector */}
          <div className="hidden lg:inline-flex">
            <ThemeToggle variant="segmented" />
          </div>

          {/* Client Booking Sharing Link */}
          {!isBookingLinkUnlocked ? (
            <Link
              href="/onboarding"
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-all shadow-xs"
              title={isPlanExpired ? "Plan expired - Reactivate to resume client booking link" : "Complete your business profile onboarding to unlock your booking page."}
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{isPlanExpired ? "Sharing Link Paused (Plan Expired)" : "Sharing Link Locked"}</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white text-xs font-mono font-bold hover:bg-slate-50 dark:hover:bg-navy-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? "Link Copied!" : "Copy Booking URL"}</span>
              </button>

              <Link
                href={business?.slug ? `/book/${business.slug}` : "/app/settings"}
                target={business?.slug ? "_blank" : "_self"}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] text-xs font-mono font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{business?.slug ? "Live Booking" : "Setup Booking URL"}</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-white text-xs font-mono font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Share Booking URL"
              >
                <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          )}

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-500 hover:text-red-600 dark:text-navy-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-mono font-bold shadow-xs flex items-center gap-1.5 transition-all"
            title="Sign out of VisroSlot"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Booking Sharing Card */}
      {bookingUrl ? (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Your VISROSLOT Booking Page Is Active & Verified</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Share your booking link with clients to automate appointments 24/7.
              </h3>
              <p className="text-xs text-slate-600 dark:text-navy-300 mt-1">
                Clients select specialist, pick live available slots, and confirm appointments with automated notifications.
              </p>
            </div>

            {/* Dynamic QR Code */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 shadow-xs shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bookingUrl)}`}
                alt="VISROSLOT Booking QR Code"
                className="w-16 h-16 rounded-lg"
              />
              <div className="text-left">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Scan QR Code</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Instant Booking</div>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(bookingUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#C49A46] hover:underline font-semibold"
                >
                  Download QR
                </a>
              </div>
            </div>
          </div>

          {/* Sharing URL & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 font-mono text-xs text-slate-800 dark:text-white font-semibold truncate select-all">
              {bookingUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-xl bg-[#101A2B] dark:bg-white text-white dark:text-[#101A2B] font-mono text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <a
              href={business?.slug ? `/book/${business.slug}` : "/app/settings"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-navy-800 text-slate-800 dark:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-navy-700 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Preview Page</span>
            </a>

            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-3 rounded-xl bg-[#C49A46] hover:brightness-105 text-[#0B1425] font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Complete your business setup
            </h3>
            <p className="text-xs text-slate-500 dark:text-navy-400 mt-1">
              Add your business name and details to generate your customer booking link and QR code.
            </p>
          </div>
          <Link
            href="/onboarding?step=profile"
            className="px-5 py-2.5 rounded-xl bg-[#101A2B] hover:bg-navy-900 text-[#C49A46] font-mono text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Set Up Business Profile →</span>
          </Link>
        </div>
      )}

      {/* Plan Expired Warning Banner */}
      {isPlanExpired && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/50 text-amber-950 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                  PLAN EXPIRED
                </span>
                <span className="text-xs font-bold uppercase text-amber-900 dark:text-amber-200">
                  Public Booking Link Paused
                </span>
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-300 mt-1 leading-relaxed">
                Your subscription plan has expired. Your public booking link is paused until you reactivate your plan. Existing appointments, staff rosters, and customer records remain safe and preserved.
              </p>
            </div>
          </div>
          <Link
            href="/app/subscription#plans"
            className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-gold-400 font-mono text-xs font-bold uppercase shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Reactivate Plan via Razorpay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quota Limit Reached Warning Banner */}
      {isQuotaReached && (
        <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-200 text-amber-900 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                  300/300 USAGE REACHED
                </span>
                <span className="text-xs font-bold uppercase text-amber-900">
                  Public Booking Paused
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                You have reached your 300 monthly booking limit. Your public booking page is temporarily paused from taking new appointments. Upgrade to the Business Plan (₹999/month) to unlock UNLIMITED bookings immediately.
              </p>
            </div>
          </div>
          <Link
            href="/app/subscription#plans"
            className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-gold-400 font-mono text-xs font-bold uppercase shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Upgrade to Business (Unlimited)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Section 8: Complete Dashboard Analytics Matrix (Directly from Firestore) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C49A46]" />
            <h2 className="font-display text-lg font-black uppercase text-slate-900 dark:text-white">
              Appointment & Revenue Analytics
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-navy-400">
            Real Firestore Records (0 Dummy Data)
          </span>
        </div>

        {/* 8 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Appointments */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Today&apos;s Appointments</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-gold-950/40 text-amber-700 dark:text-[#C49A46]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {todayAppointments.length}
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 dark:bg-navy-800 dark:text-navy-200 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {todayAppointments.filter((a) => a.status === "COMPLETED").length} completed
              </span>
              <span>•</span>
              <span>
                {todayAppointments.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING").length} queued
              </span>
            </div>
          </div>

          {/* Card 2: Upcoming Appointments */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Upcoming Bookings</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {upcomingAppointments.length}
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Future
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono">
              Scheduled after today across all specialists
            </div>
          </div>

          {/* Card 3: Completed Appointments */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Completed Visits</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {completedAppointments.length}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Fulfilled
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono">
              Lifetime verified fulfilled appointments
            </div>
          </div>

          {/* Card 4: Cancelled & No-Shows */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Cancelled / No-Shows</span>
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {cancelledAppointments.length + noShowAppointments.length}
              </span>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 rounded-full">
                Dropouts
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono flex items-center gap-1.5">
              <span>{cancelledAppointments.length} Cancelled</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400">{noShowAppointments.length} No-Shows</span>
            </div>
          </div>

          {/* Card 5: Unique Customers CRM */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Total Unique Clients</span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {uniqueClientsCount}
              </span>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full">
                CRM
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono">
              Distinct phone/email records
            </div>
          </div>

          {/* Card 6: Booked Service Value (Total non-cancelled) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Booked Service Value</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#C49A46]">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{bookedServiceValue.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                Pipeline
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono">
              Total gross value of all active bookings
            </div>
          </div>

          {/* Card 7: Collected Revenue (Completed) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Collected Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                ₹{collectedRevenue.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Realized
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-400 font-mono">
              Realized from completed appointments
            </div>
          </div>

          {/* Card 8: Monthly Usage / Capacity */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 text-xs font-mono uppercase tracking-wider">
              <span>Plan Usage</span>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-navy-200">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {isBusiness || isFounder ? "Unlimited" : `${monthlyCount}/300`}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  isBusiness || isFounder
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : isQuotaReached
                    ? "text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-400"
                    : "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
                }`}
              >
                {isBusiness || isFounder ? "No Quota" : isQuotaReached ? "Limit Reached" : `${300 - monthlyCount} Left`}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-navy-500 font-mono">
              {isBusiness || isFounder ? "Unlimited bookings / month" : "300 bookings / monthly period"}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Booking Trends & Performance */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-navy-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C49A46]" />
              <h3 className="font-display text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white">
                7-Day Booking Trends
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-navy-400 mt-0.5">
              Daily appointment load and fulfillment trends over the past 7 days
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400 dark:text-navy-400">
            {last7Days[0]?.formattedDate} – {last7Days[6]?.formattedDate}
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-6 pb-2 min-h-[160px]">
          {last7Days.map((day) => {
            const heightPercent = Math.max(12, Math.round((day.count / maxDayCount) * 100));
            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-navy-300 opacity-80 group-hover:opacity-100">
                  {day.count}
                </span>
                <div className="w-full max-w-[48px] h-28 bg-slate-100 dark:bg-navy-950 rounded-2xl overflow-hidden flex flex-col justify-end p-1 relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-xl transition-all duration-300 ${
                      day.isToday
                        ? "bg-[#C49A46] text-[#0B1425]"
                        : day.count > 0
                        ? "bg-slate-800 dark:bg-slate-200"
                        : "bg-slate-200 dark:bg-navy-800"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={`font-mono text-[11px] font-bold ${
                      day.isToday ? "text-[#C49A46]" : "text-slate-800 dark:text-white"
                    }`}
                  >
                    {day.dayName}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 dark:text-navy-500">
                    {day.formattedDate.split(" ")[1]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-navy-800 text-xs font-mono text-slate-500 dark:text-navy-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C49A46]" />
              <span>Today</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200" />
              <span>Past Days</span>
            </span>
          </div>
          <span>
            Total 7-day volume: {last7Days.reduce((acc, d) => acc + d.count, 0)} appointments
          </span>
        </div>
      </div>

      {/* Service-wise & Staff-wise Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service-wise distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#C49A46]" />
              <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                Service Performance
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400 dark:text-navy-400">
              {serviceDistribution.length} Services
            </span>
          </div>

          {serviceDistribution.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-navy-500 italic">
              No services booked yet.
            </div>
          ) : (
            <div className="space-y-3">
              {serviceDistribution.slice(0, 5).map((srv) => {
                const totalActiveCount = appointments.filter((a) => a.status !== "CANCELLED").length || 1;
                const percentage = Math.round((srv.count / totalActiveCount) * 100);
                return (
                  <div key={srv.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{srv.name}</span>
                      <div className="font-mono text-slate-500 dark:text-navy-400 flex items-center gap-2">
                        <span>{srv.count} bookings</span>
                        <span className="text-[#C49A46] font-bold">₹{srv.revenue.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-[#C49A46] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staff-wise distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="font-display text-base font-black uppercase text-slate-900 dark:text-white">
                Specialist Workload
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400 dark:text-navy-400">
              {staffDistribution.length} Specialists
            </span>
          </div>

          {staffDistribution.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-navy-500 italic">
              No staff appointments assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {staffDistribution.slice(0, 5).map((stf) => {
                const totalActiveCount = appointments.length || 1;
                const percentage = Math.round((stf.count / totalActiveCount) * 100);
                return (
                  <div key={stf.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{stf.name}</span>
                      <div className="font-mono text-slate-500 dark:text-navy-400 flex items-center gap-2">
                        <span>{stf.count} assigned</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {stf.completed} completed
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Live Queue Feed */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h2 className="font-display text-lg font-black uppercase text-slate-900 dark:text-white">
              Today&apos;s Live Appointments Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-navy-400">
              Direct action controls for customer fulfillment, completion, and no-shows
            </p>
          </div>
          <Link
            href="/app/appointments"
            className="text-xs font-mono font-bold text-slate-700 dark:text-navy-200 hover:underline flex items-center gap-1"
          >
            <span>View All Records ({appointments.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-navy-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-navy-200">No appointments scheduled for today yet.</p>
            <p className="text-xs max-w-sm mx-auto text-slate-500 dark:text-navy-400">
              Share your public booking link with clients to start receiving automated bookings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#101A2B] dark:bg-navy-950 text-[#C49A46] font-black flex items-center justify-center text-sm shrink-0">
                    {(apt.customer_name || "C")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{apt.customer_name}</div>
                    <div className="text-xs text-slate-600 dark:text-navy-300 font-mono">
                      {apt.service_name} • ₹{apt.service_price || 0}
                      {apt.staff_name ? ` • Specialist: ${apt.staff_name}` : ""}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-navy-500 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{apt.start_time} - {apt.end_time}</span>
                      {apt.booking_reference && (
                        <>
                          <span>•</span>
                          <span className="text-[#C49A46] font-bold">#{apt.booking_reference}</span>
                        </>
                      )}
                      {apt.customer_phone && (
                        <>
                          <span>•</span>
                          <a href={`tel:${apt.customer_phone}`} className="hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {apt.customer_phone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      apt.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : apt.status === "COMPLETED"
                        ? "bg-slate-100 text-slate-800 dark:bg-navy-800 dark:text-navy-200"
                        : apt.status === "CANCELLED"
                        ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        : apt.status === "NO_SHOW"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}
                  >
                    {apt.status}
                  </span>

                  {updatingId === apt.id ? (
                    <div className="px-3 py-1 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <>
                      {apt.status === "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, "COMPLETED")}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-mono font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {apt.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, "CONFIRMED")}
                          className="px-3 py-1 rounded-xl bg-[#101A2B] dark:bg-white text-white dark:text-[#101A2B] text-xs font-mono font-bold hover:opacity-95 transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}

                      {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, "NO_SHOW")}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
                          title="Mark customer as No-Show"
                        >
                          No-Show
                        </button>
                      )}

                      {apt.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, "CANCELLED")}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-navy-300 text-xs font-mono hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Dock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/app/appointments"
          className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-[#C49A46]/40 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-slate-500 dark:text-navy-400">Appointment Ledger</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">View Full Schedule</h3>
          <p className="text-xs text-slate-500 dark:text-navy-400">Search by client name, phone number, filter by date, staff, or status.</p>
        </Link>

        <Link
          href="/app/calendar"
          className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-[#C49A46]/40 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-slate-500 dark:text-navy-400">Calendar Matrix</span>
            <CalendarDays className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Staff Schedule View</h3>
          <p className="text-xs text-slate-500 dark:text-navy-400">Interactive Day, Week, and Month matrix with specialist filters.</p>
        </Link>

        <Link
          href="/app/customers"
          className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-[#C49A46]/40 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-slate-500 dark:text-navy-400">Client CRM</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Customer Directory</h3>
          <p className="text-xs text-slate-500 dark:text-navy-400">Track client lifetime visit history, appointment ledger, and total spend.</p>
        </Link>
      </div>
    </div>
  );
}
