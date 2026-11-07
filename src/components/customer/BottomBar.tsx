"use client";

import React from "react";
import { ShoppingBag, ArrowRight, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types/database";

interface BottomBarProps {
  cartItemCount: number;
  cartTotal: number;
  currencySymbol?: string;
  activeOrder: Order | null;
  onOpenCart: () => void;
  onOpenTracking: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  cartItemCount,
  cartTotal,
  currencySymbol = "$",
  activeOrder,
  onOpenCart,
  onOpenTracking,
}) => {
  if (cartItemCount === 0 && !activeOrder) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none flex flex-col items-center gap-2 max-w-lg mx-auto">
      {/* Live Order Tracker Pill (if active order exists) */}
      {activeOrder && activeOrder.order_status !== "COMPLETED" && (
        <button
          onClick={onOpenTracking}
          className="pointer-events-auto bg-[#1e1b19] text-white px-4 py-2 rounded-full shadow-lg border border-[#e2bfb2]/30 flex items-center gap-2.5 text-xs font-semibold hover:bg-black transition-all active:scale-95 animate-in slide-in-from-bottom duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 relative">
            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"></span>
          </span>
          <span>Order #{activeOrder.order_number}: <strong>{activeOrder.order_status}</strong></span>
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      )}

      {/* Cart Summary Bar */}
      {cartItemCount > 0 && (
        <div className="pointer-events-auto w-full bg-[#a33900] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">
                {cartItemCount} {cartItemCount === 1 ? "Item" : "Items"} Added
              </div>
              <div className="text-sm font-extrabold text-white/95">
                {formatCurrency(cartTotal, "USD", currencySymbol)}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="bg-white text-[#a33900] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
