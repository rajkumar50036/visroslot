"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles,
  Phone,
  Mail,
  UserX,
  Lock
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Appointment, Business } from "@/types/database";

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Load appointments from Firebase Firestore
  useEffect(() => {
    async function loadDashboard() {
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
          const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
          if (!busSnap.empty) {
            const busDoc = busSnap.docs[0];
            const busData = { id: busDoc.id, ...busDoc.data() } as Business;
            setBusiness(busData);

            const isFounder = uid === "vMZQTGlYSfM8adohQAZmSE3cNX02" || auth?.currentUser?.email?.toLowerCase() === "rajkumar50036@gmail.com" || (busData as any).lifetime_free;
            if (isFounder) {
              setIsPaid(true);
            } else {
              const subSnap = await getDocs(query(collection(db, "subscriptions"), where("business_id", "==", busDoc.id)));
              if (!subSnap.empty && subSnap.docs[0].data().status === "ACTIVE" && subSnap.docs[0].data().plan_id !== "free") {
                setIsPaid(true);
              }
            }

            // Fetch real appointments from Firestore
            const apptsSnap = await getDocs(query(collection(db, "appointments"), where("business_id", "==", busDoc.id)));
            const apptsList = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
            
            // Sort by appointment_date and start_time desc
            apptsList.sort((a, b) => {
              const dateDiff = (b.appointment_date || "").localeCompare(a.appointment_date || "");
              if (dateDiff !== 0) return dateDiff;
              return (b.start_time || "").localeCompare(a.start_time || "");
            });

            setAppointments(apptsList);
          } else {
            setBusiness(null);
            setAppointments([]);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    const { db } = getFirebaseClient();
    if (db) {
      try {
        await updateDoc(doc(db, "appointments", appointmentId), {
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Failed to update status in Firestore:", e);
      }
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus as any } : a))
    );
  };

  const handleCopyBookingLink = () => {
    if (typeof window !== "undefined" && business?.slug) {
      const fullUrl = `${window.location.origin}/book/${business.slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper getters for normalized data fields
  const getClientName = (appt: any) => {
    return (
      appt.customer?.full_name ||
      appt.customer?.name ||
      appt.customer_name ||
      (appt.customer?.phone || appt.customer_phone ? `Customer (${appt.customer?.phone || appt.customer_phone})` : "Name Not Provided")
    );
  };

  const getClientPhone = (appt: any) => {
    return appt.customer?.phone || appt.customer_phone || "—";
  };

  const getServiceName = (appt: any) => {
    return appt.service?.name || appt.service_name || "Standard Appointment";
  };

  const getServicePrice = (appt: any) => {
    return Number(appt.service_price) || Number(appt.price) || Number(appt.service?.price) || 0;
  };

  // Real KPI Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);
  const confirmedToday = todayAppointments.filter((a) => a.status === "CONFIRMED").length;
  
  // Eligible booked value excludes cancelled
  const eligibleAppointments = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CONFIRMED");
  const bookedServiceValue = eligibleAppointments.reduce((acc, curr) => acc + getServicePrice(curr), 0);
  
  const uniqueCustomersCount = new Set(
    appointments.map((a) => a.customer_id || a.customer?.phone || (a as any).customer_phone).filter(Boolean)
  ).size;

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    const clientName = getClientName(a);
    const clientPhone = getClientPhone(a);
    const srvName = getServiceName(a);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      clientName.toLowerCase().includes(q) ||
      clientPhone.includes(q) ||
      (a.booking_reference && a.booking_reference.toLowerCase().includes(q)) ||
      srvName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        {/* Top Navbar */}
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
              Appointments Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A] border border-[#171717]">
              Live Engine
            </span>
          </div>

          {business && (
            <div className="flex items-center gap-3">
              {!isPaid ? (
                <Link
                  href="/pricing"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-mono font-bold flex items-center gap-1.5"
                  title="Paid subscription required to activate public sharing link"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sharing Link Locked</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleCopyBookingLink}
                    className="px-3.5 py-1.5 rounded-xl border border-[#DCD8CF] hover:border-[#171717] bg-white text-xs font-mono font-bold text-[#171717] hover:text-[#E75A32] transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#E75A32]" /> : <Copy className="w-3.5 h-3.5 text-[#77736D]" />}
                    <span>{copied ? "Copied!" : "Copy Booking URL"}</span>
                  </button>

                  <Link
                    href={`/book/${business.slug}`}
                    target="_blank"
                    className="px-3.5 py-1.5 rounded-xl bg-[#E75A32] hover:bg-[#D24823] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                  >
                    <span>Client Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          )}
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                  Total Bookings
                </span>
                <div className="p-2 rounded-xl bg-[#F5F0E6] text-[#171717] border border-[#DCD8CF]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-[#171717] tracking-tight">
                {appointments.length}
              </div>
              <div className="text-[11px] font-sans text-[#77736D] mt-1">Recorded appointment bookings</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                  Today&apos;s Appointments
                </span>
                <div className="p-2 rounded-xl bg-[#C8E56A]/20 text-[#171717] border border-[#C8E56A]/40">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-[#171717] tracking-tight">
                {todayAppointments.length}
              </div>
              <div className="text-[11px] font-sans text-[#77736D] mt-1">{confirmedToday} confirmed for today</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                  Unique Clients
                </span>
                <div className="p-2 rounded-xl bg-[#3159D9]/10 text-[#3159D9] border border-[#3159D9]/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-[#171717] tracking-tight">
                {uniqueCustomersCount}
              </div>
              <div className="text-[11px] font-sans text-[#77736D] mt-1">Saved customer CRM profiles</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#77736D]">
                  Booked Service Value
                </span>
                <div className="p-2 rounded-xl bg-[#E75A32]/10 text-[#E75A32] border border-[#E75A32]/30">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-[#171717] tracking-tight">
                ₹{bookedServiceValue.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] font-sans text-[#77736D] mt-1">Active eligible appointments value</div>
            </div>

          </div>

          {/* Appointments Management Table */}
          <div className="bg-white rounded-2xl border border-[#DCD8CF] shadow-xs overflow-hidden">
            
            {/* Table Filters & Search */}
            <div className="p-5 border-b border-[#DCD8CF] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F5F0E6]/30">
              <div className="flex items-center gap-1.5 flex-wrap">
                {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      filterStatus === status
                        ? "bg-[#171717] text-white shadow-xs"
                        : "bg-white text-[#77736D] hover:text-[#171717] border border-[#DCD8CF]"
                    }`}
                  >
                    {status === "ALL" ? "All Bookings" : status === "NO_SHOW" ? "No Show" : status}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
                <input
                  type="text"
                  placeholder="Search client, phone, ref or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCD8CF] rounded-lg focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93]"
                />
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#E75A32] mx-auto" />
                <p className="text-xs font-mono text-[#77736D]">Fetching live appointment bookings from database...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F5F0E6] text-[#171717] border border-[#DCD8CF] flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-6 h-6 text-[#E75A32]" />
                </div>
                <h3 className="font-display font-bold text-[#171717] text-sm">No Appointments Found</h3>
                <p className="text-xs text-[#77736D] max-w-sm mx-auto font-sans">
                  {searchQuery || filterStatus !== "ALL"
                    ? "No appointments match your active filter criteria."
                    : "Share your public booking URL with customers to start receiving appointments."}
                </p>
                {business && !searchQuery && filterStatus === "ALL" && (
                  <button
                    onClick={handleCopyBookingLink}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#E75A32] hover:bg-[#D24823] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Copy Booking Link
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F0E6]/70 border-b border-[#DCD8CF] text-[#77736D] font-mono font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-6">Reference</th>
                      <th className="py-3.5 px-6">Client Name</th>
                      <th className="py-3.5 px-6">Contact Phone</th>
                      <th className="py-3.5 px-6">Service</th>
                      <th className="py-3.5 px-6">Date & Time</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Fee</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD8CF]/60">
                    {filteredAppointments.map((appt) => {
                      const clientName = getClientName(appt);
                      const clientPhone = getClientPhone(appt);
                      const serviceName = getServiceName(appt);
                      const fee = getServicePrice(appt);

                      const statusBadge =
                        appt.status === "CONFIRMED"
                          ? "bg-[#C8E56A]/20 text-[#171717] border border-[#C8E56A]"
                          : appt.status === "COMPLETED"
                          ? "bg-[#3159D9]/10 text-[#3159D9] border border-[#3159D9]/30"
                          : appt.status === "NO_SHOW"
                          ? "bg-[#77736D]/15 text-[#77736D] border border-[#77736D]/30"
                          : "bg-rose-50 text-rose-700 border border-rose-200";

                      return (
                        <tr key={appt.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#171717]">
                            {appt.booking_reference}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-display font-bold text-[#171717] text-sm">
                              {clientName}
                            </div>
                            {appt.customer?.email && (
                              <div className="text-[10px] font-mono text-[#77736D]">
                                {appt.customer.email}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-[#77736D]">
                            {clientPhone}
                          </td>
                          <td className="py-4 px-6 font-semibold text-[#171717]">
                            {serviceName}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-display font-bold text-[#171717]">
                              {appt.appointment_date}
                            </div>
                            <div className="text-[11px] text-[#E75A32] font-mono font-semibold">
                              {(appt.start_time || "").slice(0, 5)} - {(appt.end_time || "").slice(0, 5)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${statusBadge}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-display font-bold text-[#171717] text-sm">
                            ₹{fee.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                            {appt.status === "CONFIRMED" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                                  className="px-2.5 py-1 rounded-md bg-[#C8E56A]/20 hover:bg-[#C8E56A]/40 text-[#171717] border border-[#C8E56A] font-mono text-[10px] font-bold uppercase transition-colors"
                                  title="Mark Completed"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appt.id, "NO_SHOW")}
                                  className="px-2.5 py-1 rounded-md bg-[#F5F0E6] hover:bg-[#E2D9C6] text-[#77736D] border border-[#DCD8CF] font-mono text-[10px] font-bold uppercase transition-colors"
                                  title="Mark as No Show"
                                >
                                  No-Show
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                                  className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold uppercase transition-colors"
                                  title="Cancel Appointment"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {appt.status !== "CONFIRMED" && (
                              <button
                                onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                                className="px-2.5 py-1 rounded-md bg-[#171717] hover:bg-[#262626] text-white font-mono text-[10px] font-bold uppercase transition-colors"
                              >
                                Reopen
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
