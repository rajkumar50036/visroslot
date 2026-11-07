"use client";

import React, { useState } from "react";
import { 
  X, 
  Terminal, 
  Printer, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2 
} from "lucide-react";
import { Order, PaymentMethod } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface RealtimeDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment: (orderId: string, method: PaymentMethod) => void;
}

export const RealtimeDrawer: React.FC<RealtimeDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onCollectPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleSettle = () => {
    onCollectPayment(order.id, selectedMethod);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <section className="bg-white rounded-xl border border-[#c3c6d7]/60 p-5 shadow-sm font-sans select-none animate-in fade-in duration-200">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#c3c6d7]/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#dbe1ff] text-[#004ac6]">
              <Terminal className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-[#0b1c30]">
              Realtime Table Inspector & Cashier Pass
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
              Active Session: Table {order.table_number}
            </span>
          </div>
          <p className="text-xs text-[#434655] mt-1">
            Zero-gateway operational verification: Table QR generated tokens synced with Supabase Realtime broadcast channel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintSlip}
            className="px-3.5 py-2 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Thermal Slip</span>
          </button>
          <button
            onClick={handlePrintSlip}
            className="px-3.5 py-2 rounded-lg bg-[#2563eb] text-white text-xs font-bold shadow-sm hover:bg-[#004ac6] transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Print Tax Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] hover:bg-gray-100 flex items-center justify-center text-[#434655]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Payload Json Preview */}
        <div className="p-3 rounded-lg bg-[#0b1c30] text-[#cbdbf5] font-mono text-[11px] leading-relaxed overflow-x-auto border border-white/10 flex flex-col justify-between">
          <div>
            <div className="text-white font-bold text-xs pb-1 mb-1.5 border-b border-white/10 flex justify-between">
              <span>REALTIME PAYLOAD (table_{order.table_number})</span>
              <span className="text-emerald-400">STATUS: 200 OK</span>
            </div>
            <pre className="text-emerald-300">
{JSON.stringify({
  event: "ORDER_SUBMITTED",
  order_number: order.order_number,
  table_number: order.table_number,
  session_uuid: order.id,
  payment_flow: "OFFLINE_COUNTER_SETTLEMENT",
  total_cents: Math.round(order.total_amount * 100),
  items_count: order.items.length,
  requires_kitchen_ack: order.order_status === "PENDING"
}, null, 2)}
            </pre>
          </div>
          <div className="text-[10px] text-white/40 pt-2 border-t border-white/10">
            Tenant: Bistro Grande • Supabase Channel Dining
          </div>
        </div>

        {/* Table Order Itemized Breakdown */}
        <div className="p-3.5 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7]/40 flex flex-col justify-between text-xs">
          <div>
            <span className="font-bold text-xs text-[#0b1c30] pb-1.5 border-b border-[#c3c6d7]/30 block">
              Table {order.table_number} Itemized Breakdown
            </span>

            <div className="flex flex-col gap-1.5 py-2.5 max-h-40 overflow-y-auto">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span className="text-[#0b1c30]">
                    {it.quantity}x {it.item_name} {it.selected_variant ? `(${it.selected_variant})` : ""}
                  </span>
                  <span className="font-semibold text-[#434655]">
                    {formatCurrency(it.total_price, "USD", "$")}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#c3c6d7]/30 flex justify-between text-xs text-[#434655]">
              <span>Subtotal: {formatCurrency(order.subtotal, "USD", "$")} | Tax: {formatCurrency(order.tax_amount, "USD", "$")}</span>
              <span className="font-bold text-[#0b1c30]">Total: {formatCurrency(order.total_amount, "USD", "$")}</span>
            </div>
          </div>

          <div className="text-[10px] text-[#737686] italic mt-2">
            Verification: Physical table QR code confirmed via diner browser location check.
          </div>
        </div>

        {/* Cashier Terminal Settle Box */}
        <div className="p-3.5 rounded-lg bg-[#e5eeff] border border-[#004ac6]/30 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0b1c30]">
                Quick Settle (Counter Cashier)
              </span>
              <span className="px-2 py-0.5 rounded bg-[#004ac6] text-white font-bold text-xs">
                {formatCurrency(order.total_amount, "USD", "$")} Due
              </span>
            </div>
            <p className="text-[11px] text-[#434655] mt-1">
              Select method to complete table release:
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => setSelectedMethod("CASH")}
                className={`py-2 px-1 rounded border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === "CASH"
                    ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm"
                    : "bg-white border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash Tender</span>
              </button>

              <button
                onClick={() => setSelectedMethod("CARD")}
                className={`py-2 px-1 rounded border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === "CARD"
                    ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm"
                    : "bg-white border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>POS Card Tap</span>
              </button>

              <button
                onClick={() => setSelectedMethod("UPI")}
                className={`py-2 px-1 rounded border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  selectedMethod === "UPI"
                    ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm"
                    : "bg-white border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Counter UPI</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleSettle}
            disabled={isSuccess || order.payment_status === "PAID"}
            className="mt-3 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Payment Recorded! Vacating Table {order.table_number}...</span>
              </>
            ) : order.payment_status === "PAID" ? (
              <span>Already Settled</span>
            ) : (
              <span>Confirm Receipt & Vacate Table {order.table_number}</span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
