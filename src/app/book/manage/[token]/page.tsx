"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Star,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";

export default function ManageAppointmentPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [appointment, setAppointment] = useState<any | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadAppt() {
      setLoading(true);
      try {
        const res = await fetch(`/api/book/manage?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unable to load appointment record");
        }
        setAppointment(data.appointment);
        setBusinessName(data.businessName);
      } catch (e: any) {
        setErrorMsg(e.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadAppt();
    }
  }, [token]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/book/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setActionSuccess("Your appointment has been cancelled successfully.");
      setAppointment((prev: any) => ({ ...prev, status: "CANCELLED" }));
    } catch (e: any) {
      setErrorMsg(e.message || "Cancellation error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#043D2E] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#046A38] mb-3" />
        <span className="font-mono text-xs uppercase text-slate-300">
          Validating Security Token...
        </span>
      </div>
    );
  }

  if (errorMsg || !appointment) {
    return (
      <div className="min-h-screen bg-[#043D2E] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#0B1425] border border-[#046A38]/30 text-[#046A38] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-black uppercase text-white">
          Appointment Not Found
        </h1>
        <p className="mt-2 text-xs text-slate-300 max-w-sm">
          {errorMsg || "The appointment token is invalid or has expired."}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-full bg-[#046A38] text-white hover:bg-[#043D2E] font-mono text-xs font-bold"
        >
          VisroSlot Home
        </Link>
      </div>
    );
  }

  const isCompleted = (appointment.status || "").toUpperCase() === "COMPLETED";
  const isCancelled = (appointment.status || "").toUpperCase() === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#D8DED8]/20">
          <VisroSlotLogo size="sm" href="/" />
          <VisroContactPhone showIcon={true} />
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* In-App Review Invitation Card for Completed Appointments */}
        {isCompleted && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#046A38]/10 to-emerald-500/10 border-2 border-[#046A38]/40 dark:border-[#046A38]/30 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#046A38]">
              <Star className="w-5 h-5 fill-[#046A38]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Appointment Completed • Rate Your Visit
              </span>
            </div>
            <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">
              How was your experience at {businessName}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-navy-300">
              Your feedback is verified and helps future clients choose the best service.
            </p>
            <div className="pt-2">
              <Link
                href={`/review/${token}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <span>Write a Review (1 - 5 Stars)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Appointment Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#D8DED8]/20">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                MANAGE APPOINTMENT
              </span>
              <h1 className="font-display text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                {appointment.service_name}
              </h1>
              <p className="text-xs text-slate-600 dark:text-navy-300 font-semibold">{businessName}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                appointment.status === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : appointment.status === "COMPLETED"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  : appointment.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                  : "bg-slate-100 text-slate-800 dark:bg-[#043D2E]/80 dark:text-navy-200"
              }`}
            >
              {appointment.status}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono uppercase">Booking Reference</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {appointment.booking_reference}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono uppercase">Date & Time</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {appointment.appointment_date} at {appointment.start_time}
              </span>
            </div>
            {appointment.staff_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono uppercase">Assigned Staff</span>
                <span className="font-bold text-[#046A38]">{appointment.staff_name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono uppercase">Client Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{appointment.customer_name}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#D8DED8]/20">
              <span className="text-slate-400 font-mono uppercase">Price</span>
              <span className="font-display font-black text-[#046A38] text-sm">
                ₹{Number(appointment.service_price || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Cancellation Option (Only permitted before completion or cancellation) */}
          {!isCancelled && !isCompleted && (
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 px-4 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-mono text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? "Cancelling..." : "Cancel Appointment"}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-[#D8DED8]/20 text-center">
            <Link
              href="/"
              className="text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:text-navy-400 dark:hover:text-white"
            >
              ← Return to VisroSlot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
