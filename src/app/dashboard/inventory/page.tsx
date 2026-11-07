"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useAppStore } from "@/lib/store/app-store";
import { Package, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const { state } = useAppStore();
  const [inventoryList, setInventoryList] = useState(state.inventory);

  const handleAdjustStock = (id: string, delta: number) => {
    setInventoryList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, current_stock: Math.max(0, item.current_stock + delta) }
          : item
      )
    );
  };

  return (
    <div className="flex h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased overflow-hidden font-sans select-none">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#f8f9ff]">
        <TopNav searchQuery="" onSearchChange={() => {}} />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#c3c6d7]/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                  <Package className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-extrabold text-[#0b1c30]">
                  Inventory & Ingredient Costing
                </h1>
              </div>
              <p className="text-xs text-[#434655] mt-1">
                Monitor ingredient consumption, unit costs, and re-order thresholds for accurate gross margin estimation.
              </p>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#c3c6d7]/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#0b1c30]">Raw Materials & Stock Levels</h3>
              <span className="text-xs text-[#434655]">
                {inventoryList.filter((i) => i.current_stock <= i.minimum_stock).length} Low Stock Alerts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8f9ff] text-[#434655] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Ingredient Name</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Min Threshold</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Quick Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c3c6d7]/20">
                  {inventoryList.map((item) => {
                    const isLow = item.current_stock <= item.minimum_stock;

                    return (
                      <tr key={item.id} className="hover:bg-[#f8f9ff]">
                        <td className="p-3 font-bold text-[#0b1c30]">{item.name}</td>
                        <td className="p-3 text-[#004ac6] font-semibold">
                          {formatCurrency(item.unit_cost, "USD", "$")}/{item.unit}
                        </td>
                        <td className="p-3 font-extrabold text-sm text-[#0b1c30]">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="p-3 text-[#737686]">
                          {item.minimum_stock} {item.unit}
                        </td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Low Stock Reorder
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 w-max inline-block">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(item.id, -1)}
                              className="px-2 py-1 bg-[#f8f9ff] hover:bg-red-50 text-red-600 border border-[#c3c6d7] rounded font-bold text-xs"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, 5)}
                              className="px-2.5 py-1 bg-[#e5eeff] hover:bg-[#dce9ff] text-[#004ac6] border border-[#c3c6d7] rounded font-bold text-xs"
                            >
                              +5 {item.unit}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
