"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Search,
  Phone,
  Mail,
  CalendarCheck2,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { Business } from "@/types/database";

export default function PlatformBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadBusinesses() {
      setLoading(true);
      const { db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "businesses"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Business[];
        setBusinesses(list);
      } catch (e) {
        console.error("Businesses load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  const filtered = businesses.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (b.name || "").toLowerCase().includes(q) ||
      (b.slug || "").toLowerCase().includes(q) ||
      (b.email || "").toLowerCase().includes(q) ||
      (b.phone || "").includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Loading tenant businesses from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            Tenant Businesses Registry
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            All registered multi-tenant client businesses • {businesses.length} total active tenants
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search by business name or slug..."
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
            <Building2 className="w-8 h-8 text-navy-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No businesses match your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-200">
              <thead className="bg-navy-950 border-b border-navy-800 font-mono text-[11px] uppercase text-navy-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Business Name & Slug</th>
                  <th className="py-3.5 px-6 font-bold">Owner UID</th>
                  <th className="py-3.5 px-6 font-bold">Contact Phone & Email</th>
                  <th className="py-3.5 px-6 font-bold">Plan & Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Public Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-850 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{b.name}</div>
                      <div className="font-mono text-xs text-gold-400 mt-0.5">/book/{b.slug}</div>
                      {b.city && <div className="text-[10px] text-navy-400 mt-0.5">{b.city}</div>}
                    </td>

                    <td className="py-4 px-6 font-mono text-[11px] text-navy-300">
                      <div className="truncate max-w-[140px] font-bold" title={b.owner_id}>
                        {b.owner_id}
                      </div>
                      {(b.owner_id === "vMZQTGlYSfM8adohQAZmSE3cNX02" || b.owner_id === "B0BY4eXhWzdPfzT5dl2dTieDkKp1" || b.owner_email === "rajkumar50036@gmail.com") && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-gold-400/20 text-gold-300 border border-gold-500/40">
                          PLATFORM OWNER
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono">
                      {b.phone && <div>{b.phone}</div>}
                      {b.email && <div className="text-[11px] text-navy-400 truncate max-w-[160px]">{b.email}</div>}
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-white uppercase block">
                        {(b as any).plan || "Professional"}
                      </span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {(b as any).subscription_status || "Active"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/book/${b.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gold-400 hover:text-gold-300"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
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
