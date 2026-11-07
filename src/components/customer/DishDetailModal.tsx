"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Clock, Check } from "lucide-react";
import { MenuItem, ItemVariant, ItemAddon } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface DishDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onAddToCart: (customizedItem: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    variant?: string;
    addons?: string[];
    notes?: string;
  }) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  item,
  isOpen,
  currencySymbol = "$",
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ItemAddon[]>([]);
  const [specialNotes, setSpecialNotes] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
      setSelectedAddons([]);
      setSpecialNotes("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const basePrice = item.price + (selectedVariant ? selectedVariant.price_modifier : 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: ItemAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirm = () => {
    onAddToCart({
      menuItemId: item.id,
      name: item.name,
      unitPrice,
      quantity,
      totalPrice,
      variant: selectedVariant?.name,
      addons: selectedAddons.map((a) => a.name),
      notes: specialNotes.trim() ? specialNotes.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="bg-[#ffffff] w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header Image */}
        <div className="relative h-56 w-full bg-[#faf2ee] shrink-0">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{item.preparation_time_minutes} mins</span>
            </span>
            <span className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-[#1e1b19]">
              Station: {item.kitchen_station}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {item.is_veg ? (
                <div className="w-3.5 h-3.5 border border-[#006b2c] flex items-center justify-center rounded-[3px]">
                  <div className="w-1.5 h-1.5 bg-[#006b2c] rounded-full"></div>
                </div>
              ) : (
                <div className="w-3.5 h-3.5 border border-[#ba1a1a] flex items-center justify-center rounded-[3px]">
                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-[#ba1a1a]"></div>
                </div>
              )}
              <span className={`text-[11px] font-bold ${item.is_veg ? "text-[#006b2c]" : "text-[#ba1a1a]"}`}>
                {item.is_veg ? "VEGETARIAN" : "NON-VEGETARIAN"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1e1b19]">{item.name}</h2>
            <p className="text-xs text-[#5a4138] mt-1 leading-relaxed">{item.description}</p>
          </div>

          {/* Variants / Portion Size */}
          {item.variants && item.variants.length > 0 && (
            <div className="pt-3 border-t border-[#e2bfb2]/30">
              <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider mb-2">
                Choose Portion Size
              </h3>
              <div className="space-y-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs ${
                        isSelected
                          ? "border-[#a33900] bg-[#faf2ee] font-bold text-[#a33900]"
                          : "border-[#e2bfb2] hover:bg-[#fff8f5] text-[#1e1b19]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#a33900] bg-[#a33900]" : "border-[#8e7166]"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <span>{v.name}</span>
                      </div>
                      <span className="font-semibold">
                        {v.price_modifier === 0
                          ? "Included"
                          : `+${formatCurrency(v.price_modifier, "USD", currencySymbol)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div className="pt-3 border-t border-[#e2bfb2]/30">
              <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider mb-2">
                Popular Add-ons
              </h3>
              <div className="space-y-2">
                {item.addons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs ${
                        isChecked
                          ? "border-[#a33900] bg-[#faf2ee] font-bold text-[#a33900]"
                          : "border-[#e2bfb2] hover:bg-[#fff8f5] text-[#1e1b19]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? "border-[#a33900] bg-[#a33900] text-white" : "border-[#8e7166]"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="font-semibold">
                        +{formatCurrency(addon.price, "USD", currencySymbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Instructions */}
          <div className="pt-3 border-t border-[#e2bfb2]/30">
            <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider mb-1.5">
              Kitchen Instructions / Allergies
            </h3>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. NO GARLIC (Allergy), extra spicy, dressing on the side..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-[#e2bfb2] focus:outline-none focus:ring-2 focus:ring-[#a33900] text-[#1e1b19]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2bfb2]/50 bg-[#faf2ee] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-[#e2bfb2] px-2.5 py-1.5 rounded-full shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 flex items-center justify-center text-[#a33900] hover:bg-[#faf2ee] rounded-full active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xs min-w-[16px] text-center text-[#1e1b19]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-6 h-6 flex items-center justify-center text-[#a33900] hover:bg-[#faf2ee] rounded-full active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-[#a33900] hover:bg-[#cc4900] active:scale-[0.98] transition-all text-white font-bold text-xs rounded-full flex items-center justify-between shadow-md"
          >
            <span>Add to Cart</span>
            <span>{formatCurrency(totalPrice, "USD", currencySymbol)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
