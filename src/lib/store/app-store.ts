"use client";

import { useEffect, useState } from "react";
import { 
  Restaurant, 
  Branch, 
  RestaurantTable, 
  MenuCategory, 
  MenuItem, 
  Order, 
  OrderStatus, 
  PaymentMethod,
  CashCollection,
  InventoryItem,
  Expense,
  CustomerServiceRequest,
  StaffMember
} from "@/types/database";
import { 
  initialRestaurant, 
  initialBranches, 
  initialTables, 
  initialCategories, 
  initialMenuItems, 
  initialOrders, 
  initialCashCollections,
  initialInventory,
  initialExpenses,
  initialStaffMembers
} from "./mock-data";
import { soundEngine } from "../audio";
import { generateOrderNumber } from "../utils";

const STORAGE_KEY_PREFIX = "restoflow_state_v1";

interface StateData {
  restaurant: Restaurant;
  branches: Branch[];
  activeBranchId: string;
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  collections: CashCollection[];
  inventory: InventoryItem[];
  expenses: Expense[];
  staff: StaffMember[];
  serviceRequests: CustomerServiceRequest[];
  audioEnabled: boolean;
  emergencyStop: boolean;
  unacknowledgedOrder: Order | null;
}

const DEFAULT_STATE: StateData = {
  restaurant: initialRestaurant,
  branches: initialBranches,
  activeBranchId: initialBranches[0].id,
  tables: initialTables,
  categories: initialCategories,
  menuItems: initialMenuItems,
  orders: initialOrders,
  collections: initialCashCollections,
  inventory: initialInventory,
  expenses: initialExpenses,
  staff: initialStaffMembers,
  serviceRequests: [],
  audioEnabled: false,
  emergencyStop: false,
  unacknowledgedOrder: null,
};

let globalState: StateData = DEFAULT_STATE;
const listeners = new Set<() => void>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX);
    if (saved) {
      const parsed = JSON.parse(saved);
      globalState = { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load initial state from localStorage", e);
  }

  // Cross-tab synchronization via BroadcastChannel
  try {
    broadcastChannel = new BroadcastChannel("restoflow_sync_channel");
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "STATE_UPDATED") {
        globalState = event.data.state;
        listeners.forEach((listener) => listener());
      } else if (event.data?.type === "NEW_ORDER_ALERT") {
        globalState.unacknowledgedOrder = event.data.order;
        if (globalState.audioEnabled) {
          soundEngine.startAlarm();
        }
        listeners.forEach((listener) => listener());
      }
    };
  } catch (e) {
    console.warn("BroadcastChannel not supported in this environment", e);
  }
}

function persistAndBroadcast(newState: StateData, alertOrder?: Order) {
  globalState = newState;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(newState));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
    if (broadcastChannel) {
      if (alertOrder) {
        broadcastChannel.postMessage({ type: "NEW_ORDER_ALERT", order: alertOrder, state: newState });
      } else {
        broadcastChannel.postMessage({ type: "STATE_UPDATED", state: newState });
      }
    }
  }
  listeners.forEach((listener) => listener());
}

export function useAppStore() {
  const [state, setState] = useState<StateData>(globalState);

  useEffect(() => {
    const handleUpdate = () => setState({ ...globalState });
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // Actions
  const enableAudio = () => {
    const success = soundEngine.enableAudio();
    const updated = { ...state, audioEnabled: true };
    persistAndBroadcast(updated);
    return success;
  };

  const toggleMute = () => {
    const nextMuted = !soundEngine.getMuted();
    soundEngine.setMuted(nextMuted);
    setState({ ...state });
  };

  const toggleEmergencyStop = () => {
    const updated = { ...state, emergencyStop: !state.emergencyStop };
    persistAndBroadcast(updated);
  };

  const acknowledgeOrder = (orderId?: string) => {
    soundEngine.stopAlarm();
    let updatedOrders = [...state.orders];
    if (orderId) {
      updatedOrders = updatedOrders.map((ord) => 
        ord.id === orderId && ord.order_status === "PENDING"
          ? { ...ord, order_status: "ACCEPTED" as OrderStatus }
          : ord
      );
    }
    const updated = {
      ...state,
      orders: updatedOrders,
      unacknowledgedOrder: null,
    };
    persistAndBroadcast(updated);
  };

  const placeOrder = (newOrderData: {
    restaurantId: string;
    branchId?: string;
    tableId: string;
    tableNumber: string;
    customerName: string;
    customerPhone?: string;
    items: {
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      variant?: string;
      addons?: string[];
      notes?: string;
    }[];
    specialInstructions?: string;
  }): Order => {
    const subtotal = newOrderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = (subtotal * state.restaurant.tax_rate) / 100;
    const totalAmount = subtotal + taxAmount;
    const orderId = `ord-${Date.now()}`;
    const orderNum = generateOrderNumber();

    const createdOrder: Order = {
      id: orderId,
      order_number: orderNum,
      restaurant_id: newOrderData.restaurantId,
      branch_id: newOrderData.branchId || state.activeBranchId,
      table_id: newOrderData.tableId,
      table_number: newOrderData.tableNumber,
      customer_name: newOrderData.customerName || `Table ${newOrderData.tableNumber} Guest`,
      customer_phone: newOrderData.customerPhone,
      order_status: "PENDING",
      payment_status: "UNPAID",
      subtotal,
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      special_instructions: newOrderData.specialInstructions,
      kitchen_station: "Hot Line",
      placed_at: new Date().toISOString(),
      items: newOrderData.items.map((it, idx) => ({
        id: `item-${orderId}-${idx}`,
        order_id: orderId,
        menu_item_id: it.menuItemId,
        item_name: it.name,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        total_price: it.totalPrice,
        selected_variant: it.variant,
        selected_addons: it.addons,
        kitchen_notes: it.notes,
      })),
    };

    // Update table scan and active orders count
    const updatedTables = state.tables.map((tbl) => 
      tbl.id === newOrderData.tableId
        ? { ...tbl, active_orders_count: (tbl.active_orders_count || 0) + 1 }
        : tbl
    );

    const updated = {
      ...state,
      orders: [createdOrder, ...state.orders],
      tables: updatedTables,
      unacknowledgedOrder: createdOrder,
    };

    // Trigger loud chime if audio was activated by staff
    if (state.audioEnabled) {
      soundEngine.startAlarm();
    }

    persistAndBroadcast(updated, createdOrder);
    return createdOrder;
  };

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const now = new Date().toISOString();
    const updatedOrders = state.orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      const updated: Order = { ...ord, order_status: nextStatus };
      if (nextStatus === "PREPARING" && !updated.prep_started_at) {
        updated.prep_started_at = now;
      } else if (nextStatus === "READY" && !updated.ready_at) {
        updated.ready_at = now;
      } else if (nextStatus === "SERVED" && !updated.served_at) {
        updated.served_at = now;
      } else if (nextStatus === "COMPLETED" && !updated.completed_at) {
        updated.completed_at = now;
      }
      return updated;
    });

    const updated = {
      ...state,
      orders: updatedOrders,
      unacknowledgedOrder: state.unacknowledgedOrder?.id === orderId ? null : state.unacknowledgedOrder,
    };
    persistAndBroadcast(updated);
  };

  const collectCashierPayment = (orderId: string, method: PaymentMethod, collectedBy: string = "Cashier Desk"): CashCollection => {
    const targetOrder = state.orders.find((o) => o.id === orderId);
    if (!targetOrder) throw new Error("Order not found");

    const receiptNum = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const collection: CashCollection = {
      id: `col-${Date.now()}`,
      order_id: targetOrder.id,
      order_number: targetOrder.order_number,
      table_number: targetOrder.table_number,
      restaurant_id: targetOrder.restaurant_id,
      branch_id: targetOrder.branch_id,
      amount: targetOrder.total_amount,
      payment_method: method,
      receipt_number: receiptNum,
      collected_by: collectedBy,
      notes: `Counter ${method} payment tender confirmed`,
      collected_at: new Date().toISOString(),
    };

    const updatedOrders = state.orders.map((ord) => 
      ord.id === orderId 
        ? { ...ord, payment_status: "PAID" as const, order_status: ord.order_status === "SERVED" ? ("COMPLETED" as const) : ord.order_status }
        : ord
    );

    const updated = {
      ...state,
      orders: updatedOrders,
      collections: [collection, ...state.collections],
    };
    persistAndBroadcast(updated);
    return collection;
  };

  const callWaiter = (tableNumber: string, type: 'CALL_WAITER' | 'REQUEST_BILL' = 'CALL_WAITER') => {
    const request: CustomerServiceRequest = {
      id: `req-${Date.now()}`,
      restaurant_id: state.restaurant.id,
      branch_id: state.activeBranchId,
      table_number: tableNumber,
      type,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    soundEngine.playTone(660, 0.3, 0.25);
    const updated = {
      ...state,
      serviceRequests: [request, ...state.serviceRequests],
    };
    persistAndBroadcast(updated);
    return request;
  };

  const resolveServiceRequest = (requestId: string) => {
    const updated = {
      ...state,
      serviceRequests: state.serviceRequests.map((r) => 
        r.id === requestId ? { ...r, status: 'RESOLVED' as const } : r
      ),
    };
    persistAndBroadcast(updated);
  };

  // Menu Management
  const addCategory = (name: string, slug: string) => {
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      restaurant_id: state.restaurant.id,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      display_order: state.categories.length,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    persistAndBroadcast({ ...state, categories: [...state.categories, newCat] });
  };

  const addMenuItem = (item: Omit<MenuItem, "id" | "created_at" | "restaurant_id">) => {
    const newItem: MenuItem = {
      ...item,
      id: `dish-${Date.now()}`,
      restaurant_id: state.restaurant.id,
      created_at: new Date().toISOString(),
    };
    persistAndBroadcast({ ...state, menuItems: [...state.menuItems, newItem] });
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    persistAndBroadcast({
      ...state,
      menuItems: state.menuItems.map((m) => m.id === itemId ? { ...m, ...updates } : m),
    });
  };

  const deleteMenuItem = (itemId: string) => {
    persistAndBroadcast({
      ...state,
      menuItems: state.menuItems.filter((m) => m.id !== itemId),
    });
  };

  // Table Management
  const addTable = (tableNumber: string, capacity: number = 4) => {
    const rand = Math.random().toString(36).substring(2, 8);
    const secureToken = `tbl_tok_${tableNumber.padStart(2, '0')}_${rand}`;
    const newTable: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      restaurant_id: state.restaurant.id,
      branch_id: state.activeBranchId,
      table_number: tableNumber,
      capacity,
      secure_token: secureToken,
      is_active: true,
      total_scans: 1,
      active_orders_count: 0,
      created_at: new Date().toISOString(),
    };
    persistAndBroadcast({ ...state, tables: [...state.tables, newTable] });
  };

  const deleteTable = (tableId: string) => {
    persistAndBroadcast({
      ...state,
      tables: state.tables.filter((t) => t.id !== tableId),
    });
  };

  // Calculations & KPIs
  const activeOrdersCount = state.orders.filter(
    (o) => o.order_status !== "COMPLETED" && o.order_status !== "CANCELLED"
  ).length;

  const pendingUnacknowledgedCount = state.orders.filter(
    (o) => o.order_status === "PENDING"
  ).length;

  const preparingCount = state.orders.filter(
    (o) => o.order_status === "PREPARING"
  ).length;

  const readyCount = state.orders.filter(
    (o) => o.order_status === "READY"
  ).length;

  const pendingCounterUnpaidAmount = state.orders
    .filter((o) => o.payment_status === "UNPAID" && o.order_status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const totalCollectedAmount = state.collections.reduce((sum, c) => sum + c.amount, 0);

  const cashCollected = state.collections
    .filter((c) => c.payment_method === "CASH")
    .reduce((sum, c) => sum + c.amount, 0);

  const upiCollected = state.collections
    .filter((c) => c.payment_method === "UPI")
    .reduce((sum, c) => sum + c.amount, 0);

  const cardCollected = state.collections
    .filter((c) => c.payment_method === "CARD")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  const estimatedOperatingProfit = totalCollectedAmount - (totalExpenses * 0.1); // normalized shift estimate

  const totalScans = state.tables.reduce((sum, t) => sum + (t.total_scans || 0), 0);
  const conversionRate = totalScans > 0 
    ? Math.min(100, parseFloat(((state.orders.length / totalScans) * 100).toFixed(1)))
    : 68.4;

  return {
    state,
    enableAudio,
    toggleMute,
    toggleEmergencyStop,
    acknowledgeOrder,
    placeOrder,
    updateOrderStatus,
    collectCashierPayment,
    callWaiter,
    resolveServiceRequest,
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addTable,
    deleteTable,
    kpis: {
      activeOrdersCount,
      pendingUnacknowledgedCount,
      preparingCount,
      readyCount,
      pendingCounterUnpaidAmount,
      totalCollectedAmount,
      cashCollected,
      upiCollected,
      cardCollected,
      totalExpenses,
      estimatedOperatingProfit,
      totalScans,
      conversionRate,
      avgPrepTimeMinutes: 14.2,
    },
  };
}
