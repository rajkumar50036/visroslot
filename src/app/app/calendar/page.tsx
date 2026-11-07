"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  Loader2,
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Filter,
  X,
  AlertCircle,
  Edit2,
  Save,
  Check,
  UserX,
  Ban,
  ArrowRight,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Appointment, Business, Staff, Service } from "@/types/database";

export default function CalendarMatrixPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // View mode: "day" | "week" | "month"
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");

  // Selected date anchor
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Filters
  const [selectedStaffFilter, setSelectedStaffFilter] = useState("ALL");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Detail Modal State
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Reschedule Sub-Modal
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleStaffId, setRescheduleStaffId] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Manual New Booking Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    serviceId: "",
    staffId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "10:30",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Load business & data
  const loadCalendarData = async () => {
    setLoading(true);
    const { auth, db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }

    try {
      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

      if (!uid) {
        setLoading(false);
        return;
      }

      let busSnap = await getDocs(
        query(collection(db, "businesses"), where("owner_id", "==", uid))
      );
      if (busSnap.empty && auth?.currentUser?.email) {
        busSnap = await getDocs(
          query(collection(db, "businesses"), where("owner_email", "==", auth.currentUser.email.toLowerCase()))
        );
      }

      if (busSnap.empty) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const activeBusDoc = busSnap.docs[0];
      const activeBusId = activeBusDoc.id;
      setBusiness({ id: activeBusId, ...activeBusDoc.data() } as Business);

      const [apptsSnap, staffSnap, srvSnap] = await Promise.all([
        getDocs(query(collection(db, "appointments"), where("business_id", "==", activeBusId))),
        getDocs(query(collection(db, "staff"), where("business_id", "==", activeBusId))),
        getDocs(query(collection(db, "services"), where("business_id", "==", activeBusId))),
      ]);

      const appts = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
      setAppointments(appts);

      const staffs = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Staff[];
      setStaffList(staffs);

      const srvs = srvSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[];
      setServicesList(srvs);

      if (srvs.length > 0 && !manualForm.serviceId) {
        setManualForm((prev) => ({ ...prev, serviceId: srvs[0].id }));
      }
    } catch (e) {
      console.error("Calendar fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (selectedStatusFilter !== "ALL" && a.status !== selectedStatusFilter) return false;
      if (selectedStaffFilter !== "ALL" && a.staff_id !== selectedStaffFilter) return false;
      if (selectedServiceFilter !== "ALL" && a.service_id !== selectedServiceFilter) return false;
      return true;
    });
  }, [appointments, selectedStatusFilter, selectedStaffFilter, selectedServiceFilter]);

  // Date Navigation
  const navigateDate = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + delta);
      setSelectedDateStr(d.toISOString().split("T")[0]);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + delta * 7);
      setSelectedDateStr(d.toISOString().split("T")[0]);
    } else {
      d.setMonth(d.getMonth() + delta);
    }
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  // Status Action Handler via Backend API
  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/appointment/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status_update", status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Update failed");

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus as any } : a))
      );
      if (activeAppt && activeAppt.id === appointmentId) {
        setActiveAppt({ ...activeAppt, status: newStatus as any });
      }
      setActionFeedback({ type: "success", msg: `Status marked as ${newStatus}` });
      setTimeout(() => setActionFeedback(null), 2500);
    } catch (err: any) {
      setActionFeedback({ type: "error", msg: err.message || "Failed to update status" });
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule Submit via Backend API
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppt) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/appointment/${activeAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate: rescheduleDate,
          newStartTime: rescheduleStart,
          newEndTime: rescheduleEnd,
          staffId: rescheduleStaffId || activeAppt.staff_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Reschedule failed");

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === activeAppt.id
            ? {
                ...a,
                appointment_date: rescheduleDate,
                start_time: rescheduleStart,
                end_time: rescheduleEnd,
                status: "CONFIRMED" as const,
              }
            : a
        )
      );

      setActiveAppt((prev) =>
        prev
          ? {
              ...prev,
              appointment_date: rescheduleDate,
              start_time: rescheduleStart,
              end_time: rescheduleEnd,
              status: "CONFIRMED",
            }
          : null
      );

      setActionFeedback({ type: "success", msg: "Appointment rescheduled successfully!" });
      setIsRescheduling(false);
      setTimeout(() => setActionFeedback(null), 2500);
    } catch (err: any) {
      setActionFeedback({ type: "error", msg: err.message || "Could not reschedule appointment" });
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Booking Submit
  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setManualSubmitting(true);
    setManualError(null);

    try {
      const res = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: manualForm.serviceId,
          staffId: manualForm.staffId || undefined,
          appointmentDate: manualForm.date,
          startTime: manualForm.startTime,
          endTime: manualForm.endTime,
          customerName: manualForm.customerName.trim(),
          customerPhone: manualForm.customerPhone.trim(),
          customerEmail: manualForm.customerEmail.trim() || undefined,
          customerNotes: manualForm.notes.trim() || undefined,
          status: "CONFIRMED",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to schedule appointment");

      setShowManualModal(false);
      await loadCalendarData();
    } catch (err: any) {
      setManualError(err.message || "Failed to create appointment");
    } finally {
      setManualSubmitting(false);
    }
  };

  // Month View calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Week View calculations
  const currentWeekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(curr.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split("T")[0];
      return { date: d, dateStr: str, dayName: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] };
    });
  }, [currentDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mb-3" />
        <span className="font-mono text-xs">Loading live calendar matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
              Interactive Scheduling
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Live Sync
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white mt-1">
            Calendar Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredAppointments.length} appointments scheduled • Multi-staff capacity & conflict prevention
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xs">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                  viewMode === mode
                    ? "bg-[#101A2B] text-white dark:bg-[#C49A46] dark:text-[#101A2B] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => navigateDate(-1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-display font-black text-xs sm:text-sm px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl text-slate-900 dark:text-white shadow-xs min-w-[140px] text-center">
            {viewMode === "day"
              ? new Date(selectedDateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : viewMode === "week"
              ? `${currentWeekDays[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${currentWeekDays[6].date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `${monthNames[month]} ${year}`}
          </span>

          {/* New Appointment Button */}
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#C49A46] hover:bg-[#D9B66E] text-white text-xs font-mono font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Staff Filter */}
        <select
          value={selectedStaffFilter}
          onChange={(e) => setSelectedStaffFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white focus:outline-none focus:border-[#C49A46]"
        >
          <option value="ALL">All Staff Members ({staffList.length})</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role_title || "Staff"})
            </option>
          ))}
        </select>

        {/* Service Filter */}
        <select
          value={selectedServiceFilter}
          onChange={(e) => setSelectedServiceFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white focus:outline-none focus:border-[#C49A46]"
        >
          <option value="ALL">All Services ({servicesList.length})</option>
          {servicesList.map((srv) => (
            <option key={srv.id} value={srv.id}>
              {srv.name} (₹{srv.price})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white focus:outline-none focus:border-[#C49A46]"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No-Show</option>
        </select>
      </div>

      {/* VIEW: MONTH */}
      {viewMode === "month" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 p-3 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono text-[10px] sm:text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-navy-800">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/50 dark:bg-navy-950/40 border border-transparent" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayAppts = filteredAppointments.filter((a) => a.appointment_date === dateStr);
                const isSelected = selectedDateStr === dateStr;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-[#101A2B] bg-[#101A2B] text-white shadow-md ring-2 ring-[#C49A46]"
                        : "border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-[#C49A46] text-slate-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-mono ${isSelected ? "text-[#C49A46]" : ""}`}>
                        {dayNum}
                      </span>
                      {dayAppts.length > 0 && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? "bg-[#C49A46] text-[#101A2B]" : "bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {dayAppts.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden w-full">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAppt(a);
                          }}
                          className={`text-[9px] truncate rounded px-1 py-0.5 font-medium ${
                            isSelected
                              ? "bg-navy-800 text-gold-300"
                              : a.status === "COMPLETED"
                              ? "bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300"
                              : a.status === "CANCELLED"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 line-through"
                              : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {a.start_time?.slice(0, 5)} {a.customer_name}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-[9px] font-mono opacity-70">+{dayAppts.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Roster (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-navy-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                DAY ROSTER
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {new Date(selectedDateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </h3>
            </div>

            {filteredAppointments.filter((a) => a.appointment_date === selectedDateStr).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No bookings on this day.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredAppointments
                  .filter((a) => a.appointment_date === selectedDateStr)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setActiveAppt(apt)}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 hover:border-[#C49A46] cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {apt.customer_name || "Guest"}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-[#C49A46]">
                          ₹{apt.service_price}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {apt.service_name} • {apt.staff_name || "Specialist"}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-navy-800">
                        <span>{apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          apt.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : apt.status === "COMPLETED"
                            ? "bg-slate-200 text-slate-800"
                            : apt.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: WEEK */}
      {viewMode === "week" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm overflow-x-auto">
          <div className="min-w-[700px] grid grid-cols-7 gap-3">
            {currentWeekDays.map(({ date, dateStr, dayName }) => {
              const dayAppts = filteredAppointments.filter((a) => a.appointment_date === dateStr);
              const isToday = new Date().toISOString().split("T")[0] === dateStr;

              return (
                <div key={dateStr} className="space-y-3">
                  <div className={`p-2.5 rounded-2xl text-center border ${
                    isToday
                      ? "bg-[#101A2B] text-white border-[#101A2B] dark:bg-[#C49A46] dark:text-[#101A2B]"
                      : "bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800"
                  }`}>
                    <div className="text-[10px] font-mono uppercase font-bold">{dayName}</div>
                    <div className="text-base font-display font-black">{date.getDate()}</div>
                    <div className="text-[10px] font-mono opacity-80">{dayAppts.length} appts</div>
                  </div>

                  <div className="space-y-2">
                    {dayAppts.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setActiveAppt(apt)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 hover:border-[#C49A46] cursor-pointer text-xs space-y-1 transition-all"
                      >
                        <div className="font-mono text-[10px] font-bold text-[#C49A46]">
                          {apt.start_time?.slice(0, 5)}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {apt.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{apt.service_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{apt.staff_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DAY */}
      {viewMode === "day" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Hourly Schedule for {new Date(selectedDateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {filteredAppointments.filter((a) => a.appointment_date === selectedDateStr).length} bookings
            </span>
          </div>

          <div className="space-y-2">
            {Array.from({ length: 13 }).map((_, i) => {
              const hour = 8 + i;
              const hourStr = `${String(hour).padStart(2, "0")}:00`;
              const hourEndStr = `${String(hour + 1).padStart(2, "0")}:00`;
              const matchingAppts = filteredAppointments.filter((a) => {
                if (a.appointment_date !== selectedDateStr) return false;
                const startH = parseInt((a.start_time || "00").split(":")[0], 10);
                return startH === hour;
              });

              return (
                <div key={hour} className="flex items-start gap-4 p-2 rounded-xl hover:bg-slate-50/50 dark:hover:bg-navy-950/40 border-b border-slate-100 dark:border-navy-800/60">
                  <span className="w-16 text-xs font-mono font-bold text-slate-400 shrink-0 mt-1">
                    {hour % 12 || 12}:00 {hour >= 12 ? "PM" : "AM"}
                  </span>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {matchingAppts.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setActiveAppt(apt)}
                        className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 hover:border-[#C49A46] cursor-pointer shadow-xs transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {apt.customer_name}
                          </span>
                          <span className="text-[10px] font-mono text-[#C49A46] font-bold">
                            {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          {apt.service_name} • {apt.staff_name || "Specialist"}
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="font-mono text-slate-400">₹{apt.service_price}</span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAIL POPUP MODAL */}
      {activeAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                  APPOINTMENT DETAILS
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeAppt.customer_name || "Guest Client"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveAppt(null);
                  setIsRescheduling(false);
                  setActionFeedback(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionFeedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                actionFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200"
              }`}>
                {actionFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{actionFeedback.msg}</span>
              </div>
            )}

            {/* Read Details */}
            {!isRescheduling ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                    <span className="text-slate-400">Reference ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{activeAppt.booking_reference || activeAppt.id}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                    <span className="text-slate-400">Service</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{activeAppt.service_name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                    <span className="text-slate-400">Specialist</span>
                    <span className="font-semibold text-[#C49A46]">{activeAppt.staff_name || "Any Specialist"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                    <span className="text-slate-400">Date & Time</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {activeAppt.appointment_date} at {activeAppt.start_time?.slice(0, 5)} - {activeAppt.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                    <span className="text-slate-400">Customer Phone</span>
                    <a href={`tel:${activeAppt.customer_phone}`} className="font-semibold text-[#C49A46] hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {activeAppt.customer_phone || "Not provided"}
                    </a>
                  </div>
                  {activeAppt.customer_email && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                      <span className="text-slate-400">Customer Email</span>
                      <a href={`mailto:${activeAppt.customer_email}`} className="text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {activeAppt.customer_email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Price / Service Fee</span>
                    <span className="font-display font-black text-sm text-[#C49A46]">
                      ₹{Number(activeAppt.service_price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {activeAppt.customer_notes && (
                  <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-navy-950 text-xs text-slate-600 dark:text-slate-300">
                    <strong>Client Note:</strong> {activeAppt.customer_notes}
                  </div>
                )}

                {/* Status Transition Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400 block">
                    Update Appointment Status
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeAppt.status !== "COMPLETED" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeAppt.id, "COMPLETED")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}

                    {activeAppt.status !== "CONFIRMED" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeAppt.id, "CONFIRMED")}
                        className="px-3.5 py-2 rounded-xl bg-[#101A2B] hover:bg-slate-800 text-white text-xs font-mono font-bold transition-colors"
                      >
                        Confirm
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRescheduleDate(activeAppt.appointment_date);
                        setRescheduleStart(activeAppt.start_time?.slice(0, 5) || "10:00");
                        setRescheduleEnd(activeAppt.end_time?.slice(0, 5) || "10:30");
                        setRescheduleStaffId(activeAppt.staff_id || "");
                        setIsRescheduling(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-mono font-bold transition-colors"
                    >
                      Reschedule
                    </button>

                    {activeAppt.status === "CONFIRMED" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeAppt.id, "NO_SHOW")}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-mono font-bold transition-colors"
                      >
                        No-Show
                      </button>
                    )}

                    {activeAppt.status !== "CANCELLED" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeAppt.id, "CANCELLED")}
                        className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-mono font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Reschedule Form View */
              <form onSubmit={handleSaveReschedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleStart}
                      onChange={(e) => {
                        const start = e.target.value;
                        setRescheduleStart(start);
                        const [h, m] = start.split(":").map(Number);
                        if (!isNaN(h) && !isNaN(m)) {
                          const total = h * 60 + m + 30;
                          const endH = String(Math.floor(total / 60) % 24).padStart(2, "0");
                          const endM = String(total % 60).padStart(2, "0");
                          setRescheduleEnd(`${endH}:${endM}`);
                        }
                      }}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleEnd}
                      onChange={(e) => setRescheduleEnd(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Specialist
                  </label>
                  <select
                    value={rescheduleStaffId}
                    onChange={(e) => setRescheduleStaffId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  >
                    <option value="">Keep current specialist</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role_title || "Specialist"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#C49A46] text-white hover:bg-[#D9B66E] flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Reschedule</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MANUAL WALK-IN / PHONE BOOKING MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                  WALK-IN / PHONE RESERVATION
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Schedule New Appointment
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setManualError(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={manualForm.customerEmail}
                    onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service *
                  </label>
                  <select
                    required
                    value={manualForm.serviceId}
                    onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  >
                    {servicesList.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} (₹{srv.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Specialist
                  </label>
                  <select
                    value={manualForm.staffId}
                    onChange={(e) => setManualForm({ ...manualForm, staffId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  >
                    <option value="">Any Available Specialist</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualForm.startTime}
                    onChange={(e) => {
                      const st = e.target.value;
                      setManualForm((prev) => {
                        const [h, m] = st.split(":").map(Number);
                        if (!isNaN(h) && !isNaN(m)) {
                          const total = h * 60 + m + 30;
                          const endH = String(Math.floor(total / 60) % 24).padStart(2, "0");
                          const endM = String(total % 60).padStart(2, "0");
                          return { ...prev, startTime: st, endTime: `${endH}:${endM}` };
                        }
                        return { ...prev, startTime: st };
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualForm.endTime}
                    onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Preferences, requests, or walk-in instructions..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#101A2B] text-white hover:bg-slate-800 dark:bg-white dark:text-[#101A2B] flex items-center gap-1.5"
                >
                  {manualSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
