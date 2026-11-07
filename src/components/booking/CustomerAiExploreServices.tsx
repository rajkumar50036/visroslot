"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Search,
  CalendarCheck2,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";
import { Service, Business } from "@/types/database";

interface CustomerAiExploreServicesProps {
  business: Business;
  services: Service[];
  onBack: () => void;
  onBookService: (service: Service) => void;
}

export function CustomerAiExploreServices({
  business,
  services,
  onBack,
  onBookService,
}: CustomerAiExploreServicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Extract unique categories
  const categories = Array.from(
    new Set(
      services
        .map((s) => (s as any).category || "General")
        .filter(Boolean)
    )
  );

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || ((s as any).category || "General") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Options</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[#046A38] font-mono font-semibold">
          <Layers className="w-4 h-4" />
          <span>Explore Services ({services.length})</span>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search treatments or services..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#046A38]"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-[#043D2E] text-white dark:bg-[#046A38] dark:text-white font-semibold"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#043D2E] text-white dark:bg-[#046A38] dark:text-white font-semibold"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No services match your search
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or category filter.
            </p>
          </div>
        ) : (
          filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#046A38]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {srv.name}
                  </h3>
                  {(srv as any).category && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      {(srv as any).category}
                    </span>
                  )}
                </div>

                {srv.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {srv.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#046A38]" />
                    <span>{srv.duration_minutes || 30} minutes</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  ₹{Number(srv.price || 0).toLocaleString("en-IN")}
                </div>

                <button
                  onClick={() => onBookService(srv)}
                  className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Book This Service</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
