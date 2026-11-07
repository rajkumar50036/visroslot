"use client";

import React from "react";
import { Receipt, CreditCard, QrCode, Timer } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency } from "@/lib/utils";

export const MetricsBar: React.FC = () => {
  const { kpis } = useAppStore();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 select-none font-sans">
      {/* Metric 1: Live Active Orders */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/60 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
            Live Active Orders
          </span>
          <span className="p-1.5 rounded-lg bg-[#dbe1ff] text-[#004ac6]">
            <Receipt className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-[#0b1c30]">
            {kpis.activeOrdersCount}
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            +3 vs 30m ago
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#434655]">
          <span><strong className="text-amber-700">{kpis.preparingCount}</strong> Preparing</span>
          <span>•</span>
          <span><strong className="text-red-600">{kpis.pendingUnacknowledgedCount}</strong> Unacknowledged</span>
          <span>•</span>
          <span><strong className="text-emerald-700">{kpis.readyCount}</strong> Ready</span>
        </div>
      </div>

      {/* Metric 2: Pending Counter Unpaid Amount */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/60 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
            Pending Counter Unpaid
          </span>
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <CreditCard className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-[#0b1c30]">
            {formatCurrency(kpis.pendingCounterUnpaidAmount, "USD", "$")}
          </span>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            COUNTER ONLY
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#c3c6d7]/30 text-xs text-[#434655] truncate">
          No Online Gateway • Settle at Cashier Register
        </div>
      </div>

      {/* Metric 3: Today Scans & QR Traffic */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/60 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
            Today QR Traffic
          </span>
          <span className="p-1.5 rounded-lg bg-[#eaddff] text-[#712ae2]">
            <QrCode className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-[#0b1c30]">
            {kpis.totalScans} Scans
          </span>
          <span className="text-xs font-bold text-[#004ac6]">
            {kpis.conversionRate}% Conv
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#434655]">
          <span>{kpis.activeOrdersCount * 2} active table sessions</span>
          <span className="text-emerald-700 font-semibold">100% Zero-Drop</span>
        </div>
      </div>

      {/* Metric 4: Avg Kitchen Prep Time */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/60 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
            Avg Kitchen Prep Time
          </span>
          <span className="p-1.5 rounded-lg bg-[#dce9ff] text-[#0b1c30]">
            <Timer className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-[#0b1c30]">
            {kpis.avgPrepTimeMinutes} min
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Target &lt; 18m
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#434655]">
          <span>Hot Line: 12.8m</span>
          <span>•</span>
          <span>Grill: 15.6m</span>
        </div>
      </div>
    </section>
  );
};
