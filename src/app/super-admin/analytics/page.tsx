"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Eye, Smartphone, Monitor, Globe, RefreshCw, AlertCircle, ArrowUpRight } from "lucide-react";

export default function SuperAdminAnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/super-admin/data?range=${range}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const kpis = data?.kpis || {};
  const funnel = data?.funnel || { pageviews: 0, pricing: 0, register_start: 0, register_complete: 0, checkout: 0, paid: 0 };
  const daily = data?.daily || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Website Analytics & Funnel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Genuine first-party telemetry recorded on public VisroSlot routes.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800">
          {["today", "7d", "30d", "this_month"].map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                range === t
                  ? "bg-[#101A2B] text-white dark:bg-[#C49A46] dark:text-[#101A2B] font-semibold"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t === "today" ? "Today" : t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Unique Visitors</div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : (kpis.uniqueVisitors || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Anonymous deduplicated visitor IDs</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Total Page Views</div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : (kpis.pageViews || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All verified public navigation events</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Pricing Interest</div>
          <div className="font-display text-2xl font-bold text-[#C49A46]">
            {loading ? "..." : (kpis.pricingViews || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Visitors viewing subscription plans</div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Full Customer Conversion Pipeline
        </h2>

        <div className="space-y-3 pt-2">
          {[
            { name: "Public Page Views", count: funnel.pageviews ?? 0, percent: "100%" },
            {
              name: "Pricing Inquiries",
              count: funnel.pricing ?? 0,
              percent: funnel.pageviews && funnel.pageviews > 0 ? `${Math.round(((funnel.pricing ?? 0) / funnel.pageviews) * 100)}%` : "0%",
            },
            {
              name: "Registration Started",
              count: funnel.register_start ?? 0,
              percent: funnel.pageviews && funnel.pageviews > 0 ? `${Math.round(((funnel.register_start ?? 0) / funnel.pageviews) * 100)}%` : "0%",
            },
            {
              name: "Account Created",
              count: funnel.register_complete ?? 0,
              percent: funnel.register_start && funnel.register_start > 0 ? `${Math.round(((funnel.register_complete ?? 0) / funnel.register_start) * 100)}%` : "0%",
            },
            {
              name: "Checkout Initiated",
              count: funnel.checkout ?? 0,
              percent: funnel.register_complete && funnel.register_complete > 0 ? `${Math.round(((funnel.checkout ?? 0) / funnel.register_complete) * 100)}%` : "0%",
            },
            {
              name: "Paid Subscription Active",
              count: funnel.paid ?? 0,
              percent: funnel.checkout && funnel.checkout > 0 ? `${Math.round(((funnel.paid ?? 0) / funnel.checkout) * 100)}%` : "0%",
            },
          ].map((item, idx) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                <span className="font-mono text-slate-500">
                  {(item.count ?? 0).toLocaleString()} ({item.percent})
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-navy-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C49A46] to-[#D9B66E] rounded-full transition-all duration-500"
                  style={{
                    width: funnel.pageviews && funnel.pageviews > 0
                      ? `${Math.max(2, Math.min(100, Math.round(((item.count ?? 0) / (funnel.pageviews || 1)) * 100)))}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
