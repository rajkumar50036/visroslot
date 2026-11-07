"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  CreditCard, 
  AlertOctagon, 
  FileText, 
  Bell, 
  Printer, 
  Volume2, 
  CheckCircle2,
  X
} from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency } from "@/lib/utils";

interface TopNavProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenShiftReport?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  searchQuery,
  onSearchChange,
  onOpenShiftReport,
}) => {
  const pathname = usePathname();
  const { state, kpis, toggleEmergencyStop } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex justify-between items-center w-full px-6 py-2.5 bg-white border-b border-[#c3c6d7]/60 shadow-sm shrink-0 z-30 font-sans select-none">
      {/* Left: Title & Quick Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#0b1c30]">RestoFlow SaaS</span>
          <span className="text-[#c3c6d7]">/</span>
          <span className="text-xs font-bold text-[#004ac6] bg-[#eff4ff] px-2.5 py-0.5 rounded-full border border-[#004ac6]/20">
            Live Command Center
          </span>
        </div>

        {/* Top Navigation Links */}
        <nav className="hidden xl:flex items-center gap-4 pl-4 border-l border-[#c3c6d7]/40 text-xs font-semibold">
          <Link
            href="/dashboard"
            className={`pb-0.5 transition-colors ${
              pathname === "/dashboard"
                ? "text-[#004ac6] border-b-2 border-[#004ac6] font-bold"
                : "text-[#434655] hover:text-[#0b1c30]"
            }`}
          >
            Orders Feed
          </Link>
          <Link
            href="/dashboard/kds"
            className={`pb-0.5 transition-colors ${
              pathname === "/dashboard/kds"
                ? "text-[#004ac6] border-b-2 border-[#004ac6] font-bold"
                : "text-[#434655] hover:text-[#0b1c30]"
            }`}
          >
            KDS Screen
          </Link>
          <Link
            href="/dashboard/cashier"
            className={`pb-0.5 transition-colors ${
              pathname === "/dashboard/cashier"
                ? "text-[#004ac6] border-b-2 border-[#004ac6] font-bold"
                : "text-[#434655] hover:text-[#0b1c30]"
            }`}
          >
            Counter Audit
          </Link>
        </nav>

        {/* Search Field */}
        <div className="relative w-56 md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737686]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Press / to filter tables, orders..."
            className="w-full h-9 pl-9 pr-8 text-xs rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all text-[#0b1c30]"
          />
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-[#c3c6d7] text-[#434655]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Operational Controls & Cash Register Status */}
      <div className="flex items-center gap-3">
        {/* Register Cashier Status KPI */}
        <Link
          href="/dashboard/cashier"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5eeff] border border-[#c3c6d7]/40 hover:bg-[#dce9ff] transition-colors"
        >
          <CreditCard className="w-4 h-4 text-[#004ac6]" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-bold text-[#434655] tracking-wider leading-none">
              Register #01
            </span>
            <span className="text-xs font-bold text-[#0b1c30] leading-tight">
              {formatCurrency(kpis.pendingCounterUnpaidAmount, "USD", "$")} Pending
            </span>
          </div>
        </Link>

        {/* Emergency Order Pause Button */}
        <button
          onClick={toggleEmergencyStop}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
            state.emergencyStop
              ? "bg-red-600 text-white border-red-700 animate-pulse"
              : "bg-[#ffdad6] hover:bg-red-100 text-[#ba1a1a] border-red-200"
          }`}
          title="Emergency Stop disables incoming public orders temporarily"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>{state.emergencyStop ? "STOPPED" : "Emergency Stop"}</span>
        </button>

        {/* Shift Report Action */}
        <button
          onClick={onOpenShiftReport}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold border border-[#c3c6d7] active:scale-95 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-[#434655]" />
          <span>Shift Report</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-[#eff4ff] text-[#434655] relative transition-colors"
            title="Service Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {state.serviceRequests.some((r) => r.status === "PENDING") && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-2xl border border-[#c3c6d7] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#c3c6d7]/40 text-xs font-bold text-[#0b1c30]">
                <span>Table Service Alerts</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                {state.serviceRequests.length === 0 ? (
                  <p className="text-xs text-[#737686] text-center py-4">No active table calls</p>
                ) : (
                  state.serviceRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7]/40 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-[#004ac6]">
                          {req.type === "CALL_WAITER" ? "Call Waiter" : "Bill Request"}
                        </span>
                        <div className="text-[11px] text-[#434655]">Table {req.table_number}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {req.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Printer sync status */}
        <button
          className="p-2 rounded-lg hover:bg-[#eff4ff] text-emerald-600 transition-colors"
          title="Sensors & Thermal Printer Online"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Manager Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#c3c6d7]/40">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            AV
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-xs font-bold text-[#0b1c30] leading-none">Alex Vance</span>
            <span className="text-[10px] text-[#434655] leading-none mt-0.5">Floor Shift Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
};
