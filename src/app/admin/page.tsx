"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Layers, 
  ArrowLeft,
  DollarSign
} from "lucide-react";
import { initialSaaSPlans, initialSaaSSubscriptions } from "@/lib/store/mock-data";
import { SaaSPlan, SaaSSubscription } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

export default function SuperAdminPage() {
  const [plans, setPlans] = useState<SaaSPlan[]>(initialSaaSPlans);
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>(initialSaaSSubscriptions);

  // Calculations
  const totalTenants = subscriptions.length;
  const activeTenants = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const trialTenants = subscriptions.filter((s) => s.status === "TRIAL").length;
  const totalSaaSMRR = subscriptions.reduce((sum, s) => sum + s.monthly_amount, 0);

  const toggleRestaurantStatus = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: s.status === "ACTIVE" ? ("CANCELLED" as const) : ("ACTIVE" as const) }
          : s
      )
    );
  };

  const handleUpdatePrice = (planId: string) => {
    const newPrice = prompt("Enter new monthly subscription price ($):");
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, monthly_price: parseFloat(newPrice) } : p))
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1c30] text-white font-sans select-none antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-8 border-b border-white/10 bg-[#0e223b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center font-bold text-white shadow-md">
            RF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">RestoFlow Platform</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                SUPER ADMIN
              </span>
            </div>
            <span className="text-xs text-[#cbdbf5]/60">SaaS Multi-Tenant Architecture Controller</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Bistro Grande Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#14243b] border border-white/10 shadow-lg">
            <span className="text-xs font-bold text-[#cbdbf5]/70 uppercase tracking-wider block">
              SaaS Monthly Recurring Revenue (MRR)
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {formatCurrency(totalSaaSMRR, "USD", "$")}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% ARR Growth vs last quarter</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#14243b] border border-white/10 shadow-lg">
            <span className="text-xs font-bold text-[#cbdbf5]/70 uppercase tracking-wider block">
              Active Registered Tenants
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">{totalTenants}</div>
            <div className="text-xs text-[#cbdbf5]/70 mt-2">
              {activeTenants} Active • {trialTenants} Trial Accounts
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#14243b] border border-white/10 shadow-lg">
            <span className="text-xs font-bold text-[#cbdbf5]/70 uppercase tracking-wider block">
              Tenant Data Isolation (RLS)
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100% Secure</div>
            <div className="text-xs text-[#cbdbf5]/70 mt-2">
              PostgreSQL Row Level Security Active
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#14243b] border border-white/10 shadow-lg">
            <span className="text-xs font-bold text-[#cbdbf5]/70 uppercase tracking-wider block">
              Billing Model Segregation
            </span>
            <div className="text-2xl font-bold text-purple-400 mt-1">Zero-Gateway</div>
            <div className="text-xs text-[#cbdbf5]/70 mt-2">
              Food Paid at Counter • Subscriptions Separate
            </div>
          </div>
        </div>

        {/* Restaurant Tenants Management */}
        <div className="bg-[#14243b] rounded-2xl border border-white/10 shadow-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">Registered Restaurant Tenants</h3>
            </div>
            <span className="text-xs text-[#cbdbf5]/60">Isolated multi-tenant database partitions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 text-[#cbdbf5]/70 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Restaurant Brand</th>
                  <th className="p-3">Subscription Tier</th>
                  <th className="p-3">Monthly Billing</th>
                  <th className="p-3">Cycle End</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5">
                    <td className="p-3 font-bold text-white">{sub.restaurant_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {sub.plan_name}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      {formatCurrency(sub.monthly_amount, "USD", "$")}/mo
                    </td>
                    <td className="p-3 text-[#cbdbf5]/60">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : sub.status === "TRIAL"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleRestaurantStatus(sub.id)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          sub.status === "ACTIVE"
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {sub.status === "ACTIVE" ? "Suspend Tenant" : "Re-activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Plans Management */}
        <div className="bg-[#14243b] rounded-2xl border border-white/10 shadow-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base text-white">SaaS Subscription Plans & Pricing</h3>
            </div>
            <span className="text-xs text-[#cbdbf5]/60">Configurable tiers for restaurant owners</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-white">{p.name} Plan</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold">
                      Max {p.max_tables} Tables
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-3xl font-extrabold text-white">
                      {formatCurrency(p.monthly_price, "USD", "$")}
                    </span>
                    <span className="text-xs text-[#cbdbf5]/60"> / month</span>
                  </div>

                  <ul className="space-y-2 text-xs text-[#cbdbf5]/80 my-4">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpdatePrice(p.id)}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg border border-white/20 transition-colors"
                >
                  Edit Plan Price
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
