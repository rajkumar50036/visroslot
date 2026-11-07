"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Loader2,
  ExternalLink,
  UserX,
  FileText,
  Download,
  Calendar,
  Edit2,
  X,
  Save,
  AlertCircle,
  Plus,
  Eye,
  Check,
  Ban,
  ArrowRight,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Appointment, Business, Staff, Service } from "@/types/database";
import { BookingAlarmManager } from "@/components/dashboard/BookingAlarmManager";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "PAST">("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  // View Details Modal
  const [viewingAppt, setViewingAppt] = useState<Appointment | null>(null);

  // Edit / Reschedule Modal
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editStaffId, setEditStaffId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  // Cancel Confirmation Modal
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const loadAppointmentsData = async () => {
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
        setBusiness(null);
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

      const list = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
      list.sort((a, b) => {
        const dateDiff = (b.appointment_date || "").localeCompare(a.appointment_date || "");
        if (dateDiff !== 0) return dateDiff;
        return (b.start_time || "").localeCompare(a.start_time || "");
      });
      setAppointments(list);

      const staffs = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Staff[];
      setStaffList(staffs);

      const srvs = srvSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[];
      setServicesList(srvs);

      if (srvs.length > 0 && !manualForm.serviceId) {
        setManualForm((prev) => ({ ...prev, serviceId: srvs[0].id }));
      }
    } catch (e) {
      console.error("Error fetching appointments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointmentsData();
  }, []);

  // Update Status via Backend API
  const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status_update",
          status: newStatus,
          cancellationReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update status");

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
      );

      if (viewingAppt && viewingAppt.id === id) {
        setViewingAppt({ ...viewingAppt, status: newStatus as any });
      }
    } catch (e: any) {
      alert(`Error updating status: ${e.message}`);
    }
  };

  // Open Reschedule Modal
  const handleOpenEdit = (apt: Appointment) => {
    setEditingAppt(apt);
    setEditDate(apt.appointment_date || new Date().toISOString().split("T")[0]);
    const start = (apt.start_time || "09:00:00").slice(0, 5);
    const end = (apt.end_time || "09:30:00").slice(0, 5);
    setEditStartTime(start);
    setEditEndTime(end);
    setEditStaffId(apt.staff_id || "");
    setEditFeedback(null);
  };

  // Save Reschedule
  const handleSaveDateTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;

    setSavingEdit(true);
    setEditFeedback(null);

    try {
      const formattedStart = editStartTime.length === 5 ? `${editStartTime}:00` : editStartTime;
      const formattedEnd = editEndTime.length === 5 ? `${editEndTime}:00` : editEndTime;

      const res = await fetch(`/api/appointment/${editingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate: editDate,
          newStartTime: formattedStart,
          newEndTime: formattedEnd,
          staffId: editStaffId || editingAppt.staff_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Reschedule failed");

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingAppt.id
            ? {
                ...a,
                appointment_date: editDate,
                start_time: formattedStart,
                end_time: formattedEnd,
                status: "CONFIRMED" as const,
              }
            : a
        )
      );

      setEditFeedback({
        type: "success",
        message: `Appointment rescheduled to ${editDate} at ${editStartTime} successfully.`,
      });

      setTimeout(() => {
        setEditingAppt(null);
        setEditFeedback(null);
      }, 1200);
    } catch (err: any) {
      setEditFeedback({ type: "error", message: err.message || "Failed to reschedule appointment." });
    } finally {
      setSavingEdit(false);
    }
  };

  // Manual Walk-in / Phone Reservation Submit
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
      await loadAppointmentsData();
    } catch (err: any) {
      setManualError(err.message || "Failed to create appointment");
    } finally {
      setManualSubmitting(false);
    }
  };

  // Cancel Appointment Submit
  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setCancellingLoading(true);
    try {
      await handleUpdateStatus(cancellingAppt.id, "CANCELLED", cancelReason.trim() || "Cancelled by business owner");
      setCancellingAppt(null);
      setCancelReason("");
    } finally {
      setCancellingLoading(false);
    }
  };

  // Filtered Appointments
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Status
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;

      // Staff
      if (staffFilter !== "ALL" && a.staff_id !== staffFilter) return false;

      // Service
      if (serviceFilter !== "ALL" && a.service_id !== serviceFilter) return false;

      // Date Range
      if (dateFilter === "TODAY" && a.appointment_date !== todayStr) return false;
      if (dateFilter === "UPCOMING" && (a.appointment_date || "") < todayStr) return false;
      if (dateFilter === "PAST" && (a.appointment_date || "") >= todayStr) return false;

      // Text search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          (a.customer_name || "").toLowerCase().includes(q) ||
          (a.customer_phone || "").includes(q) ||
          (a.customer_email || "").toLowerCase().includes(q) ||
          (a.service_name || "").toLowerCase().includes(q) ||
          (a.booking_reference || "").toLowerCase().includes(q) ||
          (a.staff_name || "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, staffFilter, serviceFilter, dateFilter, searchQuery, todayStr]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mb-3" />
        <span className="font-mono text-xs">Loading live appointment records from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
              Real-Time Booking Management
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Multi-Staff Active
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white mt-1">
            Appointments Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {appointments.length} total recorded bookings • {appointments.filter((a) => a.appointment_date === todayStr && a.status !== "CANCELLED").length} scheduled for today
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Real-time Web Audio API Booking Chime & Alarm */}
          <BookingAlarmManager businessId={business?.id} userId={business?.owner_id} />

          {/* New Booking Modal Trigger */}
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#C49A46] hover:bg-[#D9B66E] text-white text-xs font-mono font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>

          <Link
            href={business?.slug ? `/book/${business.slug}` : "/app/settings"}
            target={business?.slug ? "_blank" : "_self"}
            className="px-4 py-2.5 rounded-2xl bg-[#101A2B] hover:bg-slate-800 text-white dark:bg-white dark:text-[#101A2B] text-xs font-mono font-bold shadow-xs flex items-center gap-1.5"
          >
            <span>Public Booking Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 overflow-x-auto shadow-xs">
            {["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? "bg-[#101A2B] text-white dark:bg-[#C49A46] dark:text-[#101A2B] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {s.replace("_", " ")}
                <span className="ml-1 opacity-70 text-[10px]">
                  (
                  {s === "ALL"
                    ? appointments.length
                    : appointments.filter((a) => a.status === s).length}
                  )
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client, phone, service, or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46] shadow-xs"
            />
          </div>
        </div>

        {/* Secondary Filter Row: Date Range, Staff, Service */}
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs shadow-xs">
          <div className="flex items-center gap-1 text-slate-500 font-mono font-bold mr-1">
            <Filter className="w-3.5 h-3.5 text-[#C49A46]" />
            <span>Filter By:</span>
          </div>

          {/* Date Range Selector */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-navy-950 font-mono text-[11px] font-bold">
            {(["ALL", "TODAY", "UPCOMING", "PAST"] as const).map((dr) => (
              <button
                key={dr}
                onClick={() => setDateFilter(dr)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dateFilter === dr
                    ? "bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {dr === "ALL" ? "All Dates" : dr.charAt(0) + dr.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Staff Filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white focus:outline-none focus:border-[#C49A46]"
          >
            <option value="ALL">All Specialists ({staffList.length})</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.role_title || "Staff"})
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white focus:outline-none focus:border-[#C49A46]"
          >
            <option value="ALL">All Services ({servicesList.length})</option>
            {servicesList.map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name} (₹{srv.price})
              </option>
            ))}
          </select>

          {(statusFilter !== "ALL" || staffFilter !== "ALL" || serviceFilter !== "ALL" || dateFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setStaffFilter("ALL");
                setServiceFilter("ALL");
                setDateFilter("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] font-mono text-[#C49A46] hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CalendarCheck2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No appointments found matching this filter.</p>
            <p className="text-xs">Adjust your search query or reset your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 font-mono text-[11px] uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Client Details</th>
                  <th className="py-3.5 px-6 font-bold">Service & Specialist</th>
                  <th className="py-3.5 px-6 font-bold">Scheduled Time</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-950/40 transition-colors">
                    {/* Client */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{apt.customer_name || "Guest"}</span>
                        {apt.booking_reference && (
                          <span className="font-mono text-[10px] text-slate-400">#{apt.booking_reference}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        {apt.customer_phone && (
                          <a href={`tel:${apt.customer_phone}`} className="hover:underline flex items-center gap-1 text-[#C49A46]">
                            <Phone className="w-3 h-3" /> {apt.customer_phone}
                          </a>
                        )}
                        {apt.customer_email && (
                          <span className="hidden sm:inline-block">({apt.customer_email})</span>
                        )}
                      </div>
                      {(apt.customer_notes || apt.notes) && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                          Note: {apt.customer_notes || apt.notes}
                        </div>
                      )}
                    </td>

                    {/* Service & Staff */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-white">{apt.service_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-[#C49A46]">
                          ₹{Number(apt.service_price || 0).toLocaleString("en-IN")}
                        </span>
                        <span>•</span>
                        <span>{apt.staff_name || "Any Specialist"}</span>
                      </div>
                    </td>

                    {/* Scheduled Time */}
                    <td className="py-4 px-6 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{apt.appointment_date}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          apt.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : apt.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-800 dark:bg-navy-800 dark:text-slate-300"
                            : apt.status === "CANCELLED"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 line-through"
                            : apt.status === "NO_SHOW"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        {/* View Details */}
                        <button
                          onClick={() => setViewingAppt(apt)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300"
                          title="View Full Appointment Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit / Reschedule */}
                        <button
                          onClick={() => handleOpenEdit(apt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1"
                          title="Reschedule Appointment"
                        >
                          <Edit2 className="w-3 h-3 text-[#C49A46]" />
                          <span>Reschedule</span>
                        </button>

                        {/* Quick Confirm */}
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, "CONFIRMED")}
                            className="px-2.5 py-1 rounded-lg bg-[#101A2B] text-white font-bold hover:bg-slate-800 transition-colors"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Quick Complete */}
                        {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}

                        {/* Quick Cancel */}
                        {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                          <button
                            onClick={() => setCancellingAppt(apt)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                  APPOINTMENT DETAILS
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingAppt.customer_name || "Guest Client"}
                </h3>
              </div>
              <button
                onClick={() => setViewingAppt(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                <span className="text-slate-400">Reference</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{viewingAppt.booking_reference || viewingAppt.id}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                <span className="text-slate-400">Service</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingAppt.service_name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                <span className="text-slate-400">Specialist</span>
                <span className="font-semibold text-[#C49A46]">{viewingAppt.staff_name || "Any Specialist"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                <span className="text-slate-400">Date & Time</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {viewingAppt.appointment_date} at {viewingAppt.start_time?.slice(0, 5)} - {viewingAppt.end_time?.slice(0, 5)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                <span className="text-slate-400">Client Phone</span>
                <a href={`tel:${viewingAppt.customer_phone}`} className="font-semibold text-[#C49A46] hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {viewingAppt.customer_phone}
                </a>
              </div>
              {viewingAppt.customer_email && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-navy-800">
                  <span className="text-slate-400">Client Email</span>
                  <a href={`mailto:${viewingAppt.customer_email}`} className="text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {viewingAppt.customer_email}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Service Fee</span>
                <span className="font-display font-black text-sm text-[#C49A46]">
                  ₹{Number(viewingAppt.service_price || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {viewingAppt.customer_notes && (
              <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-navy-950 text-xs text-slate-600 dark:text-slate-300">
                <strong>Client Note:</strong> {viewingAppt.customer_notes}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center gap-2 justify-end">
              {viewingAppt.status !== "COMPLETED" && (
                <button
                  onClick={() => {
                    handleUpdateStatus(viewingAppt.id, "COMPLETED");
                    setViewingAppt(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Mark Completed
                </button>
              )}
              {viewingAppt.status === "CONFIRMED" && (
                <button
                  onClick={() => {
                    handleUpdateStatus(viewingAppt.id, "NO_SHOW");
                    setViewingAppt(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  Mark No-Show
                </button>
              )}
              <button
                onClick={() => {
                  setViewingAppt(null);
                  handleOpenEdit(viewingAppt);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C49A46]">
                  RESCHEDULING & SPECIALIST REASSIGNMENT
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Reschedule Appointment
                </h3>
              </div>
              <button
                onClick={() => setEditingAppt(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  editFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {editFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{editFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveDateTime} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
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
                    value={editStartTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditStartTime(newStart);
                      const [h, m] = newStart.split(":").map(Number);
                      if (!isNaN(h) && !isNaN(m)) {
                        const totalMin = h * 60 + m + 30;
                        const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
                        const endM = String(totalMin % 60).padStart(2, "0");
                        setEditEndTime(`${endH}:${endM}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Specialist
                </label>
                <select
                  value={editStaffId}
                  onChange={(e) => setEditStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
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
                  onClick={() => setEditingAppt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#C49A46] text-white hover:bg-[#D9B66E] flex items-center gap-1.5"
                >
                  {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Cancel Appointment?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel the booking for <strong>{cancellingAppt.customer_name}</strong> on {cancellingAppt.appointment_date} at {cancellingAppt.start_time?.slice(0, 5)}?
            </p>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cancellation Reason (sent to client)
              </label>
              <input
                type="text"
                placeholder="e.g. Specialist unavailable, salon closed..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingAppt(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5"
              >
                {cancellingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
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
                  placeholder="e.g. Priya Patel"
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
