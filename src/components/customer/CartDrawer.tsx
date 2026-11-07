"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Trash2, CircleDollarSign, ArrowRight, User, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  variant?: string;
  addons?: string[];
  notes?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  tableNumber: string;
  taxRate: number;
  currencySymbol?: string;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    specialInstructions: string;
  }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  tableNumber,
  taxRate,
  currencySymbol = "$",
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmOrder,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    onConfirmOrder({
      customerName: customerName.trim() || `Table ${tableNumber} Guest`,
      customerPhone: customerPhone.trim(),
      specialInstructions: generalInstructions.trim(),
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#ffffff] w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#e2bfb2]/50 flex items-center justify-between bg-[#fff8f5] shrink-0">
          <div>
            <h2 className="font-bold text-base text-[#1e1b19]">Your Cart</h2>
            <span className="text-xs text-[#5a4138]">Table {tableNumber} • Dine-In</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4ece8] flex items-center justify-center text-[#1e1b19] hover:bg-[#e9e1dd]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="py-12 text-center text-[#5a4138]">
              <p className="font-semibold text-sm">Your cart is empty</p>
              <p className="text-xs mt-1 text-[#8e7166]">Select delicious dishes from the menu to start ordering.</p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[#e2bfb2]/60 bg-[#fff8f5] flex items-start justify-between gap-2"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-[#1e1b19]">{item.name}</h4>
                      {item.variant && (
                        <div className="text-[11px] text-[#ac3400] font-semibold mt-0.5">
                          Portion: {item.variant}
                        </div>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-[10px] text-[#5a4138] mt-0.5">
                          + {item.addons.join(", ")}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                          Note: {item.notes}
                        </div>
                      )}
                      <div className="font-extrabold text-xs text-[#a33900] mt-1">
                        {formatCurrency(item.totalPrice, "USD", currencySymbol)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-[#e2bfb2] px-2 py-1 rounded-full shadow-sm">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            onUpdateQuantity(item.id, item.quantity - 1);
                          } else {
                            onRemoveItem(item.id);
                          }
                        }}
                        className="w-5 h-5 flex items-center justify-center text-[#a33900] hover:bg-[#faf2ee] rounded-full active:scale-90"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-600" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="font-bold text-xs min-w-[14px] text-center text-[#1e1b19]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#a33900] hover:bg-[#faf2ee] rounded-full active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Info Form */}
              <div className="pt-2 border-t border-[#e2bfb2]/40 space-y-2.5">
                <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                  Guest Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7166]" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Name (Optional)"
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#e2bfb2] focus:outline-none focus:ring-2 focus:ring-[#a33900] text-[#1e1b19]"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7166]" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone (For order SMS)"
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#e2bfb2] focus:outline-none focus:ring-2 focus:ring-[#a33900] text-[#1e1b19]"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={generalInstructions}
                    onChange={(e) => setGeneralInstructions(e.target.value)}
                    placeholder="General order instructions for kitchen..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#e2bfb2] focus:outline-none focus:ring-2 focus:ring-[#a33900] text-[#1e1b19]"
                  />
                </div>
              </div>

              {/* CRITICAL PAYMENT BANNER (Prominent) */}
              <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CircleDollarSign className="w-4 h-4 text-amber-800" />
                  <span>PAYMENT AT COUNTER ONLY</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your order will be sent directly to the restaurant kitchen. Please pay at the restaurant counter after dining (Cash, UPI or Card accepted).
                </p>
              </div>

              {/* Bill Breakdown */}
              <div className="p-3 rounded-xl bg-[#faf2ee] border border-[#e2bfb2]/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5a4138]">
                  <span>Item Subtotal</span>
                  <span>{formatCurrency(subtotal, "USD", currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[#5a4138]">
                  <span>Taxes & Service ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, "USD", currencySymbol)}</span>
                </div>
                <div className="pt-2 border-t border-[#e2bfb2]/40 flex justify-between font-extrabold text-sm text-[#1e1b19]">
                  <span>Total Payable</span>
                  <span className="text-[#a33900]">{formatCurrency(grandTotal, "USD", currencySymbol)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#e2bfb2]/50 bg-[#fff8f5] shrink-0">
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-3.5 px-4 bg-[#a33900] hover:bg-[#cc4900] active:scale-[0.98] transition-all text-white font-bold text-sm rounded-full flex items-center justify-between shadow-lg disabled:opacity-50"
            >
              <span>Confirm Order (Pay at Counter)</span>
              <div className="flex items-center gap-1">
                <span>{formatCurrency(grandTotal, "USD", currencySymbol)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
