"use client";

import React from "react";
import { X, CheckCircle, Clock, ChefHat, Bell, Receipt, CheckCircle2 } from "lucide-react";
import { Order, OrderStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LiveTrackingSheetProps {
  order: Order | null;
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onCallWaiter: () => void;
  onRequestBill: () => void;
}

const STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "PENDING", label: "Order Placed", desc: "Received by restaurant systems" },
  { key: "ACCEPTED", label: "Order Accepted", desc: "Front desk acknowledged" },
  { key: "PREPARING", label: "Preparing (KDS)", desc: "Cooks on line actively preparing" },
  { key: "READY", label: "Ready at Pass", desc: "Plated and awaiting table runner" },
  { key: "SERVED", label: "Served to Table", desc: "Enjoy your fresh meal" },
  { key: "COMPLETED", label: "Completed", desc: "Counter payment settled" },
];

export const LiveTrackingSheet: React.FC<LiveTrackingSheetProps> = ({
  order,
  isOpen,
  currencySymbol = "$",
  onClose,
  onCallWaiter,
  onRequestBill,
}) => {
  if (!isOpen || !order) return null;

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return 0;
      case "ACCEPTED": return 1;
      case "PREPARING": return 2;
      case "READY": return 3;
      case "SERVED": return 4;
      case "COMPLETED": return 5;
      case "CANCELLED": return -1;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(order.order_status);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#ffffff] w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#e2bfb2]/50 flex items-center justify-between bg-[#fff8f5] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#1e1b19]">
                Live Order #{order.order_number}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf2ee] text-[#a33900] border border-[#e2bfb2]">
                Table {order.table_number}
              </span>
            </div>
            <p className="text-xs text-[#5a4138] mt-0.5">
              Placed at {formatDate(order.placed_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4ece8] flex items-center justify-center text-[#1e1b19] hover:bg-[#e9e1dd]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Progress Tracking */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Status Stepper */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2bfb2]">
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isPast
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-[#a33900] text-white ring-4 ring-[#ffdbce]"
                        : "bg-[#e2bfb2] text-white"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-[#a33900]"
                            : isPast
                            ? "text-emerald-700"
                            : "text-[#8e7166]"
                        }`}
                      >
                        {stage.label}
                      </span>
                      {isCurrent && (
                        <span className="animate-pulse bg-[#ffdbce] text-[#a33900] text-[9px] font-bold px-1.5 py-0.5 rounded">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5a4138] mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Itemized Order Summary */}
          <div className="p-3.5 rounded-xl bg-[#fff8f5] border border-[#e2bfb2]/60 space-y-2 text-xs">
            <h4 className="font-bold text-[#1e1b19] border-b border-[#e2bfb2]/30 pb-1.5">
              Ordered Items
            </h4>
            <div className="space-y-1.5 text-[#5a4138]">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold">{it.quantity}x {it.item_name}</span>
                    {it.kitchen_notes && (
                      <div className="text-[10px] text-amber-700">Note: {it.kitchen_notes}</div>
                    )}
                  </div>
                  <span className="font-bold text-[#1e1b19]">
                    {formatCurrency(it.total_price, "USD", currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#e2bfb2]/40 flex justify-between font-extrabold text-sm text-[#1e1b19]">
              <span>Total Bill</span>
              <span className="text-[#a33900]">
                {formatCurrency(order.total_amount, "USD", currencySymbol)}
              </span>
            </div>
          </div>

          {/* Payment Status Notice */}
          <div className="p-3 rounded-xl bg-[#faf2ee] border border-[#e2bfb2]/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5a4138]">Payment Status</span>
              <div className="font-bold text-[#ac3400] text-sm">
                {order.payment_status === "PAID" ? "SETTLED AT COUNTER" : "UNPAID (Pay at Counter)"}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffdbd0] text-[#a33900]">
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 border-t border-[#e2bfb2]/50 bg-[#fff8f5] grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={onCallWaiter}
            className="py-2.5 px-3 bg-[#f4ece8] hover:bg-[#eee7e3] active:scale-95 transition-all text-[#a33900] font-bold text-xs rounded-full flex items-center justify-center gap-1.5 border border-[#e2bfb2]"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Call Waiter</span>
          </button>
          <button
            onClick={onRequestBill}
            className="py-2.5 px-3 bg-[#a33900] hover:bg-[#cc4900] active:scale-95 transition-all text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Request Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
