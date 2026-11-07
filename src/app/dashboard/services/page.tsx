"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Layers, 
  Plus, 
  Clock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  Sparkles
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Service } from "@/types/database";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 500,
    is_active: true,
  });

  // Load Business and Services
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        // Sample local services for demonstration if credentials not configured
        setServices([
          {
            id: "local-srv-1",
            business_id: "demo-bus",
            name: "Hair Styling & Spa",
            description: "Deep conditioning steam treatment followed by bespoke haircut.",
            duration_minutes: 45,
            price: 1200,
            currency: "INR",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "local-srv-2",
            business_id: "demo-bus",
            name: "Aesthetic Skin Consultation",
            description: "Complete facial analysis and specialized dermatological skincare advice.",
            duration_minutes: 30,
            price: 800,
            currency: "INR",
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
            const srvSnap = await getDocs(query(collection(db, "services"), where("business_id", "==", bId)));
            const srvs = srvSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Service[];
            setServices(srvs);
          }
        }
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setForm({
      name: "",
      description: "",
      duration_minutes: 30,
      price: 500,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setForm({
      name: srv.name,
      description: srv.description || "",
      duration_minutes: srv.duration_minutes,
      price: srv.price,
      is_active: srv.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db || !businessId) {
      // Local state update when offline
      if (editingService) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...form } : s))
        );
      } else {
        const newLocal: Service = {
          id: `srv-${Date.now()}`,
          business_id: "demo-bus",
          ...form,
          currency: "INR",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setServices((prev) => [...prev, newLocal]);
      }
      setSaving(false);
      setModalOpen(false);
      setFeedback({ type: "success", message: "Service updated in memory." });
      return;
    }

    try {
      if (editingService) {
        await updateDoc(doc(db, "services", editingService.id), {
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_minutes: Number(form.duration_minutes),
          price: Number(form.price),
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        });

        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...form } : s))
        );
        setFeedback({ type: "success", message: "Service updated successfully in Firestore." });
      } else {
        const srvRef = doc(collection(db, "services"));
        const newService: Service = {
          id: srvRef.id,
          business_id: businessId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_minutes: Number(form.duration_minutes),
          price: Number(form.price),
          currency: "INR",
          is_active: form.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await setDoc(srvRef, newService);
        setServices((prev) => [...prev, newService]);
        setFeedback({ type: "success", message: "New service created successfully in Firestore." });
      }

      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save service" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate/delete this service?")) return;

    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, "services", id));
      setServices((prev) => prev.filter((s) => s.id !== id));
      setFeedback({ type: "success", message: "Service removed successfully from Firestore." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete service" });
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Service Catalog
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                {services.length} Active Services
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Configure bookable services, durations and fees
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E75A32] hover:bg-[#D24823] active:scale-[0.98] shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-[#C8E56A]/20 text-[#171717] border border-[#C8E56A]"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#171717] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#E75A32] mx-auto" />
              <p className="text-xs font-mono text-[#77736D]">Loading service catalog...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#DCD8CF] bg-white space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] text-[#171717] border border-[#DCD8CF] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6 text-[#E75A32]" />
              </div>
              <h3 className="font-display font-bold text-[#171717]">No Services Yet</h3>
              <p className="text-xs font-sans text-[#77736D] max-w-sm mx-auto">
                Add your first bookable appointment service to allow clients to schedule timeslots.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E75A32] hover:bg-[#D24823]"
              >
                Create First Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-6 rounded-2xl bg-white border border-[#DCD8CF] shadow-xs hover:border-[#171717] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        srv.is_active ? "bg-[#C8E56A]/20 text-[#171717] border border-[#C8E56A]" : "bg-[#FAF7F2] text-[#77736D] border border-[#DCD8CF]"
                      }`}>
                        {srv.is_active ? "Active & Bookable" : "Inactive"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1.5 text-[#77736D] hover:text-[#171717] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                          title="Edit Service"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id)}
                          className="p-1.5 text-[#77736D] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-display font-bold text-[#171717]">{srv.name}</h3>
                    {srv.description && (
                      <p className="text-xs font-sans text-[#77736D] leading-relaxed min-h-[32px]">
                        {srv.description}
                      </p>
                    )}

                    <div className="pt-3 border-t border-[#DCD8CF]/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#77736D] font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#E75A32]" />
                        <span>{srv.duration_minutes} mins</span>
                      </div>
                      <div className="font-display font-bold text-[#171717] text-base">
                        ₹{srv.price}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#171717]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#DCD8CF] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#DCD8CF] bg-white flex items-center justify-between">
              <h3 className="font-display font-bold text-[#171717] text-sm">
                {editingService ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-[#77736D] hover:text-[#171717] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Hair Spa & Cut"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief explanation of what the client receives during this session..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-mono"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hrs)</option>
                    <option value={120}>120 minutes (2 hrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-mono transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171717]">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded text-[#E75A32] focus:ring-[#E75A32]"
                  />
                  <span>Active and available for online booking</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#DCD8CF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-bold text-[#77736D] hover:text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-white bg-[#E75A32] hover:bg-[#D24823] shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingService ? "Update Service" : "Create Service"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
