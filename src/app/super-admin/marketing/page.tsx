"use client";

import React, { useState, useEffect } from "react";
import { Share2, Globe, Instagram, Search, ExternalLink, RefreshCw } from "lucide-react";

export default function SuperAdminMarketingPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/super-admin/data?range=30d")
      .then((res) => res.json())
      .then((data) => setSources(data.marketingSources || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Marketing Sources & Referrers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Attribution channels tracking Instagram bio traffic, direct visitors, and search discovery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Direct Traffic</span>
            <Globe className="w-4 h-4 text-[#C49A46]" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {sources.find((s) => (s.source || "").toLowerCase() === "direct")?.count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Direct URL navigations</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Instagram Traffic</span>
            <Instagram className="w-4 h-4 text-pink-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {sources.find((s) => (s.source || "").toLowerCase().includes("instagram"))?.count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bio links, stories and DMs</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Search / Referrals</span>
            <Search className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {sources
              .filter((s) => !["direct", "instagram"].includes((s.source || "").toLowerCase()))
              .reduce((acc, s) => acc + (s.count || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Search engines and external links</div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Attribution Breakdown
        </h2>

        {sources.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No marketing source records captured yet in this timeframe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Source Channel</th>
                  <th className="pb-3 font-semibold">Total Sessions</th>
                  <th className="pb-3 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td className="py-3 font-medium text-slate-900 dark:text-white capitalize">
                      {s.source}
                    </td>
                    <td className="py-3 font-mono">{s.count.toLocaleString()}</td>
                    <td className="py-3 font-mono text-slate-500">
                      {Math.round((s.count / Math.max(1, sources.reduce((a, b) => a + b.count, 0))) * 100)}%
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
