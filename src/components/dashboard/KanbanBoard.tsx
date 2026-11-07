"use client";

import React from "react";
import { 
  Send, 
  CheckCheck, 
  Utensils, 
  CreditCard, 
  AlertTriangle, 
  Flame, 
  Info,
  Clock
} from "lucide-react";
import { Order, OrderStatus } from "@/types/database";
import { formatCurrency, timeAgo } from "@/lib/utils";

interface KanbanBoardProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenCashierSettle: (order: Order) => void;
  onRejectOrder: (orderId: string) => void;
  onInspectOrder: (order: Order) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  onUpdateStatus,
  onOpenCashierSettle,
  onRejectOrder,
  onInspectOrder,
}) => {
  const pendingOrders = orders.filter((o) => o.order_status === "PENDING");
  const preparingOrders = orders.filter((o) => o.order_status === "PREPARING" || o.order_status === "ACCEPTED");
  const readyOrders = orders.filter((o) => o.order_status === "READY");
  const awaitingPaymentOrders = orders.filter(
    (o) => (o.order_status === "SERVED" || o.order_status === "COMPLETED") && o.payment_status === "UNPAID"
  );

  return (
    <section className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[580px] font-sans select-none">
      {/* ========================================= */}
      {/* COLUMN 1: NEW / PENDING                   */}
      {/* ========================================= */}
      <div className="flex flex-col bg-[#eff4ff]/60 rounded-xl border border-[#c3c6d7]/60 overflow-hidden shadow-sm">
        <div className="p-3 bg-white border-b border-[#c3c6d7]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="font-bold text-sm text-[#0b1c30]">NEW / PENDING</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
            {pendingOrders.length} Orders
          </span>
        </div>

        <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
          {pendingOrders.map((order) => {
            const hasKitchenNote = order.special_instructions || order.items.some((i) => i.kitchen_notes);

            return (
              <article
                key={order.id}
                className="p-3.5 rounded-xl bg-white border-2 border-red-500 shadow-sm flex flex-col gap-2.5 relative transition-all hover:shadow-md cursor-pointer"
                onClick={() => onInspectOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0b1c30]">#{order.order_number}</span>
                      <span className="px-2 py-0.5 rounded bg-[#004ac6] text-white text-[11px] font-bold">
                        Table {order.table_number}
                      </span>
                    </div>
                    <span className="text-xs text-[#434655]">Customer: {order.customer_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold animate-pulse">
                    {timeAgo(order.placed_at)}
                  </span>
                </div>

                {/* Item Breakdown */}
                <div className="py-2 border-y border-[#c3c6d7]/30 flex flex-col gap-1 text-xs">
                  {order.items.map((it) => (
                    <div key={it.id}>
                      <div className="flex justify-between">
                        <span className="text-[#0b1c30] font-medium">{it.quantity}x {it.item_name}</span>
                        <span className="font-semibold text-[#434655]">{formatCurrency(it.total_price, "USD", "$")}</span>
                      </div>
                      {it.kitchen_notes && (
                        <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[10px] font-bold flex items-center gap-1 my-1">
                          <Info className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>{it.kitchen_notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {order.special_instructions && (
                    <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[10px] font-bold flex items-center gap-1 mt-1">
                      <Info className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{order.special_instructions}</span>
                    </div>
                  )}
                </div>

                {/* Price & Payment Flag */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    UNPAID (Pay at Counter)
                  </span>
                  <span className="font-extrabold text-base text-[#0b1c30]">
                    {formatCurrency(order.total_amount, "USD", "$")}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateStatus(order.id, "PREPARING")}
                    className="col-span-2 py-2 rounded-lg bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to KDS</span>
                  </button>
                  <button
                    onClick={() => onRejectOrder(order.id)}
                    className="py-2 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-[#434655] text-xs font-semibold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}

          {pendingOrders.length === 0 && (
            <div className="p-8 text-center text-[#737686] text-xs">
              No new pending orders right now.
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* COLUMN 2: PREPARING (KDS)                 */}
      {/* ========================================= */}
      <div className="flex flex-col bg-[#eff4ff]/60 rounded-xl border border-[#c3c6d7]/60 overflow-hidden shadow-sm">
        <div className="p-3 bg-white border-b border-[#c3c6d7]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-bold text-sm text-[#0b1c30]">PREPARING (KDS)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
            {preparingOrders.length} Orders
          </span>
        </div>

        <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
          {preparingOrders.map((order) => {
            const isOverdue = order.overdue || false;

            return (
              <article
                key={order.id}
                className={`p-3.5 rounded-xl bg-white shadow-sm flex flex-col gap-2.5 relative transition-all hover:shadow-md cursor-pointer border ${
                  isOverdue ? "border-2 border-red-500" : "border-amber-300"
                }`}
                onClick={() => onInspectOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0b1c30]">#{order.order_number}</span>
                      <span className="px-2 py-0.5 rounded bg-[#004ac6] text-white text-[11px] font-bold">
                        Table {order.table_number}
                      </span>
                    </div>
                    <span className="text-xs text-[#434655]">Customer: {order.customer_name}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOverdue
                          ? "bg-red-100 text-red-700 animate-pulse"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {isOverdue ? "16m 10s OVERDUE" : "11m 40s"}
                    </span>
                    <div className="text-[10px] text-[#737686]">Target 15m</div>
                  </div>
                </div>

                {/* Station Tag */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#434655] bg-[#f8f9ff] px-2 py-1 rounded border border-[#c3c6d7]/30">
                  <Flame className="w-3.5 h-3.5 text-[#004ac6]" />
                  <span>Station: <strong>{order.kitchen_station || "Hot Line 1 & Grill"}</strong></span>
                </div>

                {/* Items */}
                <div className="py-2 border-y border-[#c3c6d7]/30 flex flex-col gap-1 text-xs">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span className="text-[#0b1c30]">{it.quantity}x {it.item_name}</span>
                      <span className="font-medium text-[#434655]">{formatCurrency(it.total_price, "USD", "$")}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  {isOverdue ? (
                    <span className="text-red-600 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      KDS Expediter Paged
                    </span>
                  ) : (
                    <span className="text-[#737686] text-[11px]">
                      Prepped items: {Math.max(1, order.items.length - 1)}/{order.items.length}
                    </span>
                  )}
                  <span className="font-bold text-sm text-[#0b1c30]">
                    {formatCurrency(order.total_amount, "USD", "$")}
                  </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateStatus(order.id, "READY")}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                      isOverdue
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-white border border-[#c3c6d7] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-[#0b1c30]"
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isOverdue ? "Mark Food Ready & Expedite" : "Mark Food Ready"}</span>
                  </button>
                </div>
              </article>
            );
          })}

          {preparingOrders.length === 0 && (
            <div className="p-8 text-center text-[#737686] text-xs">
              No orders cooking right now.
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* COLUMN 3: READY FOR SERVING               */}
      {/* ========================================= */}
      <div className="flex flex-col bg-[#eff4ff]/60 rounded-xl border border-[#c3c6d7]/60 overflow-hidden shadow-sm">
        <div className="p-3 bg-white border-b border-[#c3c6d7]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-sm text-[#0b1c30]">READY FOR SERVING</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            {readyOrders.length} Ready
          </span>
        </div>

        <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
          {readyOrders.map((order) => (
            <article
              key={order.id}
              className="p-3.5 rounded-xl bg-white border border-emerald-300 shadow-sm flex flex-col gap-2.5 relative transition-all hover:shadow-md cursor-pointer"
              onClick={() => onInspectOrder(order)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0b1c30]">#{order.order_number}</span>
                    <span className="px-2 py-0.5 rounded bg-[#004ac6] text-white text-[11px] font-bold">
                      Table {order.table_number}
                    </span>
                  </div>
                  <span className="text-xs text-[#434655]">
                    Server: {order.server_name || "David (Runner)"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Hot Pass (2m)
                </span>
              </div>

              {/* Items */}
              <div className="py-2 border-y border-[#c3c6d7]/30 flex flex-col gap-1 text-xs">
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span className="text-[#0b1c30]">{it.quantity}x {it.item_name}</span>
                    <span className="font-medium text-[#434655]">{formatCurrency(it.total_price, "USD", "$")}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold text-[11px]">
                  Plated at Pass #2
                </span>
                <span className="font-bold text-sm text-[#0b1c30]">
                  {formatCurrency(order.total_amount, "USD", "$")}
                </span>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onUpdateStatus(order.id, "SERVED")}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Mark Served to Table</span>
                </button>
              </div>
            </article>
          ))}

          {readyOrders.length === 0 && (
            <div className="p-8 text-center text-[#737686] text-xs">
              No orders waiting at the pass.
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* COLUMN 4: AWAITING PAYMENT (COUNTER)       */}
      {/* ========================================= */}
      <div className="flex flex-col bg-[#eff4ff]/60 rounded-xl border border-[#c3c6d7]/60 overflow-hidden shadow-sm">
        <div className="p-3 bg-white border-b border-[#c3c6d7]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#712ae2]"></span>
            <span className="font-bold text-sm text-[#0b1c30]">AWAITING PAYMENT</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#004ac6] text-[11px] font-bold">
            {awaitingPaymentOrders.length} Tables
          </span>
        </div>

        <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
          {awaitingPaymentOrders.map((order) => (
            <article
              key={order.id}
              className="p-3.5 rounded-xl bg-white border-2 border-[#c3c6d7] shadow-sm flex flex-col gap-2.5 relative transition-all hover:shadow-md cursor-pointer"
              onClick={() => onInspectOrder(order)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0b1c30]">#{order.order_number}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0b1c30] text-white text-[11px] font-bold">
                      Table {order.table_number}
                    </span>
                  </div>
                  <span className="text-xs text-[#434655]">Customer: {order.customer_name}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#eaddff] text-[#712ae2] text-[10px] font-bold">
                  Dining Complete
                </span>
              </div>

              {/* Counter Payment Notice */}
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-0.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-amber-800" />
                  Collect at Cashier Counter Only
                </span>
                <span className="text-[10px] text-amber-800">
                  Diner at register / table bill requested
                </span>
              </div>

              <div className="py-2 border-y border-[#c3c6d7]/30 flex justify-between items-baseline">
                <span className="text-xs text-[#434655]">Total Bill Payable</span>
                <span className="text-lg font-extrabold text-[#0b1c30]">
                  {formatCurrency(order.total_amount, "USD", "$")}
                </span>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenCashierSettle(order)}
                  className="w-full py-2.5 rounded-lg bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Collect Cash / UPI / Card</span>
                </button>
              </div>
            </article>
          ))}

          {awaitingPaymentOrders.length === 0 && (
            <div className="p-8 text-center text-[#737686] text-xs">
              All active dining tables are paid.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
