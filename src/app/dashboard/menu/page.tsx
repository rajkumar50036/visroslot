"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useAppStore } from "@/lib/store/app-store";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Flame, 
  Search,
  CheckCircle2,
  X
} from "lucide-react";
import { MenuItem, KitchenStation } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

export default function MenuManagementPage() {
  const { state, addCategory, addMenuItem, updateMenuItem, deleteMenuItem } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // New item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("18.00");
  const [newItemCatId, setNewItemCatId] = useState(state.categories[0]?.id || "cat-main");
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemStation, setNewItemStation] = useState<KitchenStation>("Hot Line");
  const [newItemPrepTime, setNewItemPrepTime] = useState(15);
  const [newItemImgUrl, setNewItemImgUrl] = useState("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80");

  const filteredItems = state.menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" ||
      item.category_id.includes(selectedCategory) ||
      (selectedCategory === "biryani" && item.category_id.includes("biryani")) ||
      (selectedCategory === "starters" && item.category_id.includes("starters")) ||
      (selectedCategory === "main" && item.category_id.includes("main")) ||
      (selectedCategory === "beverages" && item.category_id.includes("beverages")) ||
      (selectedCategory === "desserts" && item.category_id.includes("desserts"));

    const matchesSearch =
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatName.toLowerCase().replace(/\s+/g, '-'));
    setNewCatName("");
    setIsAddCategoryOpen(false);
  };

  const handleCreateMenuItem = () => {
    if (!newItemName.trim()) return;
    addMenuItem({
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      price: parseFloat(newItemPrice) || 15.0,
      category_id: newItemCatId,
      is_veg: newItemIsVeg,
      image_url: newItemImgUrl,
      is_popular: false,
      is_available: true,
      preparation_time_minutes: newItemPrepTime,
      kitchen_station: newItemStation,
      variants: [],
      addons: [],
    });

    setNewItemName("");
    setNewItemDesc("");
    setIsAddItemModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased overflow-hidden font-sans select-none">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#f8f9ff]">
        <TopNav searchQuery="" onSearchChange={() => {}} />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#c3c6d7]/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-extrabold text-[#0b1c30]">
                  Menu & Categories Management
                </h1>
              </div>
              <p className="text-xs text-[#434655] mt-1">
                Configure food items, prices, kitchen stations, and availability. Updates sync directly to customer QR menus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3 py-2 rounded-lg bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#004ac6] border border-[#c3c6d7] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>

              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Dish</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#c3c6d7]/60">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {state.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c.slug
                      ? "bg-[#004ac6] text-white shadow-sm font-bold"
                      : "bg-[#f8f9ff] text-[#434655] hover:text-[#0b1c30]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#737686]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search menu dishes..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8f9ff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6]"
              />
            </div>
          </div>

          {/* Menu Items Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full bg-[#f8f9ff]">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => updateMenuItem(item.id, { is_available: !item.is_available })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shadow ${
                          item.is_available
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.is_available ? "In Stock" : "Unavailable"}
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{item.kitchen_station}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold ${item.is_veg ? "text-emerald-700" : "text-red-600"}`}>
                        {item.is_veg ? "● VEG" : "▲ NON-VEG"}
                      </span>
                      <span className="text-[10px] text-[#737686]">
                        • {item.preparation_time_minutes} min prep
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#0b1c30]">{item.name}</h3>
                    <p className="text-xs text-[#434655] line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#c3c6d7]/30 flex items-center justify-between mt-2">
                  <div className="font-extrabold text-base text-[#004ac6]">
                    {formatCurrency(item.price, "USD", "$")}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const newPrice = prompt("Enter new price:", item.price.toString());
                        if (newPrice && !isNaN(parseFloat(newPrice))) {
                          updateMenuItem(item.id, { price: parseFloat(newPrice) });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] hover:bg-[#e5eeff] text-[#004ac6]"
                      title="Edit Price"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${item.name}?`)) {
                          deleteMenuItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-[#f8f9ff] border border-[#c3c6d7] hover:bg-red-50 text-red-600"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Dish Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#c3c6d7]/40 mb-3">
              <h3 className="font-bold text-base text-[#0b1c30]">Add New Food Dish</h3>
              <button onClick={() => setIsAddItemModalOpen(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Dish Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Handmade Fettuccine Alfredo"
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Description</label>
                <textarea
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Fresh pasta with parmigiano emulsion..."
                  rows={2}
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0b1c30] block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0b1c30] block mb-1">Category</label>
                  <select
                    value={newItemCatId}
                    onChange={(e) => setNewItemCatId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0b1c30] block mb-1">Dietary Flag</label>
                  <select
                    value={newItemIsVeg ? "veg" : "nonveg"}
                    onChange={(e) => setNewItemIsVeg(e.target.value === "veg")}
                    className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#0b1c30] block mb-1">Kitchen Station</label>
                  <select
                    value={newItemStation}
                    onChange={(e) => setNewItemStation(e.target.value as KitchenStation)}
                    className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                  >
                    <option value="Hot Line">Hot Line</option>
                    <option value="Grill">Grill</option>
                    <option value="Cold Kitchen">Cold Kitchen</option>
                    <option value="Beverage Bar">Beverage Bar</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Food Image URL</label>
                <input
                  type="text"
                  value={newItemImgUrl}
                  onChange={(e) => setNewItemImgUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                />
              </div>

              <button
                onClick={handleCreateMenuItem}
                className="w-full py-2.5 bg-[#004ac6] hover:bg-[#2563eb] text-white font-bold text-xs rounded-lg mt-3 shadow-md"
              >
                Save Food Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#c3c6d7]/40 mb-3">
              <h3 className="font-bold text-sm text-[#0b1c30]">Add Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Category Title</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Artisanal Breads"
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                />
              </div>
              <button
                onClick={handleCreateCategory}
                className="w-full py-2.5 bg-[#004ac6] hover:bg-[#2563eb] text-white font-bold text-xs rounded-lg shadow-md"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
