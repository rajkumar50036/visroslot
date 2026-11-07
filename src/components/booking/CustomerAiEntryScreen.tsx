"use client";

import React from "react";
import Image from "next/image";
import {
  CalendarCheck2,
  Layers,
  CalendarDays,
  Clock,
  XCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import { Business, Service } from "@/types/database";

interface CustomerAiEntryScreenProps {
  business: Business;
  services: Service[];
  reviewsData: {
    averageRating: number;
    totalReviews: number;
  };
  onSelectOption: (option: "book" | "explore" | "my-appointments" | "reschedule" | "cancel" | "chat" | "classic") => void;
  onSelectService?: (service: Service) => void;
}

export function CustomerAiEntryScreen({
  business,
  services,
  reviewsData,
  onSelectOption,
  onSelectService,
}: CustomerAiEntryScreenProps) {
  const options = [
    {
      id: "book" as const,
      title: "Book Appointment",
      description: "Pick your service, specialist, and live time slot with instant confirmation.",
      icon: CalendarCheck2,
      badge: "Real-Time Slots",
    },
    {
      id: "explore" as const,
      title: "Explore Services",
      description: `Browse all ${services.length} active treatments, durations, and transparent pricing.`,
      icon: Layers,
      badge: `${services.length} Services`,
    },
    {
      id: "my-appointments" as const,
      title: "My Appointments",
      description: "Securely view your upcoming visits, past completed services, and status.",
      icon: CalendarDays,
      badge: "Lookup & History",
    },
    {
      id: "reschedule" as const,
      title: "Reschedule Appointment",
      description: "Move an upcoming appointment to another date or time slot easily.",
      icon: Clock,
      badge: "Flexible Change",
    },
    {
      id: "cancel" as const,
      title: "Cancel Booking",
      description: "Cancel an upcoming booking in accordance with our cancellation policy.",
      icon: XCircle,
      badge: "Self-Service",
    },
    {
      id: "chat" as const,
      title: "Ask AI Assistant",
      description: "Ask questions in plain English about services, prices, staff, or opening hours.",
      icon: Sparkles,
      badge: "Smart AI Concierge",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* AI Concierge Welcome Banner */}
      <div className="p-4 sm:p-5 rounded-lg bg-[#043D2E] text-white border border-[#D8DED8]/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#10251D] border border-[#046A38] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <Image
              src="/assets/visroslot-logo.png"
              alt="VISROSLOT"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9EF6B6] font-bold">
                VISROSLOT Customer AI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#046A38] text-white border border-[#046A38]/50">
                Live &amp; Verified
              </span>
            </div>
            <p className="text-xs text-[#D8DED8] mt-0.5">
              How can we assist you with <strong>{business.name}</strong> today?
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectOption("classic")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[#FFFFFF] text-xs font-medium border border-white/15 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Switch to Classic Form</span>
        </button>
      </div>

      {/* 6 Clickable Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt.id)}
              className="group p-5 rounded-lg bg-[#FFFFFF] border border-[#D8DED8] hover:border-[#046A38] shadow-xs hover:shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[#046A38]/10 text-[#046A38] border border-[#046A38]/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F7F6F0] text-[#404944] border border-[#D8DED8]">
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#10251D] group-hover:text-[#046A38] transition-colors flex items-center gap-1.5">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-[#707974] mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-[#D8DED8]/60 flex items-center justify-between text-xs font-semibold text-[#046A38]">
                <span>Proceed</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Popular Services Quick Strip */}
      {services.length > 0 && (
        <div className="p-5 rounded-lg bg-[#FFFFFF] border border-[#D8DED8] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D8DED8]/60">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#10251D]">
              Popular Services at {business.name}
            </h4>
            <button
              onClick={() => onSelectOption("explore")}
              className="text-xs font-semibold text-[#046A38] hover:underline cursor-pointer"
            >
              View All ({services.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {services.slice(0, 4).map((srv) => (
              <button
                key={srv.id}
                onClick={() => {
                  if (onSelectService) {
                    onSelectService(srv);
                  } else {
                    onSelectOption("book");
                  }
                }}
                className="p-3 rounded-md bg-[#F7F6F0] hover:bg-[#046A38]/5 border border-[#D8DED8] hover:border-[#046A38] transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold text-[#10251D] truncate">
                    {srv.name}
                  </div>
                  <div className="text-[11px] text-[#707974]">
                    {srv.duration_minutes || 30} mins
                  </div>
                </div>
                <div className="font-display font-bold text-xs text-[#10251D] shrink-0 font-mono">
                  ₹{Number(srv.price || 0).toLocaleString("en-IN")}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
