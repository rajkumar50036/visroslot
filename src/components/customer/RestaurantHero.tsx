"use client";

import React from "react";
import { Star, Hand, Receipt, Wifi, Activity } from "lucide-react";
import { Restaurant } from "@/types/database";

interface RestaurantHeroProps {
  restaurant: Restaurant;
  onCallWaiter: () => void;
  onRequestBill: () => void;
  onShowWifi: () => void;
  onShowKdsStatus: () => void;
}

export const RestaurantHero: React.FC<RestaurantHeroProps> = ({
  restaurant,
  onCallWaiter,
  onRequestBill,
  onShowWifi,
  onShowKdsStatus,
}) => {
  return (
    <div className="px-4 pt-3.5 pb-2 bg-[#fff8f5]">
      <div>
        <h1 className="text-xl font-bold text-[#1e1b19] tracking-tight">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 bg-[#e9e1dd] px-2 py-0.5 rounded-full text-[#1e1b19] text-xs font-semibold">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{restaurant.rating}</span>
            <span className="text-[#5a4138] font-normal">({restaurant.review_count || "1.2k"})</span>
          </span>
          <span className="text-xs text-[#5a4138]">
            • Open Now • {restaurant.opening_hours}
          </span>
        </div>
      </div>

      {/* QUICK UTILITY PILLS */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={onCallWaiter}
          className="px-3 py-1.5 bg-[#f4ece8] hover:bg-[#eee7e3] active:scale-95 transition-all rounded-full text-xs font-semibold text-[#1e1b19] flex items-center gap-1.5 whitespace-nowrap shadow-sm border border-[#e2bfb2]/30"
        >
          <Hand className="w-3.5 h-3.5 text-[#a33900]" />
          <span>Call Waiter</span>
        </button>

        <button
          onClick={onRequestBill}
          className="px-3 py-1.5 bg-[#f4ece8] hover:bg-[#eee7e3] active:scale-95 transition-all rounded-full text-xs font-semibold text-[#1e1b19] flex items-center gap-1.5 whitespace-nowrap shadow-sm border border-[#e2bfb2]/30"
        >
          <Receipt className="w-3.5 h-3.5 text-[#ac3400]" />
          <span>Request Bill</span>
        </button>

        <button
          onClick={onShowWifi}
          className="px-3 py-1.5 bg-[#f4ece8] hover:bg-[#eee7e3] active:scale-95 transition-all rounded-full text-xs font-semibold text-[#1e1b19] flex items-center gap-1.5 whitespace-nowrap shadow-sm border border-[#e2bfb2]/30"
        >
          <Wifi className="w-3.5 h-3.5 text-[#5a4138]" />
          <span>WiFi Info</span>
        </button>

        <button
          onClick={onShowKdsStatus}
          className="px-3 py-1.5 bg-[#faf2ee] hover:bg-[#eee7e3] active:scale-95 transition-all rounded-full text-xs font-semibold text-[#a33900] flex items-center gap-1.5 whitespace-nowrap border border-[#e2bfb2]/60 shadow-sm"
        >
          <Activity className="w-3.5 h-3.5 text-[#a33900]" />
          <span>KDS Live Status</span>
        </button>
      </div>
    </div>
  );
};
