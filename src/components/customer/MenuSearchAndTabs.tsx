"use client";

import React from "react";
import { Search } from "lucide-react";
import { MenuCategory } from "@/types/database";

interface MenuSearchAndTabsProps {
  categories: MenuCategory[];
  selectedCategory: string;
  searchQuery: string;
  onSelectCategory: (slug: string) => void;
  onSearchChange: (query: string) => void;
}

export const MenuSearchAndTabs: React.FC<MenuSearchAndTabsProps> = ({
  categories,
  selectedCategory,
  searchQuery,
  onSelectCategory,
  onSearchChange,
}) => {
  return (
    <div className="sticky top-14 z-30 bg-[#fff8f5]/95 backdrop-blur-md px-4 py-2 border-b border-[#e2bfb2]/40">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138]/70" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dishes, biryani, starters..."
          className="w-full bg-[#ffffff] border border-[#e2bfb2] rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#a33900] text-[#1e1b19] placeholder:text-[#5a4138]/60 shadow-sm transition-all"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? "bg-[#1e1b19] text-[#fff8f5]"
                  : "bg-[#ffffff] border border-[#e2bfb2] text-[#5a4138] hover:text-[#1e1b19]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
