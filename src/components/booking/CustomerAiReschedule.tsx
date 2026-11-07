"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Business, CustomerAppointmentSummary } from "@/types/database";

interface SlotItem {
  startTime: string;
  endTime: string;
  formattedTime: string;
  available: boolean;
}

interface CustomerAiRescheduleProps {
  business: Business;
  initialAppointment?: CustomerAppointmentSummary | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function CustomerAiReschedule({
  business,
  initialAppointment,
  onBack,
  onSuccess,
}: CustomerAiRescheduleProps) {
  const [selectedAppt, setSelectedAppt] = useState<CustomerAppointmentSummary | null>(
    initialAppointment || null
  );

  // If no initial appointment passed, prompt phone lookup first
  const [phone, setPhone] = useState("");
  const [eligibleAppts, setEligibleAppts] = useState<CustomerAppointmentSummary[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Rescheduling slot selections
  const [newDate, setNewDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Confirmation state
  const [step, setStep] = useState<"select-appt" | "pick-slot" | "confirm" | "success">(
    initialAppointment ? "pick-slot" : "select-appt"
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rescheduleResult, setRescheduleResult] = useState<any | null>(null);

  // Initialize newDate to tomorrow in YYYY-MM-DD
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setNewDate(`${y}-${m}-${day}`);
  }, []);

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
        (a: CustomerAppointmentSummary) => a.can_reschedule && a.status === "CONFIRMED"
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

  // Fetch slots whenever newDate or selectedAppt changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedAppt || !newDate || !business.id) return;
      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const staffParam = selectedAppt.staff_id ? `&staffId=${encodeURIComponent(selectedAppt.staff_id)}` : "";
        const url = `/api/book/slots?businessId=${encodeURIComponent(business.id)}&serviceId=${encodeURIComponent(
          selectedAppt.service_id
        )}&date=${encodeURIComponent(newDate)}&serviceDuration=${selectedAppt.duration_minutes || 30}${staffParam}`;
        const res = await fetch(url);
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      } catch (e) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    if (step === "pick-slot" && selectedAppt) {
      fetchSlots();
    }
  }, [selectedAppt, newDate, business.id, step]);

  const handleConfirmReschedule = async () => {
    if (!selectedAppt || !selectedSlot || !newDate) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book/customer-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppt.id,
          managementToken: selectedAppt.management_token,
          customerPhone: selectedAppt.customer_phone,
          newDate,
          newStartTime: selectedSlot.startTime,
          newEndTime: selectedSlot.endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to reschedule appointment.");
      }

      setRescheduleResult(data);
      setStep("success");
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred while rescheduling.");
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

        <div className="flex items-center gap-1.5 text-xs text-[#046A38] font-mono font-semibold">
          <Clock className="w-4 h-4" />
          <span>Reschedule Appointment</span>
        </div>
      </div>

      {/* Step 1: Select Eligible Appointment (if not pre-selected) */}
      {step === "select-appt" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Find Your Appointment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your mobile number to view appointments eligible for rescheduling.
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
              className="w-full py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Find Appointments</span>
            </button>
          </form>

          {eligibleAppts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select an appointment to reschedule:
              </h4>
              {eligibleAppts.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => {
                    setSelectedAppt(appt);
                    setStep("pick-slot");
                  }}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#046A38] text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {appt.service_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {appt.appointment_date} at {appt.start_time.slice(0, 5)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#046A38]" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Pick New Date & Available Slot */}
      {step === "pick-slot" && selectedAppt && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#046A38]">
              Currently Scheduled
            </span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
              {selectedAppt.service_name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Old Date: <strong>{selectedAppt.appointment_date}</strong> at{" "}
              <strong>{selectedAppt.start_time.slice(0, 5)}</strong>
            </p>
          </div>

          {/* New Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select New Date *
            </label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full sm:w-60 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#046A38]"
            />
          </div>

          {/* Slots Matrix */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Available Slots for {newDate}
            </label>

            {loadingSlots ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#046A38]" />
                <span>Checking real-time calendar availability...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 text-center">
                No open slots available on this date. Please pick another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot, idx) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={idx}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-mono text-center border transition-all ${
                        !slot.available
                          ? "opacity-35 bg-slate-100 dark:bg-slate-800/40 border-slate-200 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-[#046A38] text-white border-[#046A38] font-bold shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#046A38]"
                      }`}
                    >
                      {slot.formattedTime || slot.startTime.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setStep("select-appt")}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Back
            </button>

            <button
              disabled={!selectedSlot}
              onClick={() => setStep("confirm")}
              className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <span>Review & Confirm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Explicit Confirmation */}
      {step === "confirm" && selectedAppt && selectedSlot && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Confirm Rescheduled Appointment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please verify your appointment changes before confirming.
            </p>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 opacity-75">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Previous Booking
              </span>
              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                {selectedAppt.service_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {selectedAppt.appointment_date} at {selectedAppt.start_time.slice(0, 5)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-[#043D2E]/30 border border-[#046A38]/40 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#046A38] font-bold">
                New Schedule (Requested)
              </span>
              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                {selectedAppt.service_name}
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 font-mono font-bold">
                {newDate} at {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              By clicking <strong>Confirm Reschedule</strong>, your old slot will be released and your new time slot will be reserved.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setStep("pick-slot")}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Back
            </button>

            <button
              onClick={handleConfirmReschedule}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm Reschedule</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success Confirmation */}
      {step === "success" && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
              Rescheduled Successfully!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your appointment with <strong>{business.name}</strong> has been updated. A confirmation has been logged.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1 text-left">
            <div><strong>Service:</strong> {selectedAppt?.service_name}</div>
            <div><strong>New Date:</strong> {newDate}</div>
            <div><strong>New Time:</strong> {selectedSlot?.startTime.slice(0, 5)} - {selectedSlot?.endTime.slice(0, 5)}</div>
          </div>

          <button
            onClick={onSuccess}
            className="w-full py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
