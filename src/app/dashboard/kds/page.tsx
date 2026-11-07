"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useAppStore } from "@/lib/store/app-store";
import { ChefHat, Clock, AlertTriangle, CheckCircle, Flame, Check } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function KDSPage() {
  const { state, updateOrderStatus } = useAppStore();
  const [selectedStation, setSelectedStation] = useState("ALL");
  const [completedItems, setCompletedItems] = useState<{ [itemId: string]: boolean }>({});

  const stations = ["ALL", "Hot Line", "Grill", "Cold Kitchen", "Beverage Bar", "Dessert"];

  const activeKdsOrders = state.orders.filter(
    (o) => (o.order_status === "PREPARING" || o.order_status === "PENDING" || o.order_status === "ACCEPTED") &&
      (selectedStation === "ALL" || o.kitchen_station?.toLowerCase().includes(selectedStation.toLowerCase()))
  );

  const toggleItemCheck = (itemId: string) => {
    setCompletedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <div className="flex h-screen bg-[#0b1c30] text-white antialiased overflow-hidden font-sans select-none">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#0b1c30]">
        <TopNav searchQuery="" onSearchChange={() => {}} />

        {/* Station Filter Tabs */}
        <div className="px-6 py-3 border-b border-white/10 bg-[#0e223b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Kitchen Display System (KDS)</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
              {activeKdsOrders.length} Active Tickets
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {stations.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedStation === st
                    ? "bg-[#2563eb] text-white shadow-md"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeKdsOrders.map((order) => {
            const isOverdue = order.overdue || false;

            return (
              <div
                key={order.id}
                className={`rounded-xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                  isOverdue
                    ? "border-red-500 bg-[#1f1618] ring-2 ring-red-500/40"
                    : "border-white/15 bg-[#14243b]"
                }`}
              >
                {/* Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isOverdue ? "bg-red-950/60 border-red-500/50" : "bg-white/5 border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">#{order.order_number}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold">
                        Table {order.table_number}
                      </span>
                    </div>
                    <span className="text-xs text-white/70">{order.customer_name}</span>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold flex items-center gap-1 justify-end ${
                        isOverdue ? "text-red-400 animate-pulse" : "text-amber-400"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isOverdue ? "16m (OVERDUE)" : "11m elapsed"}</span>
                    </div>
                    <span className="text-[10px] text-white/50">{timeAgo(order.placed_at)}</span>
                  </div>
                </div>

                {/* Station Tag & Allergies */}
                <div className="px-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Station: <strong>{order.kitchen_station || "Hot Line 1"}</strong></span>
                  </div>
                  {order.special_instructions && (
                    <div className="mt-1.5 p-1.5 rounded bg-red-950/70 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>{order.special_instructions}</span>
                    </div>
                  )}
                </div>

                {/* Food Items Checklist */}
                <div className="p-3 space-y-2 flex-1">
                  {order.items.map((it) => {
                    const isChecked = !!completedItems[it.id];

                    return (
                      <div
                        key={it.id}
                        onClick={() => toggleItemCheck(it.id)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 line-through opacity-70"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? "bg-emerald-500 border-emerald-400 text-black" : "border-white/40"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-semibold">
                            {it.quantity}x {it.item_name}
                          </span>
                        </div>
                        {it.kitchen_notes && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-600/40">
                            {it.kitchen_notes}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Expediter Bump Actions */}
                <div className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, "READY")}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>BUMP & MARK READY</span>
                  </button>
                </div>
              </div>
            );
          })}

          {activeKdsOrders.length === 0 && (
            <div className="col-span-full py-24 text-center text-white/50">
              <ChefHat className="w-12 h-12 mx-auto mb-2 text-white/20" />
              <p className="font-bold text-base text-white/80">All kitchen tickets cleared!</p>
              <p className="text-xs text-white/50 mt-1">New QR orders will appear here immediately with chime.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
