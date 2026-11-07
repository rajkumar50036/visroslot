"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

interface IndustryCard {
  title: string;
  badge: string;
  description: string;
  tags: string;
  image: string;
}

const industries: IndustryCard[] = [
  {
    title: "Salons and Barbershops",
    badge: "Salons & Studios",
    description: "Manage client styling slots, multi-chair specialist assignments, sanitization intervals, and repeat treatments.",
    tags: "Chair Rostering • Service Menus",
    image: "/assets/industry-salon.png",
  },
  {
    title: "Clinics & Dental Practices",
    badge: "Healthcare & Dental",
    description: "Organize consultation queues, procedure room allocations, automated intake forms, and specialist shifts.",
    tags: "Patient History • Room Locks",
    image: "/assets/industry-clinic.png",
  },
  {
    title: "Spas and Wellness Centres",
    badge: "Therapy & Wellness",
    description: "Coordinate dedicated therapy chambers, multi-hour holistic rituals, massage therapists, and custom package bookings.",
    tags: "Room Scheduling • Buffers",
    image: "/assets/industry-spa.png",
  },
  {
    title: "Fitness Studios & Trainers",
    badge: "Fitness & Pilates",
    description: "Schedule 1-on-1 private training sessions, reformer apparatus slots, fitness assessments, and coach timetables.",
    tags: "Equipment Allocation • Sessions",
    image: "/assets/industry-fitness.png",
  },
  {
    title: "Consultants & Advisory",
    badge: "Advisory & Legal",
    description: "Provide private clients with frictionless scheduling for executive strategy, legal consultations, and portfolio reviews.",
    tags: "Timezone Sync • Private Links",
    image: "/assets/industry-consulting.png",
  },
];

export default function BusinessTypes() {
  return (
    <section id="industries" className="py-16 md:py-24 bg-[#F7F6F0] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[#046A38] dark:text-[#9EF6B6] text-xs font-mono font-bold uppercase tracking-widest">
              Universal Compatibility
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#10251D] dark:text-[#FFFFFF] tracking-tight">
              Built for businesses that run on appointments.
            </h2>
            <p className="text-base text-[#404944] dark:text-[#D8DED8] max-w-xl leading-relaxed">
              VISROSLOT adapts cleanly to your unique service durations, room restrictions, and staff allocations.
            </p>
          </div>

          <Link
            href="/contact"
            className="hidden md:inline-flex items-center gap-1.5 text-[#046A38] dark:text-[#9EF6B6] text-sm font-semibold hover:underline"
          >
            <span>Explore All 20+ Industries</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 6 Curated Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind) => (
            <div
              key={ind.title}
              className="bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg overflow-hidden group hover:border-[#046A38] dark:hover:border-[#9EF6B6] transition-all duration-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-[#10251D]">
                  <Image
                    src={ind.image}
                    alt={ind.title}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-[#10251D]/80 backdrop-blur-sm text-[#FFFFFF] text-[11px] font-semibold px-2.5 py-1 rounded">
                    {ind.badge}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                    {ind.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                    {ind.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#D8DED8] dark:border-[#D8DED8]/20 text-[#046A38] dark:text-[#9EF6B6] font-semibold">
                  <span>{ind.tags}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}

          {/* 6th Card: Bespoke Operations */}
          <div className="bg-[#EFEEE8] dark:bg-[#043D2E]/50 border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-lg p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-semibold font-mono">
                Bespoke Operations
              </span>
              <h3 className="font-display text-xl font-bold text-[#10251D] dark:text-[#FFFFFF]">
                Specialist Studios &amp; Other Services
              </h3>
              <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] leading-relaxed">
                Photography bays, tutoring academies, music studios, pet grooming, and any bespoke service business requiring slot-based control.
              </p>
            </div>

            <div className="pt-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-[#046A38] dark:text-[#9EF6B6] font-semibold text-xs hover:underline"
              >
                <span>Talk to an operational architect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
