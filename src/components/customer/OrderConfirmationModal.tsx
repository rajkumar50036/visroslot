"use client";

import React from "react";
import { CheckCircle2, CircleDollarSign, ArrowRight, Utensils } from "lucide-react";
import { Order } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface OrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onTrackOrder: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  isOpen,
  currencySymbol = "$",
  onClose,
  onTrackOrder,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#ffffff] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-5 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-bold text-[#1e1b19]">Order Confirmed!</h3>
        <p className="text-xs text-[#5a4138] mt-1">
          Sent directly to the kitchen for preparation.
        </p>

        <div className="w-full my-4 p-3.5 rounded-xl bg-[#fff8f5] border border-[#e2bfb2]/60 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-[#e2bfb2]/40">
            <span className="font-bold text-[#a33900] text-sm">#{order.order_number}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f4ece8] font-bold text-[#1e1b19]">
              Table {order.table_number}
            </span>
          </div>

          <div className="space-y-1 text-[#5a4138] max-h-32 overflow-y-auto">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.quantity}x {it.item_name}</span>
                <span className="font-semibold">{formatCurrency(it.total_price, "USD", currencySymbol)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#e2bfb2]/40 flex justify-between font-bold text-sm text-[#1e1b19]">
            <span>Total Amount</span>
            <span className="text-[#a33900]">{formatCurrency(order.total_amount, "USD", currencySymbol)}</span>
          </div>
        </div>

        {/* Counter Payment Reminder */}
        <div className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-left text-xs mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4 text-amber-800 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>Payment at Counter Only:</strong> Please pay at the counter cashier after dining.
          </span>
        </div>

        <div className="w-full space-y-2">
          <button
            onClick={onTrackOrder}
            className="w-full py-2.5 bg-[#a33900] hover:bg-[#cc4900] active:scale-95 transition-all text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>Track Live Order Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-transparent text-[#5a4138] hover:text-[#1e1b19] text-xs font-semibold"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
