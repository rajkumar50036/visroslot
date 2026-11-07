"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Save,
  X,
  Cpu,
  Shield,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Staff, Business } from "@/types/database";

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("Specialist");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadStaff = async () => {
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
        let busSnap = await getDocs(
          query(collection(db, "businesses"), where("owner_id", "==", uid))
        );
        if (busSnap.empty && auth?.currentUser?.email) {
          busSnap = await getDocs(
            query(collection(db, "businesses"), where("owner_email", "==", auth.currentUser.email.toLowerCase()))
          );
        }

        let activeBusId = "";
        if (!busSnap.empty) {
          const d = busSnap.docs[0];
          activeBusId = d.id;
          setBusiness({ id: d.id, ...d.data() } as Business);
        } else {
          // Strict Privacy: Do not leak another user's staff roster
          setBusiness(null);
          setStaffList([]);
          setLoading(false);
          return;
        }

        if (activeBusId) {
          const staffSnap = await getDocs(
            query(collection(db, "staff"), where("business_id", "==", activeBusId))
          );
          const list = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Staff[];
          list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setStaffList(list);
        }
      }
    } catch (e) {
      console.error("Error loading staff:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("Specialist");
    setFormActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setFormName(s.name || "");
    setFormEmail(s.email || "");
    setFormPhone(s.phone || "");
    setFormRole((s as any).role || "Specialist");
    setFormActive(s.is_active !== false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !business?.id) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        business_id: business.id,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole.trim(),
        is_active: formActive,
      };

      let res: Response;
      if (editingStaff?.id) {
        res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to save staff record.");
      }

      setModalOpen(false);
      await loadStaff();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save staff record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete staff member.");
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      alert(e.message || "Error deleting staff");
    }
  };

  const handleToggleActive = async (s: Staff) => {
    try {
      const nextActive = !s.is_active;
      const res = await fetch(`/api/staff/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update staff status.");

      setStaffList((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, is_active: nextActive } : item))
      );
    } catch (e: any) {
      console.error("Error toggling active status:", e);
      alert(e.message || "Error toggling staff status.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-600">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading staff roster from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Staff & Employee Roster
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Automated load-balancing dispatch • {staffList.length} registered team members
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-gold-400 hover:brightness-110 text-navy-950 text-xs font-mono font-bold shadow-gold flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Notice Banner: Automated Assignment Engine */}
      <div className="p-4 rounded-2xl bg-gold-50 border border-gold-300/80 text-navy-950 text-xs flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gold-400 text-navy-950 shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <strong className="font-bold">Autonomous Employee Dispatch Active:</strong> Customers do not pick staff during booking. VisroSlot automatically assigns an active, available team member behind the scenes based on shift availability and current bookings.
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.length === 0 ? (
          <div className="col-span-full p-12 text-center text-navy-500 rounded-3xl bg-white border border-navy-200 space-y-3">
            <UserCheck className="w-8 h-8 mx-auto text-navy-300" />
            <p className="text-sm font-semibold">No staff members enrolled yet.</p>
            <p className="text-xs">Add employees so the booking engine can assign incoming appointments.</p>
            <button
              onClick={openAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-navy-950 text-gold-400 text-xs font-mono font-bold"
            >
              + Add First Member
            </button>
          </div>
        ) : (
          staffList.map((s) => (
            <div
              key={s.id}
              className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 ${
                s.is_active !== false
                  ? "border-navy-200 shadow-sm hover:border-gold-400"
                  : "border-navy-200 opacity-60 bg-navy-50/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-navy-950 text-gold-400 font-bold flex items-center justify-center text-sm">
                    {(s.name || "S")[0].toUpperCase()}
                  </div>
                  <button
                    onClick={() => handleToggleActive(s)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      s.is_active !== false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {s.is_active !== false ? "Active for Booking" : "On Leave / Inactive"}
                  </button>
                </div>

                <div>
                  <h3 className="font-display font-bold text-base text-navy-950">{s.name}</h3>
                  <div className="text-xs font-mono text-gold-700 font-semibold">
                    {(s as any).role || "Specialist"}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-navy-100 text-xs text-navy-600">
                  {s.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-navy-100 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(s)}
                  className="font-mono text-xs font-bold text-navy-700 hover:text-navy-950 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="font-mono text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100">
              <h2 className="font-display text-xl font-black uppercase text-navy-950">
                {editingStaff ? "Edit Staff Member" : "Add Team Member"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-navy-400 hover:text-navy-950 hover:bg-navy-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins or Dr. Arvind"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Stylist"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@business.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="staffActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-400"
                />
                <label htmlFor="staffActiveCheck" className="text-xs text-navy-700 font-medium">
                  Staff member is on-duty and eligible for automated appointment assignment
                </label>
              </div>

              <div className="pt-4 border-t border-navy-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-navy-600 hover:bg-navy-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gold-400 hover:brightness-110 text-navy-950 text-xs font-mono font-bold shadow-gold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving to Firestore..." : "Save Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
