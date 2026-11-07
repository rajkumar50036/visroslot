"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  ShieldCheck,
  Database,
  Server,
  Clock,
  RefreshCw,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  Mail,
  CreditCard,
  Layers,
} from "lucide-react";
import { IntegrationHealthService } from "@/types/database";

export default function SuperAdminHealthPage() {
  const [services, setServices] = useState<IntegrationHealthService[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>("CHECKING");
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/super-admin/health");
      const data = await res.json();
      if (res.ok && data.services) {
        setServices(data.services);
        setOverallStatus(data.overallStatus || "HEALTHY");
        setLastChecked(new Date().toLocaleTimeString("en-IN"));
      }
    } catch (e) {
      console.error("Health check error:", e);
      setOverallStatus("ERROR");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Integration & Infrastructure Health
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                overallStatus === "HEALTHY"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {overallStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of 9 backend integrations, database clusters, AutoPay refund tracking, and AI gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-[11px] font-mono text-slate-400">
              Checked at {lastChecked}
            </span>
          )}
          <button
            onClick={checkHealth}
            disabled={checking}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin text-[#C49A46]" : ""}`} />
            <span>Ping Services</span>
          </button>
        </div>
      </div>

      {/* Services Grid (All 9 Core Services) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv, idx) => {
          const isOperational = srv.status === "OPERATIONAL";
          const isDegraded = srv.status === "DEGRADED";

          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-[#101A2B] border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#C49A46]">
                    {srv.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOperational ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : isDegraded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Degraded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Setup Needed</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    {srv.name}
                  </h3>
                  {srv.latencyMs !== undefined && srv.latencyMs !== null && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Latency: <strong className="text-slate-700 dark:text-slate-200">{srv.latencyMs}ms</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-navy-800/80 space-y-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {srv.troubleshooting}
                </div>
                {srv.error && (
                  <div className="text-[10px] text-rose-500 font-mono">
                    Error: {srv.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
