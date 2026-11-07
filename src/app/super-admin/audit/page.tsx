"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Clock } from "lucide-react";

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const formatTimestamp = (d: any) => {
    if (!d) return "—";
    try {
      const parsed = typeof d === "object" && d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
      return isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-IN");
    } catch {
      return "—";
    }
  };

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/super-admin/data?range=all")
      .then((res) => res.json())
      .then((data) => setLogs(data.auditLogs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.action || "").toLowerCase().includes(q) ||
      (l.admin_email || "").toLowerCase().includes(q) ||
      (l.target_id || "").toLowerCase().includes(q) ||
      (l.target_type || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Security & Admin Audit Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit trail of administrator sessions, lifecycle modifications and policy changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search action or target ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46] w-64"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C49A46]" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No audit log entries match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Target Type</th>
                  <th className="pb-3 font-semibold">Target ID</th>
                  <th className="pb-3 font-semibold">Admin Account</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/50">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {l.action}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                      {l.target_type}
                    </td>
                    <td className="py-3 font-mono text-slate-500 text-[11px]">
                      {l.target_id || "N/A"}
                    </td>
                    <td className="py-3 font-mono text-[#C49A46] text-[11px]">
                      {l.admin_email}
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-[10px] max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-400 text-[11px]">
                      {formatTimestamp(l.created_at)}
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
