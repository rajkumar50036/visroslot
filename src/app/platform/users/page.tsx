"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Shield, Calendar, Loader2 } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const { db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        setUsers(list);
      } catch (e) {
        console.error("Users load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Loading user profiles from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            User Accounts & Authentication
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Registered business owners and tenant administrators • {users.length} accounts in Firestore
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search by name, email, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-navy-900 border border-navy-800 rounded-2xl text-white placeholder-navy-500 focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-navy-900 border border-navy-800 overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-navy-400 space-y-2">
            <Users className="w-8 h-8 text-navy-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No user records match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-200">
              <thead className="bg-navy-950 border-b border-navy-800 font-mono text-[11px] uppercase text-navy-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">User Identity</th>
                  <th className="py-3.5 px-6 font-bold">Immutable UID</th>
                  <th className="py-3.5 px-6 font-bold">Role</th>
                  <th className="py-3.5 px-6 font-bold">Plan Enrolled</th>
                  <th className="py-3.5 px-6 font-bold text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-850 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">
                        {u.fullName || "Registered User"}
                      </div>
                      <div className="text-[11px] text-navy-400 font-mono mt-0.5">{u.email}</div>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs">
                      <span className="truncate block max-w-[160px]">{u.id}</span>
                      {(u.id === "vMZQTGlYSfM8adohQAZmSE3cNX02" || u.id === "B0BY4eXhWzdPfzT5dl2dTieDkKp1" || u.email === "rajkumar50036@gmail.com") && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-gold-400/20 text-gold-300 border border-gold-500/40">
                          PLATFORM OWNER
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy-950 text-gold-400 border border-gold-500/20 uppercase">
                        {u.role || "OWNER"}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-white uppercase">
                      {u.selectedPlan || "Professional"}
                    </td>

                    <td className="py-4 px-6 font-mono text-navy-400 text-right">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "Recorded"}
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
