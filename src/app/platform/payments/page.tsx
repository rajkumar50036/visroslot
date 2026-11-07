"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Search, Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      const { db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "payments"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        setPayments(list);
      } catch (e) {
        console.error("Payments load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (p.business_id || "").toLowerCase().includes(q) ||
      (p.order_id || "").toLowerCase().includes(q) ||
      (p.payment_id || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Loading payment receipts from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            Razorpay Transactions & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Global ledger of captured payments and subscription charges • {payments.length} transactions
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search by Payment ID or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-navy-900 border border-navy-800 rounded-2xl text-white placeholder-navy-500 focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-navy-900 border border-navy-800 overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-navy-400 space-y-2">
            <Receipt className="w-8 h-8 text-navy-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-200">
              <thead className="bg-navy-950 border-b border-navy-800 font-mono text-[11px] uppercase text-navy-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Payment ID & Order</th>
                  <th className="py-3.5 px-6 font-bold">Business ID</th>
                  <th className="py-3.5 px-6 font-bold">Plan / Billing</th>
                  <th className="py-3.5 px-6 font-bold">Amount</th>
                  <th className="py-3.5 px-6 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-850 transition-colors">
                    <td className="py-4 px-6 font-mono">
                      <div className="font-bold text-white">{p.payment_id || p.id}</div>
                      <div className="text-[10px] text-navy-400">Order: {p.order_id || "N/A"}</div>
                    </td>

                    <td className="py-4 px-6 font-mono text-navy-300">
                      {p.business_id}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-white uppercase">{p.plan || "Professional"}</div>
                      <div className="text-[10px] font-mono text-navy-400 uppercase">
                        {p.billing_cycle || "monthly"}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-gold-300">
                      ₹{p.amount || 0}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 uppercase">
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
    </div>
  );
}
