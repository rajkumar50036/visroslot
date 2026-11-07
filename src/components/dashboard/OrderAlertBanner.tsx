"use client";

import React, { useEffect } from "react";
import { CheckCircle, Bell, Code, Volume2 } from "lucide-react";
import { Order } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface OrderAlertBannerProps {
  order: Order | null;
  onAcknowledge: (orderId?: string) => void;
  onInspectPayload: (order: Order) => void;
}

export const OrderAlertBanner: React.FC<OrderAlertBannerProps> = ({
  order,
  onAcknowledge,
  onInspectPayload,
}) => {
  // Listen for F2 key to acknowledge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && order) {
        e.preventDefault();
        onAcknowledge(order.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [order, onAcknowledge]);

  if (!order) return null;

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#0b1c30] text-white p-4 border-2 border-[#2563eb] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 select-none font-sans animate-in slide-in-from-top-4 duration-300">
      {/* Visual Accent Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#2563eb]/25 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-4 z-10 w-full md:w-auto">
        {/* Equalizer Audio Waves Indicator */}
        <div className="w-12 h-12 rounded-xl bg-[#004ac6] flex items-center justify-center gap-1 px-2 shrink-0 shadow-md">
          <div className="w-1 bg-white rounded-full h-2 animate-[pulse_1s_ease-in-out_infinite_0.1s]"></div>
          <div className="w-1 bg-white rounded-full h-6 animate-[pulse_1s_ease-in-out_infinite_0.25s]"></div>
          <div className="w-1 bg-white rounded-full h-8 animate-[pulse_1s_ease-in-out_infinite_0.4s]"></div>
          <div className="w-1 bg-white rounded-full h-5 animate-[pulse_1s_ease-in-out_infinite_0.15s]"></div>
          <div className="w-1 bg-white rounded-full h-3 animate-[pulse_1s_ease-in-out_infinite_0.3s]"></div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ba1a1a] text-white text-[10px] uppercase font-bold tracking-wider animate-pulse flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              <span>Loud Chime Playing</span>
            </span>
            <span className="text-[#cbdbf5]/70 text-xs">
              Incoming WebSocket Event • Just now
            </span>
          </div>

          <h2 className="text-base font-bold text-white flex flex-wrap items-center gap-2 mt-1">
            <span>🔔 NEW ORDER #{order.order_number} RECEIVED (Table {order.table_number})</span>
            <span className="text-[#b4c5ff] text-sm font-semibold">
              • {order.items.reduce((s, i) => s + i.quantity, 0)} Items ({formatCurrency(order.total_amount, "USD", "$")})
            </span>
          </h2>
        </div>
      </div>

      {/* Banner Actions */}
      <div className="flex items-center gap-2 z-10 w-full md:w-auto justify-end">
        <button
          onClick={() => onInspectPayload(order)}
          className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#cbdbf5] hover:text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Inspect Payload</span>
        </button>

        <button
          onClick={() => onAcknowledge(order.id)}
          className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-[#004ac6] text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 ring-2 ring-[#2563eb]/50"
        >
          <CheckCircle className="w-4 h-4" />
          <span>ACKNOWLEDGE & ACCEPT (F2)</span>
        </button>
      </div>
    </section>
  );
};
