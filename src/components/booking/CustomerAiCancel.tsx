"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  XCircle,
  CalendarDays,
  Clock,
  AlertCircle,
  Loader2,
  Phone,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Business, CustomerAppointmentSummary } from "@/types/database";

interface CustomerAiCancelProps {
  business: Business;
  initialAppointment?: CustomerAppointmentSummary | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function CustomerAiCancel({
  business,
  initialAppointment,
  onBack,
  onSuccess,
}: CustomerAiCancelProps) {
  const [selectedAppt, setSelectedAppt] = useState<CustomerAppointmentSummary | null>(
    initialAppointment || null
  );

  const [phone, setPhone] = useState("");
  const [eligibleAppts, setEligibleAppts] = useState<CustomerAppointmentSummary[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [confirmedPolicy, setConfirmedPolicy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<any | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setLookupError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLookingUp(true);
    setLookupError(null);

    try {
      const res = await fetch("/api/book/customer-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Lookup failed.");

      const eligible = (data.upcoming || []).filter(
        (a: CustomerAppointmentSummary) => a.can_cancel && a.status === "CONFIRMED"
      );
      if (eligible.length === 0) {
        setLookupError("No eligible upcoming appointments found for this mobile number.");
        return;
      }
      setEligibleAppts(eligible);
    } catch (err: any) {
      setLookupError(err.message || "Could not retrieve appointments.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppt) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book/customer-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppt.id,
          managementToken: selectedAppt.management_token,
          customerPhone: selectedAppt.customer_phone,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to cancel appointment.");
      }

      setCancelResult(data);
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred while cancelling.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Options</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-mono font-semibold">
          <XCircle className="w-4 h-4" />
          <span>Cancel Booking</span>
        </div>
      </div>

      {/* Screen 1: Success Confirmation */}
      {cancelResult ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
              Appointment Cancelled
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your appointment with <strong>{business.name}</strong> has been cancelled.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 text-left space-y-1.5">
            <div><strong>Booking Reference:</strong> {cancelResult.bookingReference || selectedAppt?.booking_reference}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {cancelResult.refundNotice}
            </div>
          </div>

          <button
            onClick={onSuccess}
            className="w-full py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      ) : !selectedAppt ? (
        /* Screen 2: Lookup Appointment if not selected */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Find Appointment to Cancel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your mobile number to view your upcoming bookings.
            </p>
          </div>

          {lookupError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="Mobile number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#046A38]"
              />
            </div>

            <button
              type="submit"
              disabled={lookingUp}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>Find Appointments</span>
            </button>
          </form>

          {eligibleAppts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select an appointment to cancel:
              </h4>
              {eligibleAppts.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {appt.service_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {appt.appointment_date} at {appt.start_time.slice(0, 5)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-rose-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Screen 3: Cancellation Review & Policy Agreement */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Confirm Cancellation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review appointment details and cancellation policy below.
            </p>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Appointment Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Booking Ref: {selectedAppt.booking_reference}
            </span>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">
              {selectedAppt.service_name}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-[#046A38]" />
                {selectedAppt.appointment_date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#046A38]" />
                {selectedAppt.start_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Cancellation Policy Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Cancellation Policy Notice</span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
              {(business as any).cancellation_policy ||
                "Cancellations must be requested at least 2 hours prior to scheduled time. Payment refunds are never automated and follow the store's verified refund procedure."}
            </p>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Let us know why you need to cancel..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Explicit Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={confirmedPolicy}
              onChange={(e) => setConfirmedPolicy(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <span>
              I understand that this appointment will be cancelled and this action cannot be undone.
            </span>
          </label>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setSelectedAppt(null)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Back
            </button>

            <button
              onClick={handleConfirmCancel}
              disabled={submitting || !confirmedPolicy}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>Cancel Appointment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
