"use client";

import React from "react";
import { Utensils, Bell } from "lucide-react";

interface TopBarProps {
  tableNumber: string;
  onCallWaiter: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ tableNumber, onCallWaiter }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fff8f5] border-b border-[#e2bfb2]/60 shadow-sm flex justify-between items-center w-full px-4 h-14 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Utensils className="w-5 h-5 text-[#a33900]" />
        <span className="font-bold text-lg text-[#1e1b19]">Table {tableNumber}</span>
        <span className="relative flex h-2.5 w-2.5 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006b2c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006b2c]"></span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCallWaiter}
          className="bg-[#f4ece8] hover:bg-[#eee7e3] active:scale-95 transition-all text-[#a33900] font-semibold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#e2bfb2]/50 shadow-sm"
        >
          <Bell className="w-3.5 h-3.5 text-[#a33900]" />
          <span>Call Waiter</span>
        </button>
      </div>
    </header>
  );
};
