import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD", symbol: string = "$"): string {
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    const past = new Date(dateStr).getTime();
    const diff = Math.floor((Date.now() - past) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  } catch {
    return "just now";
  }
}

export function generateOrderNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}

export function generateSecureToken(tableNumber: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `tbl_tok_${tableNumber.padStart(2, '0')}_${rand}`;
}
