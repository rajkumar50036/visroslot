"use client";

import React from "react";
import { CircleDollarSign } from "lucide-react";

export const CounterPaymentBanner: React.FC = () => {
  return (
    <section className="bg-[#faf2ee] border-b border-[#e2bfb2]/40 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#ffdbd0] flex items-center justify-center text-[#a33900] shrink-0">
          <CircleDollarSign className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#ac3400] font-bold">
            Payment at Counter Only
          </div>
          <p className="text-xs text-[#5a4138]">
            Order directly to kitchen. Settle bill at cashier desk.
          </p>
        </div>
      </div>
      <span className="text-[10px] font-bold bg-[#e9e1dd] px-2 py-0.5 rounded text-[#5a4138] shrink-0">
        No Card Online
      </span>
    </section>
  );
};
