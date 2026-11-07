"use client";

import React from "react";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { MenuItem } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface DishCardProps {
  item: MenuItem;
  currencySymbol?: string;
  cartQuantity: number;
  onAdd: (item: MenuItem) => void;
  onIncrease: (item: MenuItem) => void;
  onDecrease: (item: MenuItem) => void;
  onCustomize: (item: MenuItem) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  item,
  currencySymbol = "$",
  cartQuantity,
  onAdd,
  onIncrease,
  onDecrease,
  onCustomize,
}) => {
  const hasCustomizations = (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0);

  const handleAddClick = () => {
    if (hasCustomizations) {
      onCustomize(item);
    } else {
      onAdd(item);
    }
  };

  return (
    <div className="bg-[#ffffff] rounded-xl p-3.5 border border-[#e2bfb2]/70 shadow-sm flex gap-3 items-center justify-between transition-all hover:border-[#a33900]/40">
      <div className="flex-1 pr-2">
        <div className="flex items-center gap-2 mb-1">
          {/* Veg / Non-veg Badge */}
          {item.is_veg ? (
            <div className="w-3.5 h-3.5 border border-[#006b2c] flex items-center justify-center rounded-[3px]">
              <div className="w-1.5 h-1.5 bg-[#006b2c] rounded-full"></div>
            </div>
          ) : (
            <div className="w-3.5 h-3.5 border border-[#ba1a1a] flex items-center justify-center rounded-[3px]">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-[#ba1a1a]"></div>
            </div>
          )}
          <span className={`text-[10px] font-bold ${item.is_veg ? "text-[#006b2c]" : "text-[#ba1a1a]"}`}>
            {item.is_veg ? "VEG" : "NON-VEG"}
          </span>
          {item.is_popular && (
            <span className="bg-[#f4ece8] px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#5a4138]">
              Popular
            </span>
          )}
        </div>

        <h4 className="font-bold text-sm text-[#1e1b19] leading-snug">
          {item.name}
        </h4>
        <p className="text-xs text-[#5a4138] line-clamp-2 mt-0.5 leading-relaxed">
          {item.description}
        </p>

        <div className="font-extrabold text-base text-[#a33900] mt-1.5">
          {formatCurrency(item.price, "USD", currencySymbol)}
        </div>
      </div>

      <div className="relative flex-shrink-0 flex flex-col items-center">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e2bfb2]/40 bg-[#faf2ee]">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="mt-2">
          {cartQuantity === 0 ? (
            <button
              onClick={handleAddClick}
              className="px-3.5 py-1 bg-[#f4ece8] hover:bg-[#eee7e3] border border-[#e2bfb2] text-[#a33900] font-bold text-xs rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#a33900] text-white px-2 py-1 rounded-full shadow-sm">
              <button
                onClick={() => onDecrease(item)}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded-full active:scale-90"
              >
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="text-xs font-bold min-w-[12px] text-center">
                {cartQuantity}
              </span>
              <button
                onClick={() => (hasCustomizations ? onCustomize(item) : onIncrease(item))}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded-full active:scale-90"
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
