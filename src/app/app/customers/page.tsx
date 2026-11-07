"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  CalendarCheck2,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Tag,
  Loader2,
  X,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Customer, Appointment } from "@/types/database";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function loadCustomers() {
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
          } else {
            setCustomers([]);
            setLoading(false);
            return;
          }

          if (bId) {
            // Fetch customers
            const custSnap = await getDocs(
              query(collection(db, "customers"), where("business_id", "==", bId))
            );
            const custs = custSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Customer[];
            custs.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
            setCustomers(custs);

            // Fetch appointments for history mapping
            const apptsSnap = await getDocs(
              query(collection(db, "appointments"), where("business_id", "==", bId))
            );
            const appts = apptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
            setAppointments(appts);
          }
        }
      } catch (err) {
        console.error("Customers fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  const customerAppointments = selectedCustomer
    ? appointments
        .filter(
          (a) =>
            a.customer_id === selectedCustomer.id ||
            (a.customer?.phone && a.customer.phone === selectedCustomer.phone) ||
            ((a as any).customer_phone && (a as any).customer_phone === selectedCustomer.phone) ||
            (a.customer?.email && a.customer.email === selectedCustomer.email) ||
            ((a as any).customer_email && (a as any).customer_email === selectedCustomer.email)
        )
        .sort((a, b) => (b.appointment_date || "").localeCompare(a.appointment_date || ""))
    : [];

  const customerTotalSpent = customerAppointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + (Number(a.service_price) || 0), 0);

  const customerBookedValue = customerAppointments
    .filter((a) => a.status !== "CANCELLED")
    .reduce((sum, a) => sum + (Number(a.service_price) || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mb-3" />
        <span className="font-mono text-xs">Loading customer CRM records from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-slate-900 dark:text-white">
            Customer CRM Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Deduplicated client profiles, visit history, and lifetime value • {customers.length} verified records
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C49A46] shadow-sm transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Directory Table (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-navy-400 space-y-2">
              <Users className="w-8 h-8 text-slate-300 dark:text-navy-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No customer profiles found.</p>
              <p className="text-xs">Profiles are automatically generated whenever a client books online.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-navy-200">
                <thead className="bg-slate-50/80 dark:bg-navy-950/60 border-b border-slate-200 dark:border-navy-800 font-mono text-[11px] uppercase text-slate-500 dark:text-navy-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6 font-bold">Client Name</th>
                    <th className="py-3.5 px-6 font-bold">Contact Channels</th>
                    <th className="py-3.5 px-6 font-bold">Visit Count</th>
                    <th className="py-3.5 px-6 font-bold text-right">View History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const cAppts = appointments.filter(
                      (a) =>
                        a.customer_id === c.id ||
                        (a.customer?.phone && a.customer.phone === c.phone) ||
                        ((a as any).customer_phone && (a as any).customer_phone === c.phone)
                    );
                    const visits = cAppts.length;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-amber-500/10 dark:bg-[#C49A46]/10 font-semibold"
                            : "hover:bg-slate-50/60 dark:hover:bg-navy-800/40"
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white">{c.full_name || "Guest Client"}</div>
                          <div className="text-[10px] text-slate-400 dark:text-navy-500 font-mono">ID: {c.id.slice(0, 8)}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-mono text-[11px] text-slate-800 dark:text-navy-200 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#C49A46] shrink-0" />
                            <span>{c.phone || "No phone"}</span>
                          </div>
                          {c.email && (
                            <div className="text-[11px] text-slate-500 dark:text-navy-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 font-mono">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-navy-200">
                            {visits} Bookings
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className="font-mono text-xs font-bold text-[#C49A46] hover:brightness-110 inline-flex items-center gap-1"
                          >
                            <span>Ledger</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer History Drawer (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          {selectedCustomer ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#C49A46]">
                    CLIENT DOSSIER
                  </span>
                  <h3 className="font-display text-lg font-black uppercase text-slate-900 dark:text-white mt-1">
                    {selectedCustomer.full_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact Snapshot */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500 dark:text-navy-400">Phone:</span>
                  <a href={`tel:${selectedCustomer.phone}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                    {selectedCustomer.phone || "N/A"}
                  </a>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500 dark:text-navy-400">Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {selectedCustomer.email || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-200 dark:border-navy-800">
                  <span className="text-slate-500 dark:text-navy-400">Realized Revenue:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{customerTotalSpent.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500 dark:text-navy-400">Total Booked Value:</span>
                  <span className="font-bold text-[#C49A46]">
                    ₹{customerBookedValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Appointment Ledger */}
              <div className="space-y-2">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-navy-200">
                  Appointment History ({customerAppointments.length})
                </h4>

                {customerAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-navy-500 italic">No appointments recorded yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {customerAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{apt.service_name}</span>
                          <span className="font-mono text-[#C49A46]">₹{apt.service_price || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-navy-400">
                          <span>
                            {apt.appointment_date} • {apt.start_time}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              apt.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : apt.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : apt.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                : apt.status === "NO_SHOW"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-800 dark:bg-navy-800 dark:text-navy-200"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        {apt.staff_name && (
                          <div className="text-[10px] text-slate-500 dark:text-navy-400 font-mono">
                            Specialist: {apt.staff_name}
                          </div>
                        )}
                        {apt.notes && (
                          <div className="text-[10px] text-slate-500 dark:text-navy-400 italic">
                            Notes: {apt.notes}
                          </div>
                        )}
                        {apt.cancellation_reason && (
                          <div className="text-[10px] text-red-500 dark:text-red-400 italic">
                            Cancelled: {apt.cancellation_reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-navy-500 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-navy-600" />
              <p className="text-xs font-semibold">Select a client to view full appointment history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
