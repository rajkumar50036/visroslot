"use client";

import React, { useState } from "react";
import { Settings, ShieldCheck, User, Key, Lock, Bell, CheckCircle2 } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [notificationEmail, setNotificationEmail] = useState("rajkumar50036@gmail.com");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Super Admin Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Identity authorization, cryptographic credentials and security policies.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#C49A46]" />
          <span>Administrator Identity</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Primary Email</span>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">
              rajkumar50036@gmail.com
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Verified Primary Super Admin
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Immutable Firebase UID</span>
            <div className="font-mono text-slate-900 dark:text-white mt-1 text-[11px] truncate">
              vMZQTGlYSfM8adohQAZmSE3cNX02
            </div>
            <div className="text-[10px] text-[#C49A46] mt-0.5 font-mono">
              Custom Claim: super_admin=true
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Security & Authorization Model</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Server-Side Cookie Verification
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every Super Admin request is cryptographically validated on the server using HTTP-only cookies and Firebase Admin SDK tokens.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Zero Frontend Hardcoded Secrets
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Admin permissions and Firestore rules enforce UID-level constraints. No passwords or tokens are stored in database records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
