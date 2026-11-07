"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  UserCheck, 
  Plus, 
  Mail, 
  Phone, 
  Trash2, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X 
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Staff } from "@/types/database";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role_title: "Senior Specialist",
    is_active: true,
  });

  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setStaffList([
          {
            id: "st-1",
            business_id: "demo-bus",
            name: "Sarah Miller",
            email: "sarah@aurastudio.com",
            phone: "+91 98200 11223",
            role_title: "Master Hair Stylist",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "st-2",
            business_id: "demo-bus",
            name: "Dr. Arvind Patel",
            email: "arvind@aurastudio.com",
            phone: "+91 98200 44556",
            role_title: "Therapeutic Specialist",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const uid = auth?.currentUser?.uid || (typeof document !== "undefined" && document.cookie.match(/slotora_session=([^;]+)/)?.[1]);
        if (uid) {
          const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
          if (!busSnap.empty) {
            const bId = busSnap.docs[0].id;
            setBusinessId(bId);
            const staffSnap = await getDocs(query(collection(db, "staff"), where("business_id", "==", bId)));
            const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Staff[];
            setStaffList(staff);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { db, isConfigured } = getFirebaseClient();

    if (!isConfigured || !db || !businessId) {
      const newStaff: Staff = {
        id: `st-${Date.now()}`,
        business_id: "demo-bus",
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        role_title: form.role_title.trim(),
        is_active: form.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStaffList((prev) => [...prev, newStaff]);
      setSaving(false);
      setModalOpen(false);
      return;
    }

    try {
      const staffRef = doc(collection(db, "staff"));
      const newStaff: Staff = {
        id: staffRef.id,
        business_id: businessId,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        role_title: form.role_title.trim(),
        is_active: form.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setDoc(staffRef, newStaff);
      setStaffList((prev) => [...prev, newStaff]);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, "staff", id));
      } catch (e) {
        console.warn("Failed to delete staff:", e);
      }
    }
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Staff Members & Specialists
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                {staffList.length} Team Members
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Manage team practitioners, working schedules and service allocation
            </p>
          </div>
          <button
            onClick={() => {
              setForm({ name: "", email: "", phone: "", role_title: "Senior Specialist", is_active: true });
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E75A32] hover:bg-[#D24823] active:scale-[0.98] shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#E75A32] mx-auto" />
              <p className="text-xs font-mono text-[#77736D]">Loading practitioners...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#DCD8CF] bg-white space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] text-[#171717] border border-[#DCD8CF] flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6 text-[#E75A32]" />
              </div>
              <h3 className="font-display font-bold text-[#171717]">No Staff Members Added</h3>
              <p className="text-xs font-sans text-[#77736D] max-w-sm mx-auto">
                Add specialists or stylists to allow clients to book with specific providers.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E75A32] hover:bg-[#D24823]"
              >
                Add First Staff Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="p-6 rounded-2xl bg-white border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#171717] text-[#C8E56A] font-display font-bold flex items-center justify-center text-sm border border-[#262626]">
                        {st.name.slice(0, 2).toUpperCase()}
                      </div>
                      <button
                        onClick={() => handleDelete(st.id)}
                        className="p-1.5 text-[#77736D] hover:text-rose-600 rounded transition-colors"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-[#171717] text-sm">{st.name}</h3>
                      <p className="text-xs font-mono text-[#E75A32] font-semibold">{st.role_title}</p>
                    </div>

                    <div className="pt-2 space-y-1 text-xs text-[#77736D]">
                      {st.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.email}</span>
                        </div>
                      )}
                      {st.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Add Staff Member</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arvind Patel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Stylist, Senior Consultant"
                  value={form.role_title}
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="arvind@business.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
