"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Loader2,
  AlertCircle,
  Save,
  X,
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
import { Service, Business } from "@/types/database";

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadServices = async () => {
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
          // Strict Privacy: Do not leak another user's services
          setBusiness(null);
          setServices([]);
          setLoading(false);
          return;
        }

        if (activeBusId) {
          const servSnap = await getDocs(
            query(collection(db, "services"), where("business_id", "==", activeBusId))
          );
          const list = servSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[];
          list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setServices(list);
        }
      }
    } catch (e) {
      console.error("Error fetching services:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormName("");
    setFormPrice("");
    setFormDuration("30");
    setFormDescription("");
    setFormActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setFormName(s.name || "");
    setFormPrice(String(s.price || 0));
    setFormDuration(String(s.duration_minutes || 30));
    setFormDescription(s.description || "");
    setFormActive(s.is_active !== false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !business?.id) return;

    setSaving(true);
    setErrorMsg("");

    const { db } = getFirebaseClient();
    if (!db) {
      setErrorMsg("Database unavailable.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        business_id: business.id,
        name: formName.trim(),
        price: Number(formPrice) || 0,
        duration_minutes: Number(formDuration) || 30,
        description: formDescription.trim(),
        is_active: formActive,
        updated_at: new Date().toISOString(),
      };

      if (editingService?.id) {
        await updateDoc(doc(db, "services", editingService.id), payload);
      } else {
        await addDoc(collection(db, "services"), {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }

      setModalOpen(false);
      await loadServices();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      await deleteDoc(doc(db, "services", id));
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Error deleting service:", e);
    }
  };

  const handleToggleActive = async (s: Service) => {
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      const nextActive = !s.is_active;
      await updateDoc(doc(db, "services", s.id), {
        is_active: nextActive,
        updated_at: new Date().toISOString(),
      });
      setServices((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, is_active: nextActive } : item))
      );
    } catch (e) {
      console.error("Error toggling active:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-600">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading services from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Services & Pricing Catalog
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Configure service durations, appointment buffers, and fees • {services.length} active offerings
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-gold-400 hover:brightness-110 text-navy-950 text-xs font-mono font-bold shadow-gold flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full p-12 text-center text-navy-500 rounded-3xl bg-white border border-navy-200 space-y-3">
            <Layers className="w-8 h-8 mx-auto text-navy-300" />
            <p className="text-sm font-semibold">No services created yet.</p>
            <p className="text-xs">Add your first service to enable public client bookings.</p>
            <button
              onClick={openAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-navy-950 text-gold-400 text-xs font-mono font-bold"
            >
              + Create Service
            </button>
          </div>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 ${
                s.is_active !== false
                  ? "border-navy-200 shadow-sm hover:border-gold-400"
                  : "border-navy-200 opacity-60 bg-navy-50/50"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-black text-navy-950">
                    ₹{Number(s.price || 0).toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleToggleActive(s)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      s.is_active !== false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {s.is_active !== false ? "Active" : "Inactive"}
                  </button>
                </div>

                <h3 className="font-display font-bold text-base text-navy-950">{s.name}</h3>
                <p className="text-xs text-navy-500 line-clamp-2">
                  {s.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 pt-2 text-xs font-mono text-navy-600">
                  <span className="p-1 rounded-lg bg-navy-50">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <span>{s.duration_minutes || 30} Minutes Duration</span>
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

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100">
              <h2 className="font-display text-xl font-black uppercase text-navy-950">
                {editingService ? "Edit Service Offering" : "Create New Service"}
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
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Skin Consult or Deluxe Styling"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 750"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes (1 hr)</option>
                    <option value="90">90 Minutes (1.5 hr)</option>
                    <option value="120">120 Minutes (2 hr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1">
                  Description / Inclusions
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what is included in this service..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-400"
                />
                <label htmlFor="activeCheck" className="text-xs text-navy-700 font-medium">
                  Service is active and available for online booking
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
                  <span>{saving ? "Saving to Firestore..." : "Save Service"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
