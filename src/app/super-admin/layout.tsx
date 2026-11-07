"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  Building2,
  Repeat,
  CreditCard,
  Share2,
  Activity,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Calendar,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  Star,
} from "lucide-react";
import { VisroSlotLogo } from "@/components/brand/VisroSlotLogo";

const navItems = [
  { name: "Overview", href: "/super-admin", icon: LayoutDashboard },
  { name: "Website Analytics", href: "/super-admin/analytics", icon: BarChart3 },
  { name: "Sales & Revenue", href: "/super-admin/revenue", icon: IndianRupee },
  { name: "Businesses", href: "/super-admin/businesses", icon: Building2 },
  { name: "Subscriptions", href: "/super-admin/subscriptions", icon: Repeat },
  { name: "Payments", href: "/super-admin/payments", icon: CreditCard },
  { name: "Review Moderation", href: "/super-admin/reviews", icon: Star },
  { name: "Marketing Sources", href: "/super-admin/marketing", icon: Share2 },
  { name: "System Health", href: "/super-admin/health", icon: Activity },
  { name: "Audit Logs", href: "/super-admin/audit", icon: ShieldAlert },
  { name: "Settings", href: "/super-admin/settings", icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, render children directly without dashboard shell
  const isLoginPage = pathname === "/super-admin/login";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; uid: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Check admin session
  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/super-admin/session")
      .then((res) => {
        if (!res.ok) {
          router.replace("/super-admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.authenticated) {
          setAdminUser({
            email: data.user?.email || data.email || "rajkumar50036@gmail.com",
            uid: data.user?.uid || data.uid || "",
          });
        }
      })
      .catch(() => {
        // Only redirect if error
      });
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/super-admin/session", { method: "DELETE" });
      router.replace("/super-admin/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
      router.replace("/super-admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0B111D] text-slate-900 dark:text-slate-100 flex font-sans antialiased selection:bg-[#C49A46] selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#101A2B] text-white transition-all duration-300 flex flex-col justify-between border-r border-navy-800 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800/80">
            <Link href="/super-admin" className="flex items-center gap-3 overflow-hidden">
              <VisroSlotLogo variant="light" size="sm" href="" />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-display text-sm font-bold tracking-tight text-white">VISROSLOT</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C49A46]">Super Admin</span>
                </div>
              )}
            </Link>

            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#C49A46] text-[#101A2B] font-semibold shadow-xs"
                      : "text-slate-300 hover:bg-navy-900 hover:text-white"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Account & Logout */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-950/40">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#C49A46]/20 border border-[#C49A46]/40 flex items-center justify-center text-[#C49A46] text-xs font-bold shrink-0">
                  R
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {adminUser?.email || "rajkumar50036@gmail.com"}
                  </div>
                  <div className="text-[10px] font-mono text-[#C49A46]">Super Admin</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-navy-900 transition-colors"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#101A2B]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Asia/Kolkata (IST)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#C49A46] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-900 transition-colors"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-navy-800" />

            {/* Notification Indicator */}
            <div className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C49A46]" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
