"use client";

import React, { useState } from "react";
import { X, Wifi, Copy, Check, BellRing } from "lucide-react";

interface CustomerServiceModalProps {
  type: "WIFI" | "WAITER_CALLED" | "BILL_REQUESTED" | null;
  isOpen: boolean;
  wifiSsid?: string;
  wifiPassword?: string;
  tableNumber: string;
  onClose: () => void;
}

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({
  type,
  isOpen,
  wifiSsid = "Bistro_Guest_WiFi",
  wifiPassword = "TasteGood2026",
  tableNumber,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !type) return null;

  const copyPassword = () => {
    navigator.clipboard.writeText(wifiPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#ffffff] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-5 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="self-end w-7 h-7 rounded-full bg-[#f4ece8] flex items-center justify-center text-[#5a4138] hover:bg-[#e9e1dd]"
        >
          <X className="w-4 h-4" />
        </button>

        {type === "WIFI" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-[#faf2ee] text-[#a33900] flex items-center justify-center mb-3">
              <Wifi className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1e1b19]">Guest High-Speed Wi-Fi</h3>
            <p className="text-xs text-[#5a4138] mt-1 mb-4">
              Complimentary fast fiber wireless for diners.
            </p>

            <div className="w-full bg-[#faf2ee] border border-[#e2bfb2] rounded-xl p-3 text-left space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#5a4138]">Network Name (SSID)</span>
                <div className="font-bold text-[#1e1b19]">{wifiSsid}</div>
              </div>
              <div className="pt-2 border-t border-[#e2bfb2]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5a4138]">Password</span>
                  <div className="font-mono font-bold text-[#a33900]">{wifiPassword}</div>
                </div>
                <button
                  onClick={copyPassword}
                  className="px-2.5 py-1 bg-white border border-[#e2bfb2] rounded-lg text-xs font-semibold flex items-center gap-1 text-[#1e1b19] hover:bg-[#f4ece8]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#5a4138]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#ffdbce] text-[#a33900] flex items-center justify-center mb-3 animate-bounce">
              <BellRing className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1e1b19]">
              {type === "WAITER_CALLED" ? "Waiter Alerted!" : "Bill Requested!"}
            </h3>
            <p className="text-xs text-[#5a4138] mt-1 mb-4 leading-relaxed">
              {type === "WAITER_CALLED"
                ? `A server is heading to Table ${tableNumber} now.`
                : `Your cashier desk has received the bill request for Table ${tableNumber}. Please settle at the counter.`}
            </p>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs rounded-full shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};
