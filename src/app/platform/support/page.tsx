"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Search, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function PlatformSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, "support_tickets"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setTickets(list);
    } catch (e) {
      console.error("Support tickets load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      await updateDoc(doc(db, "support_tickets", id), {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error("Error updating ticket status:", e);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (t.subject || "").toLowerCase().includes(q) ||
      (t.message || "").toLowerCase().includes(q) ||
      (t.user_id || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Loading support tickets from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            Support Desk & Tickets
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Incoming customer help inquiries, migration requests, and system issues • {tickets.length} tickets
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search tickets by subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-navy-900 border border-navy-800 rounded-2xl text-white placeholder-navy-500 focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-3xl bg-navy-900 border border-navy-800 overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-navy-400 space-y-2">
            <HelpCircle className="w-8 h-8 text-navy-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No support tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-200">
              <thead className="bg-navy-950 border-b border-navy-800 font-mono text-[11px] uppercase text-navy-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Ticket Subject & Detail</th>
                  <th className="py-3.5 px-6 font-bold">User / Tenant UID</th>
                  <th className="py-3.5 px-6 font-bold">Priority</th>
                  <th className="py-3.5 px-6 font-bold">Created Date</th>
                  <th className="py-3.5 px-6 font-bold text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-navy-850 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{t.subject}</div>
                      <div className="text-xs text-navy-400 line-clamp-2 mt-0.5">{t.message}</div>
                    </td>

                    <td className="py-4 px-6 font-mono text-[11px] text-navy-300">
                      <span className="truncate block max-w-[150px]">{t.user_id}</span>
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === "urgent" || t.priority === "critical"
                            ? "bg-red-950 text-red-400 border border-red-500/30"
                            : "bg-navy-950 text-gold-400 border border-gold-500/20"
                        }`}
                      >
                        {t.priority || "normal"}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-navy-400">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : "Recent"}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <select
                        value={t.status || "open"}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-navy-950 border border-navy-700 text-gold-300 focus:outline-none focus:border-gold-400"
                      >
                        <option value="open">OPEN</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>
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
