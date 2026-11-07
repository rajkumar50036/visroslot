"use client";

import React from "react";
import Image from "next/image";
import { Flame, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface SpotlightCardProps {
  item: MenuItem;
  currencySymbol?: string;
  onCustomize: (item: MenuItem) => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  item,
  currencySymbol = "$",
  onCustomize,
}) => {
  return (
    <div className="p-4">
      <div className="relative bg-[#ffffff] rounded-2xl overflow-hidden border border-[#e2bfb2]/70 shadow-sm">
        <div className="relative h-44 w-full overflow-hidden bg-[#faf2ee]">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 500px"
          />
          <span className="absolute top-3 left-3 bg-[#ac3400] text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <Flame className="w-3.5 h-3.5 fill-white text-white" />
            <span>Chef's Signature</span>
          </span>

          {/* Veg / Non-veg Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-1 rounded shadow">
            {item.is_veg ? (
              <div className="w-4 h-4 border border-[#006b2c] flex items-center justify-center rounded-[3px]">
                <div className="w-2 h-2 bg-[#006b2c] rounded-full"></div>
              </div>
            ) : (
              <div className="w-4 h-4 border border-[#ba1a1a] flex items-center justify-center rounded-[3px]">
                <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-[#ba1a1a]"></div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-base text-[#1e1b19] tracking-tight">
            {item.name}
          </h3>
          <p className="text-xs text-[#5a4138] line-clamp-2 mt-1">
            {item.description}
          </p>

          <div className="mt-3 pt-3 border-t border-[#e2bfb2]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5a4138]">Price</span>
              <div className="font-extrabold text-lg text-[#a33900]">
                {formatCurrency(item.price, "USD", currencySymbol)}
              </div>
            </div>

            <button
              onClick={() => onCustomize(item)}
              className="px-4 py-2 bg-[#a33900] hover:bg-[#cc4900] text-white rounded-full font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize & Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
