"use client";

import React from "react";
import { Settings, ShieldCheck, Phone, Mail, Database, Key, CheckCircle2 } from "lucide-react";
import { VisroContactPhone } from "@/components/brand/VisroSlotLogo";

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-navy-800">
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
          Platform Architecture & Founder Identity
        </h1>
        <p className="text-xs sm:text-sm text-navy-400 mt-1">
          Master system credentials, Firebase database configuration, and founder access rules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Founder Account Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-gold-500/30 shadow-gold space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <span className="font-mono text-xs font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> FOUNDER ACCOUNT IDENTITY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gold-400 text-navy-950">
              PERMANENT EXEMPTION
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-navy-300">
              <span>PLATFORM OWNER:</span>
              <span className="text-white font-bold">rajkumar50036@gmail.com</span>
            </div>
            <div className="flex items-center justify-between text-navy-300">
              <span>OWNER UID:</span>
              <span className="text-white font-bold font-mono">vMZQTGlYSfM8adohQAZmSE3cNX02</span>
            </div>
            <div className="flex items-center justify-between text-navy-300">
              <span>SUPPORT INSTAGRAM:</span>
              <a href="https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline font-bold">@visroslot</a>
            </div>
          </div>

          <p className="text-xs text-navy-400 leading-relaxed pt-2 border-t border-navy-800">
            Designated Founder/Admin UID receives permanent internal access without a paid subscription. Exemption is verified server-side using immutable Firebase UID tokens.
          </p>
        </div>

        {/* Backend Infrastructure Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" /> FIREBASE CLOUD BACKEND
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              PRESERVED 100%
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-navy-300">
              <span>PROJECT ID:</span>
              <span className="text-white font-bold">visroslot</span>
            </div>
            <div className="flex items-center justify-between text-navy-300">
              <span>DATABASE:</span>
              <span className="text-white font-bold">Google Cloud Firestore</span>
            </div>
            <div className="flex items-center justify-between text-navy-300">
              <span>AUTH DOMAIN:</span>
              <span className="text-white font-bold">visroslot.firebaseapp.com</span>
            </div>
          </div>

          <p className="text-xs text-navy-400 leading-relaxed pt-2 border-t border-navy-800">
            Existing Firebase backend remains connected as the single source of truth. Zero destructive database migrations.
          </p>
        </div>
      </div>
    </div>
  );
}
