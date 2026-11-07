"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Loader2,
  CheckCircle2,
  X,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Tag
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
        setCustomers([]);
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
          } else {
            setCustomers([]);
            setLoading(false);
            return;
          }

          if (bId) {
            // Fetch customers
            const custSnap = await getDocs(query(collection(db, "customers"), where("business_id", "==", bId)));
            const custs = custSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[];
            
            // Sort by created_at desc
            custs.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
            setCustomers(custs);

            // Fetch appointments for history mapping
            const apptsSnap = await getDocs(query(collection(db, "appointments"), where("business_id", "==", bId)));
            const appts = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
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

  // Get appointments for selected customer
  const customerAppointments = selectedCustomer
    ? appointments.filter(
        (a) =>
          a.customer_id === selectedCustomer.id ||
          (a.customer?.phone && a.customer.phone === selectedCustomer.phone) ||
          ((a as any).customer_phone && (a as any).customer_phone === selectedCustomer.phone)
      ).sort((a, b) => (b.appointment_date || "").localeCompare(a.appointment_date || ""))
    : [];

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Customer CRM Directory
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                {customers.length} Profiles
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Unified client ledger, visit histories and contact channels
            </p>
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCD8CF] rounded-lg focus:outline-none focus:border-[#E75A32] text-[#171717] placeholder:text-[#A39E93] font-sans"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#DCD8CF] shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#E75A32] mx-auto" />
                <p className="text-xs font-mono text-[#77736D]">Loading customer records from database...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F5F0E6] text-[#171717] border border-[#DCD8CF] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-[#E75A32]" />
                </div>
                <h3 className="font-display font-bold text-[#171717] text-sm">
                  {searchQuery ? "No matching clients found" : "No Customers Found"}
                </h3>
                <p className="text-xs text-[#77736D] max-w-sm mx-auto font-sans">
                  {searchQuery
                    ? `No customer profile matches "${searchQuery}". Try a different name, phone, or email.`
                    : "Customer profiles are automatically created and tracked when clients book appointments on your booking page."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F0E6]/70 border-b border-[#DCD8CF] text-[#77736D] font-mono font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-6">Customer Name</th>
                      <th className="py-3.5 px-6">Email</th>
                      <th className="py-3.5 px-6">Phone Number</th>
                      <th className="py-3.5 px-6">Total Bookings</th>
                      <th className="py-3.5 px-6">Last Visit</th>
                      <th className="py-3.5 px-6">Registered On</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD8CF]/60">
                    {filteredCustomers.map((cust) => {
                      const bookingsCount = cust.total_bookings || 1;
                      const lastVisit = (cust as any).last_visit_at
                        ? new Date((cust as any).last_visit_at).toLocaleDateString()
                        : "—";

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className="hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className="font-display font-bold text-[#171717] text-sm group-hover:text-[#E75A32] transition-colors">
                              {cust.full_name || "Name Not Provided"}
                            </div>
                            {cust.notes && (
                              <div className="text-[11px] text-[#77736D] truncate max-w-xs font-sans">
                                {cust.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-[#77736D] font-sans">
                            {cust.email || "—"}
                          </td>
                          <td className="py-4 px-6 text-[#171717] font-medium font-mono">
                            {cust.phone || "—"}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                              {bookingsCount} {bookingsCount === 1 ? "booking" : "bookings"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#171717] font-medium font-mono">
                            {lastVisit}
                          </td>
                          <td className="py-4 px-6 text-[#77736D] font-mono">
                            {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-md bg-[#F5F0E6] group-hover:bg-[#E75A32] group-hover:text-white text-[#171717] text-xs font-mono font-bold tracking-wider uppercase border border-[#DCD8CF] transition-all inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>Profile</span>
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
        </div>

        {/* Customer Profile Drawer Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-[#171717]/60 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#DCD8CF] animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#DCD8CF] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#171717] text-[#C8E56A] border border-[#262626] flex items-center justify-center font-display font-bold text-base shadow-sm">
                    {(selectedCustomer.full_name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[#171717] text-base">
                      {selectedCustomer.full_name || "Client Profile"}
                    </h3>
                    <p className="text-[11px] font-mono text-[#77736D]">
                      ID: {selectedCustomer.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl text-[#77736D] hover:text-[#171717] hover:bg-[#F5F0E6] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Card */}
                <div className="bg-white p-4 rounded-xl border border-[#DCD8CF] space-y-3">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#77736D]">
                    Contact Channels
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#171717]">
                      <Phone className="w-3.5 h-3.5 text-[#E75A32]" />
                      <span className="font-mono font-medium">{selectedCustomer.phone || "No phone provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#171717]">
                      <Mail className="w-3.5 h-3.5 text-[#3159D9]" />
                      <span className="font-sans">{selectedCustomer.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#77736D] text-[11px]">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#77736D]" />
                      <span className="font-mono">
                        Client since {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : "recently"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#77736D]">
                      Appointment Ledger ({customerAppointments.length})
                    </h4>
                    <span className="text-xs font-mono font-bold text-[#E75A32]">
                      {selectedCustomer.total_bookings || customerAppointments.length} Total Bookings
                    </span>
                  </div>

                  {customerAppointments.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-[#DCD8CF] rounded-xl bg-white">
                      <p className="text-xs font-mono text-[#77736D]">No appointments recorded yet for this client.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customerAppointments.map((appt) => {
                        const fee = Number(appt.service_price) || Number((appt as any).price) || 0;
                        const srvName = appt.service?.name || (appt as any).service_name || "Standard Consultation";
                        const statusBadge =
                          appt.status === "CONFIRMED"
                            ? "bg-[#C8E56A]/20 text-[#171717] border border-[#C8E56A]"
                            : appt.status === "COMPLETED"
                            ? "bg-[#3159D9]/10 text-[#3159D9] border border-[#3159D9]/30"
                            : appt.status === "NO_SHOW"
                            ? "bg-[#77736D]/15 text-[#77736D] border border-[#77736D]/30"
                            : "bg-rose-50 text-rose-700 border border-rose-200";

                        return (
                          <div
                            key={appt.id}
                            className="p-3.5 rounded-xl border border-[#DCD8CF] bg-white shadow-xs space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[#171717]">
                                {appt.booking_reference}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${statusBadge}`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <div className="font-semibold text-[#171717]">
                              {srvName}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#77736D] pt-2 border-t border-[#DCD8CF]/60">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#E75A32]" />
                                <span className="font-mono">{appt.appointment_date} at {(appt.start_time || "").slice(0, 5)}</span>
                              </div>
                              <span className="font-display font-bold text-[#171717]">
                                ₹{fee.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div className="bg-white p-4 rounded-xl border border-[#DCD8CF] space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E75A32]">
                      Client Notes
                    </span>
                    <p className="text-xs text-[#171717] leading-relaxed font-sans">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
