"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Phone,
  FileText,
} from "lucide-react";
import { Business, CustomerAppointmentSummary } from "@/types/database";

interface CustomerAiMyAppointmentsProps {
  business: Business;
  onBack: () => void;
  onReschedule: (appointment: CustomerAppointmentSummary) => void;
  onCancel: (appointment: CustomerAppointmentSummary) => void;
}

export function CustomerAiMyAppointments({
  business,
  onBack,
  onReschedule,
  onCancel,
}: CustomerAiMyAppointmentsProps) {
  const [phone, setPhone] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [upcoming, setUpcoming] = useState<CustomerAppointmentSummary[]>([]);
  const [completed, setCompleted] = useState<CustomerAppointmentSummary[]>([]);
  const [cancelled, setCancelled] = useState<CustomerAppointmentSummary[]>([]);

  const handleRequestOtp = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setRequestingCode(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/book/customer-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          phone: phone.trim(),
          action: "request-code",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to send code");

      setCodeRequested(true);
      if (data.demoCodeNotice) {
        setDemoOtpNotice(data.demoCodeNotice);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request code.");
    } finally {
      setRequestingCode(false);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/book/customer-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          phone: phone.trim(),
          bookingReference: bookingRef.trim() || undefined,
          verificationCode: otpCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Lookup failed.");

      setUpcoming(data.upcoming || []);
      setCompleted(data.completed || []);
      setCancelled(data.cancelled || []);
      setVerified(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not retrieve appointments.");
    } finally {
      setLoading(false);
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
          <CalendarDays className="w-4 h-4" />
          <span>My Appointments</span>
        </div>
      </div>

      {/* Screen 1: Customer Phone Verification Form */}
      {!verified ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] border border-[#046A38]/20 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Verify Your Phone Number
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the mobile number you used while booking with <strong>{business.name}</strong> to view your appointments.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {demoOtpNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#043D2E]/40 border border-amber-200 dark:border-amber-800 text-emerald-800 dark:text-emerald-300 text-xs text-center font-mono font-medium">
              {demoOtpNotice}
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#046A38]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Booking Reference (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. VISRO-XXXX-XXXX"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#046A38]"
                />
              </div>
            </div>

            {codeRequested && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 text-center tracking-widest font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#046A38]"
                />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>View My Appointments</span>
              </button>

              {!codeRequested && (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={requestingCode}
                  className="w-full py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {requestingCode ? "Sending code..." : "Request an SMS Verification Code"}
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* Screen 2: Verified Appointments Dashboard */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Verified Customer Mobile
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                +91 {phone}
              </div>
            </div>

            <button
              onClick={() => {
                setVerified(false);
                setOtpCode("");
              }}
              className="text-xs font-semibold text-[#046A38] hover:underline"
            >
              Change Number
            </button>
          </div>

          {/* Tabs: Upcoming / Completed / Cancelled */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`p-2.5 rounded-xl border transition-all ${
                activeTab === "upcoming"
                  ? "bg-[#043D2E] text-white border-[#043D2E] dark:bg-[#046A38] dark:text-white font-bold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`p-2.5 rounded-xl border transition-all ${
                activeTab === "completed"
                  ? "bg-[#043D2E] text-white border-[#043D2E] dark:bg-[#046A38] dark:text-white font-bold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              Completed ({completed.length})
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`p-2.5 rounded-xl border transition-all ${
                activeTab === "cancelled"
                  ? "bg-[#043D2E] text-white border-[#043D2E] dark:bg-[#046A38] dark:text-white font-bold shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              Cancelled ({cancelled.length})
            </button>
          </div>

          {/* Active Tab Appointment Items */}
          <div className="space-y-3">
            {activeTab === "upcoming" && (
              <>
                {upcoming.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No Upcoming Appointments
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      You do not have any pending appointments scheduled with {business.name}.
                    </p>
                  </div>
                ) : (
                  upcoming.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#046A38]">
                            Ref: {appt.booking_reference}
                          </span>
                          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mt-0.5">
                            {appt.service_name}
                          </h3>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {appt.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-mono">
                          <CalendarDays className="w-3.5 h-3.5 text-[#046A38]" />
                          <span>{appt.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#046A38]" />
                          <span>{appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{appt.staff_name || "Assigned Specialist"}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          ₹{appt.service_price.toLocaleString("en-IN")}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onReschedule(appt)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#046A38]" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            onClick={() => onCancel(appt)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {completed.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-xs text-slate-400">
                    No completed appointments found.
                  </div>
                ) : (
                  completed.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 opacity-90"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Ref: {appt.booking_reference}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                            {appt.service_name}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          COMPLETED
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                        <span>{appt.appointment_date}</span>
                        <span>₹{appt.service_price}</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "cancelled" && (
              <>
                {cancelled.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-xs text-slate-400">
                    No cancelled appointments found.
                  </div>
                ) : (
                  cancelled.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 opacity-80"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Ref: {appt.booking_reference}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                            {appt.service_name}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200">
                          CANCELLED
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                        <span>{appt.appointment_date}</span>
                        <span>₹{appt.service_price}</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
