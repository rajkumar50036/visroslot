"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  IndianRupee,
  Building2,
  TrendingUp,
  Eye,
  CreditCard,
  ShieldAlert,
  Loader2,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function SuperAdminOverviewPage() {
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (selectedRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/data?range=${selectedRange}`);
      if (!res.ok) {
        throw new Error(`Failed to load data (HTTP ${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Super Admin data fetch error:", err);
      setError(err.message || "Failed to fetch platform metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const kpis = data?.kpis || {};
  const businesses = data?.businesses || [];
  const auditLogs = data?.auditLogs || data?.audit_logs || [];
  const funnel = data?.funnel || { pageviews: 0, pricing: 0, register_start: 0, register_complete: 0, checkout: 0, paid: 0 };
  const onboarding = data?.onboarding_metrics || {
    total_payments: 0,
    successful_payments: 0,
    failed_payments: 0,
    pending_payments: 0,
    completed_business_profiles: 0,
    booking_links_unlocked: 0,
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "Recently";
    try {
      const d = typeof ts === "object" && ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return isNaN(d.getTime()) ? "Recently" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified production metrics directly from Firestore & first-party analytics.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-2xs">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "this_month", label: "This Month" },
            { id: "prev_month", label: "Previous Month" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                range === tab.id
                  ? "bg-[#101A2B] text-white dark:bg-[#C49A46] dark:text-[#101A2B] font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => fetchData(range)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Refresh Realtime Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C49A46]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Subscription Billing & Onboarding Audit Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C49A46]/20 text-[#C49A46]">
                PRODUCTION BILLING AUDIT
              </span>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Subscription Billing & Onboarding Audit
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live server-side tracking of Razorpay subscription payments, profile completions, and unlocked booking pages.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Realtime Firestore Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800 text-center">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Total Transactions
            </div>
            <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : (onboarding.total_payments ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Initiated Orders</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
              Captured Payments
            </div>
            <div className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {loading ? "..." : (onboarding.successful_payments ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-1">HMAC Verified</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
            <div className="text-[10px] font-mono text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-1">
              Failed Charges
            </div>
            <div className="font-display text-xl font-bold text-rose-700 dark:text-rose-400">
              {loading ? "..." : (onboarding.failed_payments ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400 mt-1">Cancelled / Expired</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
            <div className="text-[10px] font-mono text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
              Pending Authorization
            </div>
            <div className="font-display text-xl font-bold text-amber-700 dark:text-amber-400">
              {loading ? "..." : (onboarding.pending_payments ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-400 mt-1">In Mandate Auth</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800 text-center">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Completed Profiles
            </div>
            <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : (onboarding.completed_business_profiles ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Valid Business Slug</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
              Links Unlocked
            </div>
            <div className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {loading ? "..." : (onboarding.booking_links_unlocked ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-1">Live Booking URLs</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Core Financial & Usage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
            <span className="font-medium">Net Collections</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            ₹{loading ? "..." : (kpis.netCollections || 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Gross: ₹{(kpis.grossCollections || 0).toLocaleString("en-IN")}</span>
            <span>Refunds: ₹{(kpis.refunds || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Active Businesses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
            <span className="font-medium">Registered Businesses</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-[#C49A46]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : kpis.totalBusinesses ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {kpis.activeBusinesses ?? 0} Active Paying
            </span>
            <span>{kpis.expiredBusinesses ?? 0} Expired</span>
          </div>
        </div>

        {/* Website Traffic */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
            <span className="font-medium">Website Visitors</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : (kpis.uniqueVisitors || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{kpis.pageViews || 0} Page Views</span>
            <span>{kpis.pricingViews || 0} Pricing Visits</span>
          </div>
        </div>

        {/* Subscriptions breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
            <span className="font-medium">Active Subscriptions</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : ((kpis.proSubscriptions || 0) + (kpis.bizSubscriptions || 0))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pro (₹499): {kpis.proSubscriptions || 0}</span>
            <span className="text-[#C49A46] font-semibold">Biz (₹999): {kpis.bizSubscriptions || 0}</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Public Website Conversion Funnel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified anonymous first-party visitor telemetry (excluding internal admin sessions).
            </p>
          </div>
          <Link
            href="/super-admin/analytics"
            className="text-xs text-[#C49A46] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Full Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {[
            { label: "1. Page Views", count: funnel.pageviews ?? 0 },
            { label: "2. Pricing Views", count: funnel.pricing ?? 0 },
            { label: "3. Register Open", count: funnel.register_start ?? 0 },
            { label: "4. Register Complete", count: funnel.register_complete ?? 0 },
            { label: "5. Plan Checkout", count: funnel.checkout ?? 0 },
            { label: "6. Paid Subscription", count: funnel.paid ?? 0 },
          ].map((step, idx) => (
            <div
              key={step.label}
              className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800 text-center"
            >
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
                {step.label}
              </div>
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {(step.count ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Recent Registered Businesses & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Businesses */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Registered Businesses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live Firestore business records and active appointment capacity.
              </p>
            </div>
            <Link
              href="/super-admin/businesses"
              className="text-xs text-[#C49A46] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No registered businesses found in this date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="pb-3 font-semibold">Business</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Staff</th>
                    <th className="pb-3 font-semibold">Slug</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {businesses.slice(0, 5).map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/50">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{b.name || "Untitled Business"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.owner_email || b.owner_id}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300">
                          {b.plan || "Professional"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (b.subscription_status || "active").toLowerCase() === "active"
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {b.subscription_status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">
                        {b.staff_count || 1}
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {b.slug ? `/book/${b.slug}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Immutable Admin Audit Log Ticker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Admin Audit Trail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable security audit log.
              </p>
            </div>
            <Link
              href="/super-admin/audit"
              className="text-xs text-[#C49A46] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {log.target_type}: {log.target_id || "N/A"}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    By: {log.admin_email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
