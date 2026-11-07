"use client";

import React, { useState, useEffect } from "react";
import {
  Repeat,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function SuperAdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const formatDate = (d: any) => {
    if (!d) return "Lifetime / 30d";
    try {
      const parsed = typeof d === "object" && d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
      return isNaN(parsed.getTime()) ? "Lifetime / 30d" : parsed.toLocaleDateString("en-IN");
    } catch {
      return "Lifetime / 30d";
    }
  };

  const fetchSubscriptions = () => {
    setLoading(true);
    fetch("/api/super-admin/data?range=all")
      .then((res) => res.json())
      .then((data) => {
        setSubscriptions(data.subscriptions || []);
        setPayments(data.payments || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleExtend = async (subId: string) => {
    setExtendingId(subId);
    setMessage(null);
    try {
      const res = await fetch("/api/super-admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXTEND_SUBSCRIPTION",
          subscriptionId: subId,
          days: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extension failed");
      setMessage(`Subscription extended by 30 days. New expiry: ${new Date(data.newExpiresAt).toLocaleDateString("en-IN")}`);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || "Could not extend subscription.");
    } finally {
      setExtendingId(null);
    }
  };

  // Section K: Non-dummy calculated metrics strictly derived from Firestore
  const now = new Date();
  const activeSubs = subscriptions.filter((s) => {
    const isExp = s.expires_at ? new Date(s.expires_at) < now : false;
    const st = (s.status || "").toLowerCase();
    return (st === "active" || st === "trialing") && !isExp;
  });

  const totalActiveSubscriptions = activeSubs.length;

  const monthlySubscriptions = subscriptions.filter((s) => {
    const c = (s.billing_cycle || s.billing_period || "").toLowerCase();
    return c === "monthly";
  }).length;

  const yearlySubscriptions = subscriptions.filter((s) => {
    const c = (s.billing_cycle || s.billing_period || "").toLowerCase();
    return c === "yearly";
  }).length;

  const freeTrials = subscriptions.filter((s) => {
    const st = (s.status || "").toLowerCase();
    return st === "trialing" || s.is_trial === true;
  }).length;

  const successfulPayments = payments.filter((p) => {
    const st = (p.status || "").toUpperCase();
    return st === "SUCCESS" || st === "PAID" || st === "CAPTURED";
  }).length;

  const failedPayments = payments.filter((p) => {
    const st = (p.status || "").toUpperCase();
    return st === "FAILED";
  }).length;

  const cancellations = subscriptions.filter((s) => {
    const st = (s.status || "").toLowerCase();
    return st === "cancelled" || s.cancellation_status === "CANCELLED";
  }).length;

  // Recognised Monthly Revenue (MRR)
  const monthlyRecurringRevenue = activeSubs.reduce((acc, s) => {
    const c = (s.billing_cycle || s.billing_period || "").toLowerCase();
    const amt = Number(s.amount) || (s.plan_id?.includes("premium") || s.plan_id === "business" ? 999 : 499);
    if (c === "yearly") {
      return acc + amt / 12; // Recognised monthly portion of annual subscription
    }
    return acc + amt;
  }, 0);

  // Contracted Annual Revenue vs ARR Run Rate
  const contractedAnnualRevenue = activeSubs.reduce((acc, s) => {
    const c = (s.billing_cycle || s.billing_period || "").toLowerCase();
    const amt = Number(s.amount) || (s.plan_id?.includes("premium") || s.plan_id === "business" ? 9990 : 4990);
    if (c === "yearly") {
      return acc + amt;
    }
    return acc;
  }, 0);

  const annualRunRate = monthlyRecurringRevenue * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscription Operations &amp; Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative Razorpay subscription status, recurring revenue, and lifecycle governance.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-[#046A38]" />
          <span>{message}</span>
        </div>
      )}

      {/* Section K: Real Non-Dummy Analytics Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Active Subscriptions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Active Subs</span>
            <UserCheck className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalActiveSubscriptions}
          </p>
          <span className="text-[10px] text-slate-400">Total active accounts</span>
        </div>

        {/* Metric 2: Monthly Subscriptions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Monthly Subs</span>
            <Repeat className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {monthlySubscriptions}
          </p>
          <span className="text-[10px] text-slate-400">₹499 / ₹999 cycle</span>
        </div>

        {/* Metric 3: Yearly Subscriptions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Yearly Subs</span>
            <Calendar className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {yearlySubscriptions}
          </p>
          <span className="text-[10px] text-slate-400">₹4,990 / ₹9,990 cycle</span>
        </div>

        {/* Metric 4: Free Trials */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Free Trials</span>
            <Clock className="w-4 h-4 text-[#C49A46]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {freeTrials}
          </p>
          <span className="text-[10px] text-slate-400">7-Day active trials</span>
        </div>

        {/* Metric 5: Successful Payments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Paid TXs</span>
            <ShieldCheck className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-[#9EF6B6] font-mono">
            {successfulPayments}
          </p>
          <span className="text-[10px] text-slate-400">Captured payments</span>
        </div>

        {/* Metric 6: Failed Payments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Failed TXs</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 font-mono">
            {failedPayments}
          </p>
          <span className="text-[10px] text-slate-400">Payment retries</span>
        </div>

        {/* Metric 7: Cancellations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Cancelled</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
            {cancellations}
          </p>
          <span className="text-[10px] text-slate-400">Mandate revoked</span>
        </div>

        {/* Metric 8: MRR */}
        <div className="p-4 rounded-2xl bg-[#046A38]/10 dark:bg-[#043D2E] border border-[#046A38]/30 shadow-xs col-span-2">
          <div className="flex items-center justify-between text-[#046A38] dark:text-[#9EF6B6] text-[11px] font-mono uppercase font-bold">
            <span>Recognised MRR</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{Math.round(monthlyRecurringRevenue).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Monthly Run Rate (inc. 1/12th annual)
          </span>
        </div>

        {/* Metric 9: Contracted ARR vs Run Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono uppercase">
            <span>Contracted ARR</span>
            <ArrowUpRight className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{Math.round(contractedAnnualRevenue).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">
            Run-rate ARR: ₹{Math.round(annualRunRate).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#10251D] border border-slate-200/80 dark:border-[#046A38]/30 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#046A38]" />
            <span>Loading active subscriptions from Firestore...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active subscriptions recorded in Firestore yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#046A38]/30 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Subscription ID</th>
                  <th className="pb-3 font-semibold">Business ID</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Cycle</th>
                  <th className="pb-3 font-semibold">Expires At</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((s) => {
                  const isExp = s.expires_at ? new Date(s.expires_at) < now : false;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#043D2E]/30">
                      <td className="py-3 font-mono font-medium">{s.id}</td>
                      <td className="py-3 font-mono text-slate-500">{s.business_id}</td>
                      <td className="py-3 font-semibold uppercase">{s.plan_id || s.plan || "Starter"}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            s.status?.toLowerCase() === "trialing"
                              ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : !isExp
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {s.status?.toLowerCase() === "trialing" ? "7-Day Trial" : isExp ? "Expired" : s.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 uppercase font-mono text-slate-500">{s.billing_cycle || "Monthly"}</td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(s.expires_at)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleExtend(s.id)}
                          disabled={extendingId === s.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#046A38]/10 text-[#046A38] dark:text-[#9EF6B6] hover:bg-[#046A38]/20 border border-[#046A38]/30 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          {extendingId === s.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>+30 Days</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
