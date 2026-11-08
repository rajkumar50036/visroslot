"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
  Receipt,
  Mail,
  Crown,
  CalendarCheck2,
  Users,
  Zap,
  Instagram,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Check,
  XCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { Business } from "@/types/database";
import { getUserPersonalBusiness, OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { VISRO_PLANS } from "@/lib/subscription/quota";

interface PaymentHistoryItem {
  id: string;
  payment_id?: string;
  order_id?: string;
  subscription_id?: string;
  amount: number;
  currency?: string;
  plan: string;
  billing_period?: string;
  status: string;
  error_description?: string;
  created_at: string;
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const autoPlan = searchParams.get("plan");

  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);

  // Billing & Checkout State
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"professional" | "business">("professional");
  const [isTrialAction, setIsTrialAction] = useState(false);
  const [syncingMandate, setSyncingMandate] = useState(false);
  const [mandateSyncMsg, setMandateSyncMsg] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);

      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        clearTimeout(timer);
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
          const userCtx = await getUserPersonalBusiness(db, uid, auth?.currentUser?.email);

          if (userCtx.isOwner || userCtx.userEmail === OWNER_EMAIL) {
            setIsFounder(true);
          }

          if (userCtx.business) {
            setBusiness(userCtx.business);

            // Fetch Subscription
            if (userCtx.subscription) {
              setSubscription(userCtx.subscription);
            } else {
              const subSnap = await getDocs(
                query(collection(db, "subscriptions"), where("business_id", "==", userCtx.business.id))
              );
              if (!subSnap.empty) {
                setSubscription({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
              }
            }

            // Fetch real Payment History
            const paySnap = await getDocs(
              query(collection(db, "payments"), where("business_id", "==", userCtx.business.id))
            );
            const historyList = paySnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as PaymentHistoryItem[];
            historyList.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
            setPaymentHistory(historyList);
          }
        }
      } catch (e) {
        console.error("Subscription load error:", e);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const subPlanStr = (
    business?.plan ||
    (business as any)?.subscription_plan ||
    subscription?.plan ||
    subscription?.plan_id ||
    ""
  )
    .toString()
    .toLowerCase();

  const isBusinessPlan =
    isFounder ||
    subPlanStr.includes("business") ||
    subPlanStr.includes("999") ||
    subPlanStr === "enterprise" ||
    subscription?.amount === 999 ||
    subscription?.amount === 9990 ||
    subscription?.amount === 99900 ||
    (business as any)?.is_unlimited === true ||
    subscription?.is_unlimited === true;

  const isProfessionalPlan =
    !isBusinessPlan && (subPlanStr.includes("professional") || subPlanStr.includes("499"));

  const isTrial =
    subscription?.status === "TRIALING" ||
    subscription?.status === "trialing" ||
    subscription?.subscriptionStatus === "TRIALING" ||
    (business as any)?.subscription_status === "TRIALING";

  const trialAppointmentsUsed =
    subscription?.trialAppointmentsUsed ??
    subscription?.trial_appointments_used ??
    (business as any)?.trial_appointments_used ??
    0;

  const trialEndIso =
    subscription?.trialEndAt ||
    subscription?.trial_end_at ||
    (business as any)?.trial_ends_at;

  const trialEndDate = trialEndIso ? new Date(trialEndIso) : null;
  const trialDaysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  const now = new Date();
  const isPlanExpired =
    !isFounder &&
    !(business as any)?.lifetime_free &&
    !subscription?.lifetime_free &&
    ((subscription?.expires_at && new Date(subscription.expires_at) < now) ||
      ((business as any)?.subscription_expires_at &&
        new Date((business as any).subscription_expires_at) < now) ||
      (subscription?.status || "").toLowerCase() === "expired" ||
      ((business as any)?.subscription_status || "").toLowerCase() === "expired");

  const isCancelled =
    subscription?.status === "cancelled" || subscription?.cancel_at_cycle_end === true;

  const isPaid =
    isFounder ||
    (business as any)?.lifetime_free === true ||
    subscription?.lifetime_free === true ||
    ((subscription?.status === "active" || subscription?.status === "ACTIVE") && subscription?.plan_id !== "free");

  const planName = isFounder
    ? "Founder Lifetime Unlimited"
    : isTrial
    ? `${isBusinessPlan ? "Business Suite" : "Professional Plan"} (7-Day Free Trial)`
    : isBusinessPlan
    ? "Business Suite (₹999 / Unlimited Bookings)"
    : "Professional Plan (₹499 / 300 Bookings)";

  const openConsentModal = (targetPlan: "professional" | "business", isTrial: boolean) => {
    setPendingPlan(targetPlan);
    setIsTrialAction(isTrial);
    setConsentChecked(false);
    setConsentModalOpen(true);
  };


  const executeCheckout = async (
    targetPlan: "professional" | "business",
    asTrial: boolean,
    preferStandardOrder: boolean = false
  ) => {
    setCheckoutLoading(targetPlan);
    setPaymentErrorMessage(null);
    setPaymentSuccessMessage(null);

    try {
      const { auth } = getFirebaseClient();
      const activeBusId = business?.id;
      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

      // 1. Create Order / Subscription on Server
      const res = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusId,
          userId: uid,
          plan: targetPlan,
          cycle: billingCycle,
          trial: asTrial,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to initialize payment gateway.");
      }

      // If already active or bypassed
      if (orderData.alreadySubscribed) {
        setPaymentSuccessMessage(orderData.message || "Your subscription is already active! Skipping checkout.");
        setCheckoutLoading(null);
        return;
      }

      // 2. Load Razorpay Checkout Script if not yet present
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK."));
          document.body.appendChild(script);
        });
      }

      const RazorpaySDK = (window as any).Razorpay;
      if (!RazorpaySDK) {
        throw new Error("Razorpay Checkout SDK is not available.");
      }

      // 3. Open Razorpay Checkout Modal
      const options: any = {
        key: orderData.keyId,
        name: "VISROSLOT",
        description: `${targetPlan === "business" ? "Premium" : "Starter"} Subscription (${billingCycle})`,
        image: "/icons/icon-192x192.png",
        prefill: {
          name: business?.name || "Business Owner",
          email: business?.owner_email || auth?.currentUser?.email || "",
          contact: business?.phone || "",
        },
        theme: {
          color: "#046A38", // Strict VISROSLOT Emerald Green
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(null);
          },
        },
        handler: async (response: any) => {
          try {
            setCheckoutLoading(targetPlan);
            // 4. Server-Side Cryptographic HMAC-SHA256 Signature Verification
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessId: activeBusId,
                userId: uid,
                plan: targetPlan,
                cycle: billingCycle,
                subscriptionId: response.razorpay_subscription_id || orderData.subscriptionId,
                orderId: response.razorpay_order_id || orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                isTrial: asTrial,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            setPaymentSuccessMessage(
              verifyData.message ||
                `${targetPlan === "business" ? "Premium" : "Starter"} subscription successfully verified and active!`
            );

            // Update UI from authoritative response
            setBusiness((prev: any) => ({
              ...prev,
              plan: targetPlan,
              subscription_status: asTrial ? "trialing" : "active",
              subscriptionStatus: asTrial ? "TRIALING" : "ACTIVE",
              publicBookingStatus: "ACTIVE",
              booking_quota_reached: false,
              is_unlimited: targetPlan === "business",
            }));

            setSubscription((prev: any) => ({
              ...prev,
              plan: targetPlan,
              status: asTrial ? "trialing" : "active",
              subscriptionStatus: asTrial ? "TRIALING" : "ACTIVE",
              expires_at: verifyData.expiresAt || new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000).toISOString(),
              paid_through_date: verifyData.expiresAt,
            }));
          } catch (verErr: any) {
            console.error("Payment verification error:", verErr);
            setPaymentErrorMessage(verErr.message || "Failed to verify payment with server.");
          } finally {
            setCheckoutLoading(null);
          }
        },
      };

      if (orderData.subscriptionId) {
        options.subscription_id = orderData.subscriptionId;
      } else if (orderData.orderId) {
        options.order_id = orderData.orderId;
        options.amount = orderData.amount;
        options.currency = orderData.currency || "INR";
      }

      const rzpInstance = new RazorpaySDK(options);
      rzpInstance.on("payment.failed", (resp: any) => {
        console.error("Razorpay Payment Failed:", resp.error);
        setPaymentErrorMessage(resp.error?.description || "Payment failed. Please try again.");
        setCheckoutLoading(null);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("Plan checkout error:", err);
      setPaymentErrorMessage(err.message || "Failed to initialize payment.");
      setCheckoutLoading(null);
    }
  };

  const handleCheckout = (targetPlan: "professional" | "business", asAutoPay: boolean = false) => {
    if (asAutoPay) {
      openConsentModal(targetPlan, true);
    } else {
      // AutoPay is reserved exclusively for new user onboarding. Dashboard users pay direct plan price (₹499/₹999) without ₹5 token.
      executeCheckout(targetPlan, false, true);
    }
  };

  const handleTestSimulatedUpgrade = async (targetPlan: "professional" | "business") => {
    setCheckoutLoading(targetPlan);
    setPaymentErrorMessage(null);
    setPaymentSuccessMessage(null);
    try {
      const { auth } = getFirebaseClient();
      const activeBusId = business?.id;
      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

      const fakePaymentId = `pay_test_${Date.now()}`;
      const fakeOrderId = `order_test_${Date.now()}`;
      const verifyRes = await fetch("/api/subscription/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusId,
          userId: uid,
          plan: targetPlan,
          cycle: billingCycle,
          subscriptionId: `sub_test_${Date.now()}`,
          orderId: fakeOrderId,
          paymentId: fakePaymentId,
          signature: "simulated_test_mode_signature",
          isSimulated: true,
          isTrial: false,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Simulation failed");
      setPaymentSuccessMessage(
        `🧪 Test Mode Payment Verified! Plan updated to ${targetPlan === "business" ? "Business Suite" : "Professional Plan"} without charges.`
      );
      setBusiness((prev: any) => ({
        ...prev,
        plan: targetPlan,
        subscription_status: "active",
        subscriptionStatus: "ACTIVE",
        publicBookingStatus: "ACTIVE",
        booking_quota_reached: false,
        is_unlimited: targetPlan === "business",
      }));
      setCheckoutLoading(null);
    } catch (err: any) {
      setCheckoutLoading(null);
      setPaymentErrorMessage(err.message);
    }
  };

  // Auto-launch checkout if plan query param is passed
  useEffect(() => {
    if (autoPlan && !loading && !checkoutLoading) {
      const planToOpen = autoPlan === "business" ? "business" : "professional";
      handleCheckout(planToOpen);
    }
  }, [autoPlan, loading]);

  // Subscriptions can only be cancelled from the UPI App (PhonePe / Google Pay / Paytm / BHIM) as per NPCI e-mandate rules
  const handleSyncMandate = async () => {
    if (!business?.id) return;
    setSyncingMandate(true);
    setMandateSyncMsg(null);
    try {
      const res = await fetch("/api/subscription/sync-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMandateSyncMsg(data.message);
        if (data.mandateStatus === "REVOKED_VIA_UPI_APP" || data.subscriptionStatus === "CANCELLED") {
          setSubscription((prev: any) => ({
            ...prev,
            mandateStatus: data.mandateStatus,
            subscriptionStatus: data.subscriptionStatus,
            status: "cancelled",
          }));
        }
      } else {
        setMandateSyncMsg(data.error || "Could not check mandate status with UPI gateway.");
      }
    } catch (e: any) {
      setMandateSyncMsg("Network error checking UPI mandate status.");
    } finally {
      setSyncingMandate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading billing portal...</span>
      </div>
    );
  }

  const renewalDateDisplay = subscription?.renewal_date || subscription?.expires_at;
  const renewalFormatted = renewalDateDisplay
    ? new Date(renewalDateDisplay).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
              Billing & Subscriptions
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isFounder
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                  : isCancelled
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                  : isPlanExpired
                  ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              }`}
            >
              {isFounder
                ? "LIFETIME ACTIVE"
                : isCancelled
                ? "AUTO-RENEW CANCELLED"
                : isPlanExpired
                ? "PLAN EXPIRED • PAUSED"
                : "RECURRING MANDATE ACTIVE"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Manage your Razorpay recurring subscription, view payment history, and control booking quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/billing-history"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white text-xs font-mono font-bold hover:bg-slate-50 dark:hover:bg-navy-800 shadow-xs flex items-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4 text-slate-400" />
            <span>Full Invoice Ledger</span>
          </Link>
        </div>
      </div>

      {/* Plan Expired Notice */}
      {isPlanExpired && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/50 text-amber-950 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider font-mono text-amber-900 dark:text-amber-300">
              Public Booking Link Paused
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300 leading-relaxed">
              Your subscription plan has expired. Your public customer booking link is paused and customers cannot schedule new appointments. Select a plan below to reactivate your booking link immediately.
            </p>
          </div>
          <button
            onClick={() => handleCheckout("business")}
            className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-gold-400 font-mono text-xs font-bold uppercase shadow-sm shrink-0 cursor-pointer"
          >
            Reactivate Business Plan
          </button>
        </div>
      )}

      {/* Recurring Mandate & Cancellation Disclosure Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#C49A46] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-white">
            AutoPay Mandate Cancellation & Renewal Policy (NPCI / RBI Compliant)
          </div>
          <p className="leading-relaxed">
            As mandated by NPCI &amp; RBI banking regulations, recurring AutoPay can <strong>ONLY be cancelled or paused directly by the business owner inside your UPI App</strong> (PhonePe, Google Pay, Paytm, BHIM) or bank portal. Mandates cannot be cancelled from this web dashboard to prevent accidental disruption. If recurring renewal is not completed, your public booking link is automatically paused until renewal is completed.
          </p>
        </div>
      </div>

      {/* 7-Day Free Trial Active Banner */}
      {isTrial && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-slate-900 dark:text-white space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Your 7-day free trial is active.
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {trialDaysRemaining > 0 ? `${trialDaysRemaining} days remaining in trial` : "Trial period ending today"}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>AutoPay Mandate Authorized</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Appointments used: {trialAppointmentsUsed} of 10.
              </span>
              <span className="text-slate-500 dark:text-navy-400">
                {Math.max(0, 10 - trialAppointmentsUsed)} remaining in trial
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-amber-200/50 dark:bg-amber-950/60 overflow-hidden">
              <div
                className="h-full bg-amber-600 dark:bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (trialAppointmentsUsed / 10) * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Your first automatic payment of ₹{subscription?.amount ? Number(subscription.amount).toLocaleString("en-IN") : isBusinessPlan ? (billingCycle === "yearly" ? "9,990" : "999") : (billingCycle === "yearly" ? "4,990" : "499")} is scheduled for {trialEndDate ? trialEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "the end of your 7-day trial"}.
          </p>
        </div>
      )}

      {/* Active Subscription Status Banner */}
      {!isTrial && !isFounder && !isPlanExpired && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-slate-900 dark:text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm">Your subscription is active.</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recurring AutoPay is enabled. Manage or cancel your mandate directly inside your UPI App (PhonePe, Google Pay, Paytm, BHIM).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold shrink-0">
            AutoPay Active
          </span>
        </div>
      )}

      {/* Main Entitlement Overview Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-navy-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-xs text-gold-600 dark:text-gold-400 font-bold uppercase tracking-wider">
              {isFounder ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>CURRENT SUBSCRIPTION</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
              {planName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-navy-300 max-w-2xl leading-relaxed">
              {isFounder
                ? "rajkumar50036@gmail.com is verified as the Platform Owner. All platform services, staff seats, and appointment bookings are 100% complimentary forever with zero quotas or charges."
                : isBusinessPlan
                ? "Your workspace is provisioned with Business Suite capabilities: UNLIMITED appointment bookings, up to 10 staff seats, and zero quota restrictions."
                : `Your workspace is provisioned with Professional Plan capabilities (300 bookings / monthly period, up to 3 staff seats).`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="px-4 py-2 rounded-full font-mono text-xs font-bold bg-gold-400 text-navy-950 shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-navy-950" />
              <span>
                {isFounder
                  ? "OWNER LIFETIME FREE"
                  : isCancelled
                  ? "CANCELS AT CYCLE END"
                  : isPlanExpired
                  ? "PLAN EXPIRED"
                  : "MANDATE ACTIVE"}
              </span>
            </span>

            {/* AutoPay Controlled Directly in Owner's UPI App */}
            {!isFounder && !isPlanExpired && !isCancelled && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-[11px] font-mono font-medium text-slate-600 dark:text-navy-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>UPI App Mandate Controlled</span>
              </div>
            )}
          </div>
        </div>

        {/* Plan Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-navy-400 flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-gold-500" />
              <span>Monthly Bookings</span>
            </div>
            <div className="font-display text-xl font-black text-slate-900 dark:text-white">
              {isBusinessPlan ? "UNLIMITED" : "300 / Month"}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {isBusinessPlan ? "Zero quota restrictions" : "300 successful bookings cap"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-navy-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gold-500" />
              <span>Staff Allocation</span>
            </div>
            <div className="font-display text-xl font-black text-slate-900 dark:text-white">
              {isFounder ? "UNLIMITED" : isBusinessPlan ? "Up to 10 Staff" : "Up to 3 Staff"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-navy-400">
              Multi-staff assignment engine
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-navy-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gold-500" />
              <span>Billing Cycle</span>
            </div>
            <div className="font-display text-xl font-black text-slate-900 dark:text-white">
              {isFounder
                ? "Complimentary"
                : subscription?.billing_period === "yearly" || subscription?.billing_cycle === "yearly"
                ? "Annual"
                : "Monthly"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-navy-400">
              {isFounder ? "Never expires" : "Recurring Razorpay mandate"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-navy-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-gold-500" />
              <span>Next Renewal / Paid Through</span>
            </div>
            <div className="font-display text-lg font-black truncate">
              {isFounder ? (
                <span className="text-emerald-600 dark:text-emerald-400">LIFETIME</span>
              ) : isPlanExpired ? (
                <span className="text-rose-600 dark:text-rose-400">EXPIRED</span>
              ) : (
                <span className="text-slate-900 dark:text-white">{renewalFormatted}</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-navy-400">
              {isFounder ? "No renewal required" : "Renews automatically"}
            </div>
          </div>
        </div>


      </div>

      {/* RAZORPAY SUBSCRIPTION PLANS CATALOG */}
      <div id="plans" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C49A46]">
              RAZORPAY RECURRING SUBSCRIPTIONS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {isFounder ? "Subscription Catalog (Founder Full Access)" : "Choose or Upgrade Your Plan"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-navy-400 mt-1">
              Select monthly or annual billing. All plans include full appointment scheduling and calendar management.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-navy-900 text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-navy-900 text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500 text-white font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {paymentSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="font-semibold">{paymentSuccessMessage}</div>
          </div>
        )}

        {paymentErrorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>{paymentErrorMessage}</div>
          </div>
        )}

        {/* 2 Plans Grid: Professional (₹499) and Business Suite (₹999) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Professional */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div>
                  <h3 className="font-display text-xl font-black uppercase text-slate-900 dark:text-white">
                    Professional
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-navy-400">
                    For individual professionals & solo salons
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300">
                  STANDARD
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-black text-slate-900 dark:text-white">
                  ₹{billingCycle === "monthly" ? "499" : "4,990"}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-navy-400">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>

              <ul className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-navy-200">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Up to 3 staff members</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Up to 300 bookings / usage month</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Dedicated public booking page & dynamic QR code</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Atomic conflict prevention & calendar matrix</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Standard Instagram & phone support</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
              <button
                type="button"
                onClick={() => handleCheckout("professional", false)}
                disabled={checkoutLoading !== null}
                className="w-full py-3.5 px-5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-navy-900 text-white hover:bg-navy-800 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                {checkoutLoading === "professional" || checkoutLoading === "professional_std" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                    <span>Opening Razorpay Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-gold-400" />
                    <span>Pay ₹{billingCycle === "monthly" ? "499" : "4,990"} via Razorpay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTestSimulatedUpgrade("professional")}
                disabled={checkoutLoading !== null}
                className="w-full py-2.5 px-4 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs"
                title="Test Mode: Instantly activate Professional plan in sandbox"
              >
                <span>🧪 Test Mode (Simulate Activation)</span>
              </button>
            </div>
          </div>

          {/* Plan 2: Business Suite (UNLIMITED) */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border-2 border-[#C49A46] shadow-xl ring-1 ring-[#C49A46]/20 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#C49A46] text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-sm">
              MOST POPULAR • UNLIMITED
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div>
                  <h3 className="font-display text-xl font-black uppercase text-slate-900 dark:text-white">
                    Business Suite
                  </h3>
                  <span className="text-[11px] font-mono text-[#C49A46] font-semibold">
                    For busy salons, clinics, fitness studios & teams
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-black text-slate-900 dark:text-white">
                  ₹{billingCycle === "monthly" ? (isProfessionalPlan ? "500" : "999") : isProfessionalPlan ? "5,000" : "9,990"}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-navy-400">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
                {isProfessionalPlan && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ₹{billingCycle === "monthly" ? "499" : "4,990"} Credit Applied!
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-navy-200">
                <li className="flex items-start gap-2.5">
                  <div className="p-0.5 rounded-full bg-gold-400/20 text-[#C49A46] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#C49A46]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    UNLIMITED APPOINTMENT BOOKINGS (No monthly 300 cutoff)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-0.5 rounded-full bg-gold-400/20 text-[#C49A46] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#C49A46]" />
                  </div>
                  <span><strong>Up to 10 staff members & stylists</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-0.5 rounded-full bg-gold-400/20 text-[#C49A46] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#C49A46]" />
                  </div>
                  <span>Dedicated public booking page & QR code</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-0.5 rounded-full bg-gold-400/20 text-[#C49A46] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#C49A46]" />
                  </div>
                  <span>Advanced revenue, customer CRM & service analytics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-0.5 rounded-full bg-gold-400/20 text-[#C49A46] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#C49A46]" />
                  </div>
                  <span>Priority phone & Instagram onboarding assistance</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
              <button
                type="button"
                onClick={() => handleCheckout("business", false)}
                disabled={checkoutLoading !== null}
                className="w-full py-3.5 px-5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 text-navy-950 hover:brightness-105 shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {checkoutLoading === "business" || checkoutLoading === "business_std" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Opening Razorpay Gateway...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-navy-950" />
                    <span>Pay ₹{billingCycle === "monthly" ? (isProfessionalPlan ? "500" : "999") : (isProfessionalPlan ? "5,000" : "9,990")} via Razorpay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTestSimulatedUpgrade("business")}
                disabled={checkoutLoading !== null}
                className="w-full py-2.5 px-4 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs"
                title="Test Mode: Instantly activate Business Suite in sandbox"
              >
                <span>🧪 Test Mode (Simulate Activation)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real Customer Payment Ledger Table */}
      <div className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="font-display text-lg font-black uppercase text-slate-900 dark:text-white">
              Payment History & Receipts
            </h3>
            <p className="text-xs text-slate-500 dark:text-navy-400">
              Verified Razorpay transactions for your business account.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-navy-400">
            {paymentHistory.length} Record{paymentHistory.length === 1 ? "" : "s"}
          </span>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-navy-500">
            No payments recorded yet. When you complete a subscription via Razorpay, receipt entries will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 text-[10px] font-mono uppercase text-slate-400 dark:text-navy-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Cycle</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Razorpay ID</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-mono">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/40">
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white uppercase">
                      {p.plan || "Plan"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-navy-400 capitalize">
                      {p.billing_period || "Monthly"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 dark:text-navy-500">
                      {p.payment_id || p.subscription_id || "Verified"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "CAPTURED" || p.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {p.status || "CAPTURED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mandatory AutoPay Recurring Authorization Consent Modal */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                  {isTrialAction ? "7-Day Free Trial Authorization" : "Recurring Subscription Authorization"}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Authorize VISROSLOT AutoPay
                </h3>
              </div>
              <button
                onClick={() => setConsentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between font-mono font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-navy-800">
                <span>Selected Plan:</span>
                <span className="capitalize">{pendingPlan === "business" ? "Business Suite" : "Professional Plan"}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Period:</span>
                <span className="font-medium capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Schedule:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isTrialAction
                    ? `7 days free (₹0 verification), then ₹${pendingPlan === "business" ? (billingCycle === "yearly" ? "9,990/year" : "999/month") : (billingCycle === "yearly" ? "4,990/year" : "499/month")}`
                    : `₹${pendingPlan === "business" ? (billingCycle === "yearly" ? "9,990/year" : "999/month") : (billingCycle === "yearly" ? "4,990/year" : "499/month")}`}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="text-[11px] text-gold-600 dark:text-gold-400 font-medium">
                  Includes ~17% yearly savings
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-navy-300 leading-relaxed">
              Razorpay will authenticate your recurring payment AutoPay mandate.
              {isTrialAction && " You receive a 7-day risk-free trial. Zero rupees (₹0) are debited today. Regular subscription charges will automatically debit from your bank account starting on Day 8 unless cancelled beforehand."}
            </p>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">₹2</span>
              <div className="leading-relaxed text-[11px]">
                <strong className="block text-emerald-950 dark:text-white">₹2 AutoPay Verification Refund Guarantee</strong>
                Under NPCI &amp; RBI banking regulations, the nominal ₹2 token debited to verify your bank AutoPay mandate is <strong>automatically refunded back to your original bank account</strong> immediately after verification.
              </div>
            </div>

            {/* MANDATORY UNCHECKED CONSENT CHECKBOX (NEVER PRESELECTED) */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer shrink-0"
              />
              <span className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                I authorize recurring payments for my selected VISROSLOT subscription. I understand that I receive a 7-day trial with up to 10 successful appointments and that my selected subscription amount will be automatically collected after the trial, subject to successful authorization. Future payments will follow the displayed monthly or yearly billing frequency. I can cancel future payments using my subscription management options.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConsentModalOpen(false);
                  executeCheckout(pendingPlan, isTrialAction, true);
                }}
                className="px-2 py-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Bank Restricts AutoPay? Pay via Direct UPI</span>
              </button>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConsentModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-bold text-slate-500 dark:text-navy-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!consentChecked || Boolean(checkoutLoading)}
                  onClick={() => {
                    setConsentModalOpen(false);
                    executeCheckout(pendingPlan, isTrialAction, false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#101A2B] dark:bg-gold-500 text-white dark:text-navy-950 font-mono text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Authorize AutoPay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-navy-400">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
          <span className="font-mono text-xs">Loading billing portal...</span>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
