"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarCheck2,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Loader2,
  Sparkles,
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
  Cell,
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
        const uid =
          auth?.currentUser?.uid ||
          (typeof document !== "undefined" &&
            (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
              document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

        if (uid) {
          let bId = "";
          let busSnap = await getDocs(
            query(collection(db, "businesses"), where("owner_id", "==", uid))
          );
          if (busSnap.empty && auth?.currentUser?.email) {
            busSnap = await getDocs(
              query(collection(db, "businesses"), where("owner_email", "==", auth.currentUser.email.toLowerCase()))
            );
          }

          if (!busSnap.empty) {
            bId = busSnap.docs[0].id;
            setBusiness({ id: busSnap.docs[0].id, ...busSnap.docs[0].data() } as Business);
          } else {
            // Strict Privacy: Do not leak another user's revenue analytics
            setBusiness(null);
            setAppointments([]);
            setLoading(false);
            return;
          }

          if (bId) {
            const apptsSnap = await getDocs(
              query(collection(db, "appointments"), where("business_id", "==", bId))
            );
            const list = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
            setAppointments(list);
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

  const getApptPrice = (a: any) => {
    return Number(a.service_price) || Number(a.price) || 0;
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Filter appointments by selected date range
  const filteredAppointments = useMemo(() => {
    if (dateRange === "ALL_TIME") return appointments;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (dateRange === "THIS_MONTH") {
      return appointments.filter((a) => {
        if (!a.appointment_date) return false;
        const [y, m] = a.appointment_date.split("-").map(Number);
        return y === currentYear && m === currentMonth + 1;
      });
    }

    if (dateRange === "THIS_WEEK") {
      const dayOfWeek = now.getDay();
      const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split("T")[0];
      const sunStr = sunday.toISOString().split("T")[0];

      return appointments.filter((a) => {
        if (!a.appointment_date) return false;
        return a.appointment_date >= monStr && a.appointment_date <= sunStr;
      });
    }

    return appointments;
  }, [appointments, dateRange]);

  // Real calculations
  const totalBookings = filteredAppointments.length;
  const todayAppointmentsCount = filteredAppointments.filter(
    (a) => a.appointment_date === todayStr
  ).length;

  const uniqueClientsCount = new Set(
    filteredAppointments
      .map((a) => a.customer_id || a.customer?.phone || (a as any).customer_phone || a.customer_name)
      .filter(Boolean)
  ).size;

  const eligibleAppointments = filteredAppointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CONFIRMED"
  );

  const bookedServiceValue = eligibleAppointments.reduce(
    (acc, curr) => acc + getApptPrice(curr),
    0
  );

  const averageBookingValue =
    eligibleAppointments.length > 0
      ? Math.round(bookedServiceValue / eligibleAppointments.length)
      : 0;

  const completedCount = filteredAppointments.filter((a) => a.status === "COMPLETED").length;
  const noShowCount = filteredAppointments.filter((a) => a.status === "NO_SHOW").length;
  const cancelledCount = filteredAppointments.filter((a) => a.status === "CANCELLED").length;
  const finalizedCount = completedCount + noShowCount + cancelledCount;

  const completionRate =
    finalizedCount > 0
      ? ((completedCount / finalizedCount) * 100).toFixed(1)
      : eligibleAppointments.length > 0
      ? "100.0"
      : "0.0";

  const noShowRate =
    finalizedCount > 0 ? ((noShowCount / finalizedCount) * 100).toFixed(1) : "0.0";

  // Trend chart data (7 days of current week)
  const trendChartData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

  // Service distribution
  const serviceDistribution = useMemo(() => {
    const counts: { [name: string]: number } = {};
    filteredAppointments.forEach((a) => {
      const name = a.service_name || "Standard Service";
      counts[name] = (counts[name] || 0) + 1;
    });

    const colors = ["#0B132B", "#D4AF37", "#FF7A00", "#10B981", "#6366F1", "#EC4899"];
    return Object.keys(counts).map((name, i) => ({
      name,
      value: counts[name],
      color: colors[i % colors.length],
    }));
  }, [filteredAppointments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-600">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Computing real database metrics from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            100% Firestore verified metrics • Zero mock or simulated numbers
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-navy-200 shadow-sm self-start md:self-auto">
          {(["THIS_WEEK", "THIS_MONTH", "ALL_TIME"] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setDateRange(cycle)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                dateRange === cycle
                  ? "bg-navy-950 text-gold-400 shadow-sm"
                  : "text-navy-600 hover:text-navy-950 hover:bg-navy-50"
              }`}
            >
              {cycle.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>Total Bookings</span>
            <CalendarCheck2 className="w-4 h-4 text-navy-700" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-navy-950">
            {totalBookings}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Actual count of database records
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>Booked Service Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-navy-950">
            ₹{bookedServiceValue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Sum of confirmed & completed appointments
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>Unique Clients</span>
            <Users className="w-4 h-4 text-gold-600" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-navy-950">
            {uniqueClientsCount}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Distinct verified customers in period
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>Average Booking Value</span>
            <IndianRupee className="w-4 h-4 text-navy-700" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-navy-950">
            ₹{averageBookingValue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            Value per active client appointment
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-emerald-700">
            {completionRate}%
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            {completedCount} of {finalizedCount || eligibleAppointments.length} finalized
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-navy-500">
            <span>No-Show Rate</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display text-3xl sm:text-4xl font-black text-amber-700">
            {noShowRate}%
          </div>
          <p className="text-[11px] text-navy-400 font-mono">
            {noShowCount} client no-show flags
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-100">
            <div>
              <h3 className="font-display text-lg font-black uppercase text-navy-950">
                Weekly Booking Volume Distribution
              </h3>
              <p className="text-xs text-navy-500">
                Live appointments grouped by day of week
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-navy-700 bg-navy-50 px-3 py-1 rounded-full">
              7-Day Dynamic Window
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B132B",
                    color: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #D4AF37",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="bookings" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution Pie (4 cols) */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-navy-100">
              <h3 className="font-display text-lg font-black uppercase text-navy-950">
                Service Breakdown
              </h3>
              <p className="text-xs text-navy-500">
                Distribution across catalog offerings
              </p>
            </div>

            {serviceDistribution.length === 0 ? (
              <div className="py-12 text-center text-navy-400 text-xs">
                No bookings recorded in this date range.
              </div>
            ) : (
              <>
                <div className="h-44 w-full my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {serviceDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-navy-900 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-navy-950 shrink-0">
                        {item.value} apts
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
