"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  Loader2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Appointment, Business } from "@/types/database";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<"THIS_WEEK" | "THIS_MONTH" | "ALL_TIME">("THIS_MONTH");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    async function loadAnalyticsData() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();

      if (!isConfigured || !db) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        const uid = auth?.currentUser?.uid || (typeof document !== "undefined" && document.cookie.match(/slotora_session=([^;]+)/)?.[1]);
        if (uid) {
          let bId = "";
          const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
          if (!busSnap.empty) {
            bId = busSnap.docs[0].id;
            setBusiness({ id: busSnap.docs[0].id, ...busSnap.docs[0].data() } as Business);
          } else {
            setBusiness(null);
            setAppointments([]);
            setLoading(false);
            return;
          }

          if (bId) {
            const apptsSnap = await getDocs(query(collection(db, "appointments"), where("business_id", "==", bId)));
            const apptsList = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
            setAppointments(apptsList);
          }
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, []);

  // Helper to extract fee
  const getApptPrice = (a: any) => {
    return Number(a.service_price) || Number(a.price) || Number(a.service?.price) || 0;
  };

  // Helper to compute date range boundaries in local time
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Filtered Appointments by Date Range
  const filteredAppointments = useMemo(() => {
    if (dateRange === "ALL_TIME") return appointments;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (dateRange === "THIS_MONTH") {
      return appointments.filter((a) => {
        if (!a.appointment_date) return false;
        const [y, m] = a.appointment_date.split("-").map(Number);
        return y === currentYear && m === currentMonth + 1;
      });
    }

    if (dateRange === "THIS_WEEK") {
      // Find Monday of current week
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
      const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMon);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const monStr = monday.toISOString().split("T")[0];
      const sunStr = sunday.toISOString().split("T")[0];

      return appointments.filter((a) => {
        if (!a.appointment_date) return false;
        return a.appointment_date >= monStr && a.appointment_date <= sunStr;
      });
    }

    return appointments;
  }, [appointments, dateRange]);

  // Real Metric Calculations based on production rules
  const totalBookings = filteredAppointments.length;

  const todayAppointmentsCount = filteredAppointments.filter(
    (a) => a.appointment_date === todayStr
  ).length;

  const uniqueClientsCount = new Set(
    filteredAppointments
      .map((a) => a.customer_id || a.customer?.phone || (a as any).customer_phone)
      .filter(Boolean)
  ).size;

  // Active eligible appointments (exclude cancelled)
  const eligibleAppointments = filteredAppointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CONFIRMED"
  );

  const bookedServiceValue = eligibleAppointments.reduce(
    (acc, curr) => acc + getApptPrice(curr),
    0
  );

  const averageBookingValue = eligibleAppointments.length > 0
    ? Math.round(bookedServiceValue / eligibleAppointments.length)
    : 0;

  // Finalized appointments for completion and no-show rates
  const completedCount = filteredAppointments.filter((a) => a.status === "COMPLETED").length;
  const noShowCount = filteredAppointments.filter((a) => a.status === "NO_SHOW").length;
  const cancelledCount = filteredAppointments.filter((a) => a.status === "CANCELLED").length;
  const finalizedCount = completedCount + noShowCount + cancelledCount;

  const completionRate = finalizedCount > 0
    ? ((completedCount / finalizedCount) * 100).toFixed(1)
    : eligibleAppointments.length > 0
    ? "100.0"
    : "0.0";

  const noShowRate = finalizedCount > 0
    ? ((noShowCount / finalizedCount) * 100).toFixed(1)
    : "0.0";

  // Real Weekly / Day-by-Day Trends Data
  const trendChartData = useMemo(() => {
    // Generate 7 days for current week or group appointments
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // Find Monday of the active window
    const dayOfWeek = now.getDay();
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);

    const weekDays: { day: string; dateStr: string; bookings: number; value: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split("T")[0];
      weekDays.push({
        day: dayNames[i],
        dateStr: dStr,
        bookings: 0,
        value: 0,
      });
    }

    filteredAppointments.forEach((a) => {
      if (!a.appointment_date) return;
      const found = weekDays.find((wd) => wd.dateStr === a.appointment_date);
      if (found) {
        found.bookings += 1;
        if (a.status !== "CANCELLED") {
          found.value += getApptPrice(a);
        }
      }
    });

    return weekDays;
  }, [filteredAppointments]);

  // Real Service Breakdown Distribution
  const serviceDistribution = useMemo(() => {
    const counts: { [serviceName: string]: number } = {};
    filteredAppointments.forEach((a) => {
      const name = a.service?.name || (a as any).service_name || "Standard Appointment";
      counts[name] = (counts[name] || 0) + 1;
    });

    const palette = ["#E75A32", "#171717", "#3159D9", "#8EBE28", "#77736D", "#B388FF"];
    const result = Object.entries(counts).map(([name, count], idx) => ({
      name,
      value: count,
      color: palette[idx % palette.length],
    }));

    return result;
  }, [filteredAppointments]);

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Performance & Analytics
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                Live Ledger
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Database-backed mathematical metrics and booking volumes
            </p>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DCD8CF] text-xs font-mono">
            <button
              onClick={() => setDateRange("THIS_WEEK")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === "THIS_WEEK" 
                  ? "bg-[#171717] text-[#F5F0E6] font-bold shadow-xs" 
                  : "text-[#77736D] hover:text-[#171717]"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === "THIS_MONTH" 
                  ? "bg-[#171717] text-[#F5F0E6] font-bold shadow-xs" 
                  : "text-[#77736D] hover:text-[#171717]"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange("ALL_TIME")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === "ALL_TIME" 
                  ? "bg-[#171717] text-[#F5F0E6] font-bold shadow-xs" 
                  : "text-[#77736D] hover:text-[#171717]"
              }`}
            >
              All Time
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#E75A32] mx-auto" />
              <p className="text-xs font-mono text-[#77736D]">Calculating real-time analytics from database records...</p>
            </div>
          ) : (
            <>
              {/* Top KPI Cards (No Fabricated Metrics) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Booked Service Value */}
                <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                    Booked Service Value
                  </span>
                  <div className="mt-2 text-2xl font-display font-bold text-[#171717]">
                    ₹{bookedServiceValue.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-[11px] font-sans text-[#77736D]">
                    {eligibleAppointments.length} eligible bookings ({dateRange === "THIS_WEEK" ? "this week" : dateRange === "THIS_MONTH" ? "this month" : "all time"})
                  </div>
                </div>

                {/* Total Appointments */}
                <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                    Total Bookings
                  </span>
                  <div className="mt-2 text-2xl font-display font-bold text-[#171717]">
                    {totalBookings}
                  </div>
                  <div className="mt-1 flex items-center text-[11px] font-mono font-bold text-[#171717]">
                    <span className="px-1.5 py-0.2 rounded bg-[#C8E56A]/30 text-[#171717] mr-1.5 border border-[#C8E56A]">
                      {completionRate}%
                    </span>
                    <span>completion rate</span>
                  </div>
                </div>

                {/* Unique Clients */}
                <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                    Unique Clients
                  </span>
                  <div className="mt-2 text-2xl font-display font-bold text-[#171717]">
                    {uniqueClientsCount}
                  </div>
                  <div className="mt-1 text-[11px] font-sans text-[#77736D]">
                    Distinct customer profiles booked
                  </div>
                </div>

                {/* Average Booking Value */}
                <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                    Avg Booking Value
                  </span>
                  <div className="mt-2 text-2xl font-display font-bold text-[#171717]">
                    ₹{averageBookingValue.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-[#77736D]">
                    {noShowRate}% no-show rate
                  </div>
                </div>

              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Real Weekly Booking Trends Chart */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#DCD8CF] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-display font-bold text-[#171717]">Weekly Booking Trends</h3>
                      <p className="text-xs font-sans text-[#77736D]">Actual appointments scheduled per day</p>
                    </div>
                    {totalBookings > 0 && (
                      <div className="text-xs font-mono font-bold text-[#171717] bg-[#F5F0E6] px-2.5 py-1 rounded-lg border border-[#DCD8CF]">
                        {totalBookings} Total Recorded
                      </div>
                    )}
                  </div>

                  {totalBookings === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#DCD8CF] rounded-xl bg-[#FAF7F2] text-center p-6 space-y-2">
                      <CalendarIcon className="w-8 h-8 text-[#A39E93]" />
                      <p className="text-xs font-mono font-bold text-[#171717]">No booking activity recorded for this period</p>
                      <p className="text-[11px] font-sans text-[#77736D] max-w-xs">
                        As customers book appointments through your public booking link, real daily trends will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2D9C6" />
                          <XAxis dataKey="day" stroke="#77736D" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} stroke="#77736D" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#171717", 
                              border: "1px solid #333333", 
                              borderRadius: "10px", 
                              color: "#F5F0E6", 
                              fontSize: "12px",
                              fontFamily: "var(--font-mono, monospace)"
                            }} 
                            formatter={(value: any, name: string) => [
                              name === "bookings" ? `${value} Bookings` : `₹${Number(value).toLocaleString("en-IN")}`,
                              name === "bookings" ? "Count" : "Booked Value"
                            ]}
                          />
                          <Bar dataKey="bookings" fill="#E75A32" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Real Service Distribution Chart */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#DCD8CF] shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-display font-bold text-[#171717]">Service Breakdown</h3>
                    <p className="text-xs font-sans text-[#77736D]">Appointments by booked service</p>
                  </div>

                  {serviceDistribution.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#DCD8CF] rounded-xl bg-[#FAF7F2] text-center p-4">
                      <p className="text-xs font-mono text-[#77736D]">No service booking distribution yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={serviceDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {serviceDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "#171717", 
                                border: "1px solid #333333", 
                                borderRadius: "10px", 
                                color: "#F5F0E6", 
                                fontSize: "11px",
                                fontFamily: "var(--font-mono, monospace)"
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#DCD8CF]/60">
                        {serviceDistribution.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-[#171717] font-sans truncate">{item.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[#171717] ml-2 shrink-0">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
