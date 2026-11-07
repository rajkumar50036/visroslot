"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useAppStore } from "@/lib/store/app-store";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  Search,
  History,
  FileCheck2
} from "lucide-react";
import { Order, PaymentMethod } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CashierPage() {
  const { state, collectCashierPayment } = useAppStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [cashierNotes, setCashierNotes] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);

  const unpaidOrders = state.orders.filter(
    (o) => o.payment_status === "UNPAID" && o.order_status !== "CANCELLED" &&
    (o.order_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
     o.table_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
     o.customer_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setReceivedAmount(order.total_amount.toFixed(2));
    setRecentReceipt(null);
  };

  const handleCompleteCollection = () => {
    if (!selectedOrder) return;
    try {
      const collection = collectCashierPayment(selectedOrder.id, paymentMethod, "Alex Vance (Shift Lead)");
      setRecentReceipt({
        ...collection,
        order: selectedOrder,
        tendered: parseFloat(receivedAmount) || selectedOrder.total_amount,
        change: Math.max(0, (parseFloat(receivedAmount) || selectedOrder.total_amount) - selectedOrder.total_amount),
      });
      setSelectedOrder(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased overflow-hidden font-sans select-none">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#f8f9ff]">
        <TopNav searchQuery="" onSearchChange={() => {}} />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#c3c6d7]/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                  <CreditCard className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-extrabold text-[#0b1c30]">
                  Counter Cashier Terminal (Register #01)
                </h1>
              </div>
              <p className="text-xs text-[#434655] mt-1">
                Zero Online Gateway Policy: Physical payments collected exclusively at the counter desk.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#434655]">Total Unpaid Queue</span>
                <div className="text-xl font-extrabold text-[#ba1a1a]">
                  {formatCurrency(
                    unpaidOrders.reduce((s, o) => s + o.total_amount, 0),
                    "USD",
                    "$"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Unpaid Queue & Terminal Settle Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Unpaid Bills Queue (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c6d7]/40 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Pending Counter Bills</h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    {unpaidOrders.length} Awaiting Collection
                  </span>
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737686]" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search table, order..."
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-[#f8f9ff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6]"
                  />
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[480px]">
                {unpaidOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#004ac6] bg-[#eff4ff] ring-2 ring-[#004ac6]/30 shadow-md"
                          : "border-[#c3c6d7]/60 hover:bg-[#f8f9ff]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#0b1c30]">#{order.order_number}</span>
                          <span className="px-2 py-0.5 rounded bg-[#004ac6] text-white text-[11px] font-bold">
                            Table {order.table_number}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                            {order.order_status}
                          </span>
                        </div>
                        <div className="text-xs text-[#434655] mt-1">
                          Guest: <strong>{order.customer_name}</strong> • {order.items.length} dishes
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-[#0b1c30]">
                          {formatCurrency(order.total_amount, "USD", "$")}
                        </div>
                        <button
                          className={`mt-1 px-3 py-1 rounded text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-[#004ac6] text-white shadow"
                              : "bg-[#e5eeff] text-[#004ac6] hover:bg-[#004ac6] hover:text-white"
                          }`}
                        >
                          {isSelected ? "Selected" : "Collect"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {unpaidOrders.length === 0 && (
                  <div className="py-16 text-center text-[#737686]">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-sm">All counter payments collected!</p>
                    <p className="text-xs text-[#737686] mt-0.5">No pending tables in the unpaid register.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Settle & Tender Panel (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Payment Processing Card */}
              <div className="bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#0b1c30] pb-2 border-b border-[#c3c6d7]/40">
                    Payment Tender Verification
                  </h3>

                  {selectedOrder ? (
                    <div className="space-y-3.5 pt-3">
                      <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7]/40">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#434655]">Order & Table</span>
                          <span className="font-bold text-[#0b1c30]">
                            #{selectedOrder.order_number} (Table {selectedOrder.table_number})
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-[#434655]">Customer</span>
                          <span className="font-bold text-[#0b1c30]">{selectedOrder.customer_name}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-[#c3c6d7]/30 flex justify-between items-center">
                          <span className="font-bold text-xs text-[#0b1c30]">Total Bill Amount</span>
                          <span className="font-extrabold text-lg text-[#004ac6]">
                            {formatCurrency(selectedOrder.total_amount, "USD", "$")}
                          </span>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="text-xs font-bold text-[#0b1c30] block mb-1.5">
                          Select Tender Method Received
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setPaymentMethod("CASH")}
                            className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                              paymentMethod === "CASH"
                                ? "bg-[#004ac6] text-white border-[#004ac6] shadow-md"
                                : "bg-[#f8f9ff] border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                            }`}
                          >
                            <Banknote className="w-4 h-4" />
                            <span>Cash Tender</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod("UPI")}
                            className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                              paymentMethod === "UPI"
                                ? "bg-[#004ac6] text-white border-[#004ac6] shadow-md"
                                : "bg-[#f8f9ff] border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Counter UPI</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod("CARD")}
                            className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                              paymentMethod === "CARD"
                                ? "bg-[#004ac6] text-white border-[#004ac6] shadow-md"
                                : "bg-[#f8f9ff] border-[#c3c6d7] text-[#0b1c30] hover:border-[#004ac6]"
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>POS Card Tap</span>
                          </button>
                        </div>
                      </div>

                      {/* Tendered Amount (for Cash change calculation) */}
                      {paymentMethod === "CASH" && (
                        <div>
                          <label className="text-xs font-bold text-[#0b1c30] block mb-1">
                            Cash Handed by Customer ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            className="w-full p-2 text-sm font-bold bg-[#f8f9ff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6]"
                          />
                          {parseFloat(receivedAmount) > selectedOrder.total_amount && (
                            <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-bold flex justify-between">
                              <span>Change Return to Diner:</span>
                              <span>
                                {formatCurrency(
                                  parseFloat(receivedAmount) - selectedOrder.total_amount,
                                  "USD",
                                  "$"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      <button
                        onClick={handleCompleteCollection}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Receipt & Mark Paid</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[#737686] text-xs">
                      Select an unpaid order from the left list to record counter payment.
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Printable Receipt Preview */}
              {recentReceipt && (
                <div className="bg-white rounded-xl border border-emerald-300 shadow-md p-4 text-xs space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="font-extrabold text-[#004ac6]">OFFICIAL TAX INVOICE</span>
                    <button
                      onClick={handlePrint}
                      className="px-2.5 py-1 bg-[#004ac6] text-white rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                  <div className="text-[#434655] space-y-0.5">
                    <div>Receipt: <strong>{recentReceipt.receipt_number}</strong></div>
                    <div>Table: <strong>Table {recentReceipt.table_number}</strong></div>
                    <div>Payment Method: <strong>{recentReceipt.payment_method}</strong></div>
                    <div>Cashier: <strong>{recentReceipt.collected_by}</strong></div>
                    <div>Settled at: {formatDate(recentReceipt.collected_at)}</div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-extrabold text-sm text-[#0b1c30]">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(recentReceipt.amount, "USD", "$")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Recent Cashier Collections Log */}
          <div className="bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#c3c6d7]/40 mb-3 text-sm font-bold text-[#0b1c30]">
              <History className="w-4 h-4 text-[#004ac6]" />
              <span>Recent Shift Counter Collections Audit Log</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8f9ff] text-[#434655] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Receipt #</th>
                    <th className="p-2.5">Order #</th>
                    <th className="p-2.5">Table</th>
                    <th className="p-2.5">Tender Method</th>
                    <th className="p-2.5">Collected By</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c3c6d7]/20">
                  {state.collections.map((col) => (
                    <tr key={col.id} className="hover:bg-[#f8f9ff]">
                      <td className="p-2.5 font-mono font-bold text-[#004ac6]">{col.receipt_number}</td>
                      <td className="p-2.5 font-semibold text-[#0b1c30]">#{col.order_number}</td>
                      <td className="p-2.5">Table {col.table_number}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#eff4ff] text-[#004ac6]">
                          {col.payment_method}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#434655]">{col.collected_by}</td>
                      <td className="p-2.5 text-[#737686]">{formatDate(col.collected_at)}</td>
                      <td className="p-2.5 text-right font-extrabold text-[#0b1c30]">
                        {formatCurrency(col.amount, "USD", "$")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
