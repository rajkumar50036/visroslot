"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Receipt,
  PhoneCall,
  BarChart3,
  TrendingUp,
  Loader2,
  CalendarCheck2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export default function PlatformOverviewPage() {
  const [counts, setCounts] = useState({
    businesses: 0,
    appointments: 0,
    users: 0,
    leads: 0,
    subscriptions: 0,
    payments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlatformKPIs() {
      setLoading(true);
      const { db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const [busSnap, apptsSnap, userSnap, leadSnap, subSnap, paySnap] = await Promise.all([
          getDocs(collection(db, "businesses")).catch(() => ({ size: 0 } as any)),
          getDocs(collection(db, "appointments")).catch(() => ({ size: 0 } as any)),
          getDocs(collection(db, "users")).catch(() => ({ size: 0 } as any)),
          getDocs(collection(db, "leads")).catch(() => ({ size: 0 } as any)),
          getDocs(collection(db, "subscriptions")).catch(() => ({ size: 0 } as any)),
          getDocs(collection(db, "payments")).catch(() => ({ size: 0 } as any)),
        ]);

        setCounts({
          businesses: busSnap.size || 0,
          appointments: apptsSnap.size || 0,
          users: userSnap.size || 0,
          leads: leadSnap.size || 0,
          subscriptions: subSnap.size || 0,
          payments: paySnap.size || 0,
        });
      } catch (e) {
        console.error("Platform metrics error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadPlatformKPIs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Aggregating Global Firestore Collections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
              Executive Platform Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gold-400 text-navy-950 shadow-gold">
              FOUNDER ROOT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Global multi-tenant overview • Cloud Firestore Asian Region cluster
          </p>
        </div>

        <Link
          href="/platform/leads"
          className="px-5 py-2.5 rounded-xl bg-gold-400 text-navy-950 text-xs font-mono font-bold hover:brightness-110 shadow-gold flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Open Sales CRM ({counts.leads} Leads)</span>
        </Link>
      </div>

      {/* 6 High-Level System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/platform/businesses"
          className="p-6 rounded-3xl bg-navy-900 border border-navy-800 hover:border-gold-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Tenant Businesses</span>
            <Building2 className="w-4 h-4 text-gold-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.businesses}
          </div>
          <p className="text-[11px] text-navy-400 font-mono flex items-center justify-between">
            <span>Active businesses in Firestore</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
          </p>
        </Link>

        <Link
          href="/platform/leads"
          className="p-6 rounded-3xl bg-navy-900 border border-gold-500/30 hover:border-gold-400 transition-all shadow-gold space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase text-gold-400">
            <span>Sales CRM Leads</span>
            <PhoneCall className="w-4 h-4 text-gold-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.leads}
          </div>
          <p className="text-[11px] text-navy-300 font-mono flex items-center justify-between">
            <span>Website enquiries & Instagram leads</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
          </p>
        </Link>

        <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Total Appointments</span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.appointments}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Across all tenant schedules
          </p>
        </div>

        <Link
          href="/platform/users"
          className="p-6 rounded-3xl bg-navy-900 border border-navy-800 hover:border-gold-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-navy-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.users}
          </div>
          <p className="text-[11px] text-navy-400 font-mono flex items-center justify-between">
            <span>Firebase Auth profiles</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
          </p>
        </Link>

        <Link
          href="/platform/subscriptions"
          className="p-6 rounded-3xl bg-navy-900 border border-navy-800 hover:border-gold-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Subscriptions</span>
            <ShieldCheck className="w-4 h-4 text-gold-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.subscriptions}
          </div>
          <p className="text-[11px] text-navy-400 font-mono flex items-center justify-between">
            <span>Active & recurring plans</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
          </p>
        </Link>

        <Link
          href="/platform/payments"
          className="p-6 rounded-3xl bg-navy-900 border border-navy-800 hover:border-gold-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Razorpay Payments</span>
            <Receipt className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {counts.payments}
          </div>
          <p className="text-[11px] text-navy-400 font-mono flex items-center justify-between">
            <span>Verified captured receipts</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
          </p>
        </Link>
      </div>
    </div>
  );
}
