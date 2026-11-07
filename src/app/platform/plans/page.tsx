"use client";

import React, { useState } from "react";
import { CreditCard, Check, Save, Sparkles, ShieldCheck } from "lucide-react";

export default function PlatformPlansPage() {
  const [proMonthly, setProMonthly] = useState("499");
  const [proYearly, setProYearly] = useState("4990");
  const [bizMonthly, setBizMonthly] = useState("999");
  const [bizYearly, setBizYearly] = useState("9990");
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            Plan Pricing & Catalog Configuration
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Configure default subscription rates for public tiers • Public Free & Lifetime plans removed
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gold-400 text-navy-950 text-xs font-mono font-bold hover:brightness-110 shadow-gold flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Pricing Structure</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Plan pricing parameters updated across VisroSlot platform.</span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Professional Plan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-navy-950 text-gold-400 border border-gold-500/20">
              ACTIVE PUBLIC TIER
            </span>
          </div>

          <p className="text-xs text-navy-300">
            Entry-level plan for solo practitioners, private aesthetic clinics, and individual service studios.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-navy-400 mb-1.5">
                Monthly Fee (INR ₹)
              </label>
              <input
                type="number"
                value={proMonthly}
                onChange={(e) => setProMonthly(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-navy-400 mb-1.5">
                Annual Fee (INR ₹)
              </label>
              <input
                type="number"
                value={proYearly}
                onChange={(e) => setProYearly(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-gold-500/30 shadow-gold space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Business Suite
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-400 text-navy-950 shadow-gold">
              TOP TIER
            </span>
          </div>

          <p className="text-xs text-navy-300">
            Enterprise grade for multi-chair salons, medical practices, and multi-staff franchise locations.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-navy-400 mb-1.5">
                Monthly Fee (INR ₹)
              </label>
              <input
                type="number"
                value={bizMonthly}
                onChange={(e) => setBizMonthly(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-navy-400 mb-1.5">
                Annual Fee (INR ₹)
              </label>
              <input
                type="number"
                value={bizYearly}
                onChange={(e) => setBizYearly(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
