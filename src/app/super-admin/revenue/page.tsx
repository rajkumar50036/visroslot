"use client";

import React, { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, ShieldCheck, CreditCard, RefreshCw, AlertCircle } from "lucide-react";

export default function SuperAdminRevenuePage() {
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
  const payments = data?.payments || [];

  const formatDate = (d: any) => {
    if (!d) return "—";
    try {
      const parsed = typeof d === "object" && d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
      return isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-IN");
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales & Revenue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconciled collections via verified Razorpay payment records.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Gross Collections</div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            ₹{loading ? "..." : (kpis.grossCollections || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All captured customer transactions</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Refunds Processed</div>
          <div className="font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
            ₹{loading ? "..." : (kpis.refunds || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Returned or disputed charges</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Net Collections</div>
          <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{loading ? "..." : (kpis.netCollections || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gross collections minus refunds</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="text-xs text-slate-500 mb-1">Successful Sales</div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : (kpis.salesCount || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Verified payment orders</div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Verified Payment Transactions
        </h2>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No payment records captured in this date filter. All real purchases via Razorpay are logged here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Payment ID</th>
                  <th className="pb-3 font-semibold">Business</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3 font-mono font-medium">{p.id}</td>
                    <td className="py-3">{p.business_name || p.business_id}</td>
                    <td className="py-3 uppercase font-mono">{p.plan || "PRO"}</td>
                    <td className="py-3 font-bold font-mono">₹{p.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">
                      {formatDate(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
