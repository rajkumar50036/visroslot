"use client";

import React, { useState, useEffect } from "react";
import { Building2, Search, ExternalLink, ShieldCheck, Power, RefreshCw, AlertCircle, Check, Loader2 } from "lucide-react";

export default function SuperAdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBusinesses = () => {
    setLoading(true);
    fetch("/api/super-admin/data?range=all")
      .then((res) => res.json())
      .then((data) => setBusinesses(data.businesses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleToggleStatus = async (businessId: string, currentStatus: string) => {
    setActionLoading(businessId);
    setMessage(null);
    try {
      const newStatus = (currentStatus || "").toLowerCase() === "active" ? "paused" : "active";
      const res = await fetch("/api/super-admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_BUSINESS_STATUS",
          businessId,
          newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMessage(`Business status updated to ${newStatus}.`);
      fetchBusinesses();
    } catch (err: any) {
      alert(err.message || "Could not update business status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgradePlan = async (businessId: string, currentPlan: string) => {
    setActionLoading(businessId);
    setMessage(null);
    try {
      const newPlan = (currentPlan || "").toLowerCase() === "business" ? "professional" : "business";
      const res = await fetch("/api/super-admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNLOCK_PLAN",
          targetId: businessId,
          data: { plan: newPlan, isUnlimited: newPlan === "business" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMessage(
        `Business plan updated to ${
          newPlan === "business" ? "Business Suite (Unlimited Bookings)" : "Professional Plan (300 Bookings)"
        }.`
      );
      fetchBusinesses();
    } catch (err: any) {
      alert(err.message || "Could not update business plan.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(q) ||
      (b.slug || "").toLowerCase().includes(q) ||
      (b.owner_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Registered Businesses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database of tenant businesses, subscription status and staff allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, slug or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46] w-64"
            />
          </div>
          <button
            onClick={fetchBusinesses}
            className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C49A46]" : ""}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#C49A46]" />
            <span>Loading registered businesses...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No businesses match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Business Name</th>
                  <th className="pb-3 font-semibold">Owner ID / Email</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Staff</th>
                  <th className="pb-3 font-semibold">Public Link</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filtered.map((b) => {
                  const isActive = (b.subscription_status || "active").toLowerCase() === "active";
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/50">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {b.name || "Untitled Business"}
                      </td>
                      <td className="py-3 font-mono text-slate-500 text-[11px]">
                        {b.owner_email || b.owner_id || "Unassigned"}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300">
                          {b.plan || "Professional"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                        {b.staff_count || 1}
                      </td>
                      <td className="py-3">
                        {b.slug ? (
                          <a
                            href={`/book/${b.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#C49A46] hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>/{b.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">No slug</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleUpgradePlan(b.id, b.plan || "professional")}
                          disabled={actionLoading === b.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-[#C49A46] border border-amber-300/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer"
                          title="Toggle between Professional (300 Bookings) and Business Suite (Unlimited Bookings)"
                        >
                          {(b.plan || "").toLowerCase() === "business" ? "Downgrade Pro" : "Unlock Business"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(b.id, b.subscription_status || "active")}
                          disabled={actionLoading === b.id}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            isActive
                              ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {actionLoading === b.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isActive ? (
                            "Pause Link"
                          ) : (
                            "Activate Link"
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
