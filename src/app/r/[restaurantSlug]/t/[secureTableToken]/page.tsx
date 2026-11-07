"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { MenuItem } from "@/types/database";
import { TopBar } from "@/components/customer/TopBar";
import { CounterPaymentBanner } from "@/components/customer/CounterPaymentBanner";
import { RestaurantHero } from "@/components/customer/RestaurantHero";
import { MenuSearchAndTabs } from "@/components/customer/MenuSearchAndTabs";
import { SpotlightCard } from "@/components/customer/SpotlightCard";
import { DishCard } from "@/components/customer/DishCard";
import { DishDetailModal } from "@/components/customer/DishDetailModal";
import { CartDrawer, CartItem } from "@/components/customer/CartDrawer";
import { OrderConfirmationModal } from "@/components/customer/OrderConfirmationModal";
import { LiveTrackingSheet } from "@/components/customer/LiveTrackingSheet";
import { CustomerServiceModal } from "@/components/customer/CustomerServiceModal";
import { BottomBar } from "@/components/customer/BottomBar";
import { Order } from "@/types/database";

export default function CustomerMenuPage() {
  const params = useParams();
  const restaurantSlug = (params?.restaurantSlug as string) || "bistro-grande";
  const secureTableToken = (params?.secureTableToken as string) || "tbl_tok_08_8f4c1e";

  const { state, placeOrder, callWaiter } = useAppStore();

  // Find table from secure token
  const currentTable = useMemo(() => {
    return (
      state.tables.find((t) => t.secure_token === secureTableToken) ||
      state.tables.find((t) => t.table_number === "08") ||
      state.tables[0]
    );
  }, [state.tables, secureTableToken]);

  // Find active order for this table
  const activeTableOrder = useMemo(() => {
    return (
      state.orders.find(
        (o) => o.table_id === currentTable.id && o.order_status !== "COMPLETED" && o.order_status !== "CANCELLED"
      ) || null
    );
  }, [state.orders, currentTable.id]);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [serviceModalType, setServiceModalType] = useState<"WIFI" | "WAITER_CALLED" | "BILL_REQUESTED" | null>(null);

  // Filter menu items
  const filteredDishes = useMemo(() => {
    return state.menuItems.filter((dish) => {
      const matchesCategory =
        selectedCategory === "all" ||
        dish.category_id.includes(selectedCategory) ||
        (selectedCategory === "biryani" && dish.category_id.includes("biryani")) ||
        (selectedCategory === "starters" && dish.category_id.includes("starters")) ||
        (selectedCategory === "main" && dish.category_id.includes("main")) ||
        (selectedCategory === "beverages" && dish.category_id.includes("beverages")) ||
        (selectedCategory === "desserts" && dish.category_id.includes("desserts"));

      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [state.menuItems, selectedCategory, searchQuery]);

  // Spotlight dish (Dum Biryani)
  const spotlightItem = useMemo(() => {
    return state.menuItems.find((d) => d.id === "dish-biryani-dum") || state.menuItems[0];
  }, [state.menuItems]);

  // Cart calculations
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTax = (cartSubtotal * state.restaurant.tax_rate) / 100;
  const cartTotal = cartSubtotal + cartTax;

  const getCartQuantity = (menuItemId: string) => {
    return cartItems
      .filter((i) => i.menuItemId === menuItemId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  // Cart operations
  const handleSimpleAdd = (dish: MenuItem) => {
    const existing = cartItems.find((i) => i.menuItemId === dish.id && !i.variant && !i.addons?.length);
    if (existing) {
      setCartItems(
        cartItems.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random()}`,
        menuItemId: dish.id,
        name: dish.name,
        unitPrice: dish.price,
        quantity: 1,
        totalPrice: dish.price,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleCustomizedAdd = (customized: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    variant?: string;
    addons?: string[];
    notes?: string;
  }) => {
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      ...customized,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleIncrease = (dish: MenuItem) => {
    handleSimpleAdd(dish);
  };

  const handleDecrease = (dish: MenuItem) => {
    const existing = cartItems.find((i) => i.menuItemId === dish.id);
    if (existing) {
      if (existing.quantity > 1) {
        setCartItems(
          cartItems.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.unitPrice }
              : i
          )
        );
      } else {
        setCartItems(cartItems.filter((i) => i.id !== existing.id));
      }
    }
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
    } else {
      setCartItems(
        cartItems.map((i) =>
          i.id === cartItemId ? { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice } : i
        )
      );
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems(cartItems.filter((i) => i.id !== cartItemId));
  };

  // Confirm order
  const handleConfirmOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    specialInstructions: string;
  }) => {
    const created = placeOrder({
      restaurantId: state.restaurant.id,
      branchId: state.activeBranchId,
      tableId: currentTable.id,
      tableNumber: currentTable.table_number,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      items: cartItems,
      specialInstructions: orderData.specialInstructions,
    });

    setCartItems([]);
    setIsCartOpen(false);
    setConfirmedOrder(created);
  };

  const triggerCallWaiter = () => {
    callWaiter(currentTable.table_number, "CALL_WAITER");
    setServiceModalType("WAITER_CALLED");
  };

  const triggerRequestBill = () => {
    callWaiter(currentTable.table_number, "REQUEST_BILL");
    setServiceModalType("BILL_REQUESTED");
  };

  return (
    <div className="bg-[#fff8f5] min-h-screen text-[#1e1b19] font-sans flex flex-col selection:bg-[#ffdbce] selection:text-[#370e00]">
      {/* Mobile-constrained app shell matching design reference */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-[#fff8f5] shadow-lg relative pb-24 border-x border-[#e2bfb2]/30">
        {/* Top App Bar */}
        <TopBar
          tableNumber={currentTable.table_number}
          onCallWaiter={triggerCallWaiter}
        />

        {/* Prominent Counter Payment Banner */}
        <CounterPaymentBanner />

        {/* Restaurant Profile Hero */}
        <RestaurantHero
          restaurant={state.restaurant}
          onCallWaiter={triggerCallWaiter}
          onRequestBill={triggerRequestBill}
          onShowWifi={() => setServiceModalType("WIFI")}
          onShowKdsStatus={() => setIsTrackingOpen(true)}
        />

        {/* Sticky Search & Category Pills */}
        <MenuSearchAndTabs
          categories={state.categories}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSelectCategory={setSelectedCategory}
          onSearchChange={setSearchQuery}
        />

        {/* Main Menu Feed */}
        <main className="flex-1 flex flex-col">
          {/* Spotlight Hero Card (Dum Biryani) */}
          {selectedCategory === "all" && !searchQuery && spotlightItem && (
            <SpotlightCard
              item={spotlightItem}
              currencySymbol={state.restaurant.currency_symbol}
              onCustomize={(item) => setCustomizingItem(item)}
            />
          )}

          {/* Dishes List */}
          <div className="px-4 space-y-3 pb-8">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                item={dish}
                currencySymbol={state.restaurant.currency_symbol}
                cartQuantity={getCartQuantity(dish.id)}
                onAdd={handleSimpleAdd}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onCustomize={(item) => setCustomizingItem(item)}
              />
            ))}

            {filteredDishes.length === 0 && (
              <div className="py-16 text-center text-[#5a4138]">
                <p className="font-semibold text-sm">No dishes found</p>
                <p className="text-xs text-[#8e7166] mt-1">Try searching for other items or browse categories.</p>
              </div>
            )}
          </div>
        </main>

        {/* Floating Mobile Bottom Navigation */}
        <BottomBar
          cartItemCount={cartItemCount}
          cartTotal={cartTotal}
          currencySymbol={state.restaurant.currency_symbol}
          activeOrder={activeTableOrder}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTracking={() => setIsTrackingOpen(true)}
        />
      </div>

      {/* Customizer Modal */}
      <DishDetailModal
        item={customizingItem}
        isOpen={!!customizingItem}
        currencySymbol={state.restaurant.currency_symbol}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleCustomizedAdd}
      />

      {/* Cart Sheet Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        tableNumber={currentTable.table_number}
        taxRate={state.restaurant.tax_rate}
        currencySymbol={state.restaurant.currency_symbol}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onConfirmOrder={handleConfirmOrder}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        isOpen={!!confirmedOrder}
        currencySymbol={state.restaurant.currency_symbol}
        onClose={() => setConfirmedOrder(null)}
        onTrackOrder={() => {
          setConfirmedOrder(null);
          setIsTrackingOpen(true);
        }}
      />

      {/* Live Order Status Tracking Sheet */}
      <LiveTrackingSheet
        order={activeTableOrder}
        isOpen={isTrackingOpen}
        currencySymbol={state.restaurant.currency_symbol}
        onClose={() => setIsTrackingOpen(false)}
        onCallWaiter={triggerCallWaiter}
        onRequestBill={triggerRequestBill}
      />

      {/* Customer Service Modals (WiFi, Waiter Alert, Bill Request) */}
      <CustomerServiceModal
        type={serviceModalType}
        isOpen={!!serviceModalType}
        wifiSsid={state.restaurant.wifi_ssid}
        wifiPassword={state.restaurant.wifi_password}
        tableNumber={currentTable.table_number}
        onClose={() => setServiceModalType(null)}
      />
    </div>
  );
}
