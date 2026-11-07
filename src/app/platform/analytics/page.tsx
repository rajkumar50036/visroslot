"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Building2,
  CalendarCheck2,
  Receipt,
  Users,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export default function PlatformAnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalBusinesses: 0,
    totalAppointments: 0,
    totalGMV: 0,
    totalSaaSRevenue: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGlobalAnalytics() {
      setLoading(true);
      const { db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const [busSnap, apptsSnap, custSnap, paySnap] = await Promise.all([
          getDocs(collection(db, "businesses")).catch(() => ({ size: 0, docs: [] } as any)),
          getDocs(collection(db, "appointments")).catch(() => ({ size: 0, docs: [] } as any)),
          getDocs(collection(db, "customers")).catch(() => ({ size: 0, docs: [] } as any)),
          getDocs(collection(db, "payments")).catch(() => ({ size: 0, docs: [] } as any)),
        ]);

        let gmv = 0;
        apptsSnap.docs.forEach((d: any) => {
          const data = d.data();
          if (data.status === "COMPLETED" || data.status === "CONFIRMED") {
            gmv += Number(data.service_price) || Number(data.price) || 0;
          }
        });

        let saasRev = 0;
        paySnap.docs.forEach((d: any) => {
          saasRev += Number(d.data().amount) || 0;
        });

        setMetrics({
          totalBusinesses: busSnap.size || 0,
          totalAppointments: apptsSnap.size || 0,
          totalGMV: gmv,
          totalSaaSRevenue: saasRev,
          totalCustomers: custSnap.size || 0,
        });
      } catch (e) {
        console.error("Global analytics error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadGlobalAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Compiling Global Platform Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-navy-800">
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
          Global Platform Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-navy-400 mt-1">
          Aggregated ecosystem volume, gross merchandise value, and subscription revenue
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Global Booked GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            ₹{metrics.totalGMV.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Total service value booked across all tenants
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900 border border-gold-500/30 shadow-gold space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-gold-400">
            <span>Platform SaaS Revenue</span>
            <IndianRupee className="w-4 h-4 text-gold-400" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            ₹{metrics.totalSaaSRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-navy-300 font-mono">
            Captured subscription fees via Razorpay
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-400">
            <span>Global End-Clients</span>
            <Users className="w-4 h-4 text-navy-400" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white">
            {metrics.totalCustomers}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Total verified customer profiles created
          </p>
        </div>
      </div>
    </div>
  );
}
