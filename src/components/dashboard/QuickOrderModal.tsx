"use client";

import React, { useState } from "react";
import { X, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { MenuItem } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({ isOpen, onClose }) => {
  const { state, placeOrder } = useAppStore();
  const [selectedTableId, setSelectedTableId] = useState(state.tables[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<{ [id: string]: number }>({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, delta: number) => {
    const current = orderItems[itemId] || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      const copy = { ...orderItems };
      delete copy[itemId];
      setOrderItems(copy);
    } else {
      setOrderItems({ ...orderItems, [itemId]: next });
    }
  };

  const selectedDishes = Object.entries(orderItems)
    .map(([id, qty]) => {
      const dish = state.menuItems.find((d) => d.id === id);
      if (!dish) return null;
      return {
        menuItemId: dish.id,
        name: dish.name,
        unitPrice: dish.price,
        quantity: qty,
        totalPrice: dish.price * qty,
      };
    })
    .filter(Boolean) as {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];

  const subtotal = selectedDishes.reduce((sum, d) => sum + d.totalPrice, 0);
  const total = subtotal * (1 + state.restaurant.tax_rate / 100);

  const handleSubmit = () => {
    if (selectedDishes.length === 0) return;
    const table = state.tables.find((t) => t.id === selectedTableId) || state.tables[0];

    placeOrder({
      restaurantId: state.restaurant.id,
      branchId: state.activeBranchId,
      tableId: table.id,
      tableNumber: table.table_number,
      customerName: customerName.trim() || `Walk-in Table ${table.table_number}`,
      items: selectedDishes,
      specialInstructions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none">
      <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#c3c6d7]/60 flex items-center justify-between bg-[#0b1c30] text-white">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">New Quick Dine-In Order</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#0b1c30] block mb-1">Select Table</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c3c6d7] text-xs font-semibold bg-[#f8f9ff]"
              >
                {state.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.table_number} ({t.capacity} Seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-[#0b1c30] block mb-1">Customer / Guest Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Guest"
                className="w-full p-2 rounded-lg border border-[#c3c6d7] text-xs bg-[#f8f9ff]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#0b1c30] block mb-2">Select Food Items</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {state.menuItems.map((item) => {
                const qty = orderItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-[#c3c6d7]/50 bg-[#f8f9ff] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#0b1c30] leading-tight">{item.name}</div>
                      <div className="text-[11px] text-[#004ac6] font-semibold">
                        {formatCurrency(item.price, "USD", "$")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => handleQtyChange(item.id, -1)}
                            className="w-5 h-5 rounded-full bg-white border border-[#c3c6d7] flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3 text-[#0b1c30]" />
                          </button>
                          <span className="font-bold text-xs min-w-[12px] text-center">{qty}</span>
                        </>
                      )}
                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="w-5 h-5 rounded-full bg-[#004ac6] text-white flex items-center justify-center hover:bg-blue-700 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-[#0b1c30] block mb-1">Kitchen Special Notes</label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Mild spice, allergy alert..."
              className="w-full p-2 rounded-lg border border-[#c3c6d7] text-xs bg-[#f8f9ff]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[#c3c6d7]/40 bg-[#f8f9ff] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#434655]">Total Order Value</span>
            <div className="font-extrabold text-base text-[#004ac6]">
              {formatCurrency(total, "USD", "$")}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedDishes.length === 0}
            className="px-5 py-2.5 bg-[#004ac6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md active:scale-95 transition-all"
          >
            Dispatch Order to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
};
