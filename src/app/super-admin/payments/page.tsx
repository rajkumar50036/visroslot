"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, IndianRupee, ShieldCheck, Check, RefreshCw } from "lucide-react";

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: any) => {
    if (!d) return "—";
    try {
      const parsed = typeof d === "object" && d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
      return isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-IN");
    } catch {
      return "—";
    }
  };

  const fetchPayments = () => {
    setLoading(true);
    fetch("/api/super-admin/data?range=all")
      .then((res) => res.json())
      .then((data) => setPayments(data.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verified Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconciled transaction ledger with verified Razorpay payment references.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C49A46]" : ""}`} />
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading verified payment ledger...</div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 dark:text-navy-700 mx-auto" />
            <div className="font-medium">No verified payment transactions logged yet.</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              When business owners complete Razorpay checkout for Pro (₹499) or Business (₹999), verified records appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Razorpay Reference</th>
                  <th className="pb-3 font-semibold">Business</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-mono font-medium text-slate-900 dark:text-white">{p.id}</td>
                    <td className="py-3">{p.business_name || p.business_id}</td>
                    <td className="py-3 uppercase font-mono">{p.plan || "Pro"}</td>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">₹{p.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {p.status || "CAPTURED"}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
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
