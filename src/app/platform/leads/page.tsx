"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Plus,
  Search,
  Instagram,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface LeadItem {
  id: string;
  lead_source: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  instagram_profile?: string;
  interested_plan: string;
  follow_up_date: string;
  lead_status: "new" | "contacted" | "qualified" | "closed_won" | "lost";
  message?: string;
  created_at: string;
}

export default function PlatformLeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formSource, setFormSource] = useState("instagram");
  const [formBusiness, setFormBusiness] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formPlan, setFormPlan] = useState("business");
  const [formFollowUp, setFormFollowUp] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, "leads"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LeadItem[];
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setLeads(list);
    } catch (e) {
      console.error("Leads load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContact.trim() && !formBusiness.trim()) return;

    setSaving(true);
    const { db } = getFirebaseClient();
    if (!db) return;

    try {
      const newLead = {
        lead_source: formSource,
        business_name: formBusiness.trim(),
        contact_person: formContact.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
        instagram_profile: formInstagram.trim(),
        interested_plan: formPlan,
        follow_up_date: formFollowUp,
        lead_status: "new",
        message: formNotes.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "leads"), newLead);
      setLeads((prev) => [{ id: docRef.id, ...(newLead as any) }, ...prev]);
      setModalOpen(false);

      // Reset form
      setFormBusiness("");
      setFormContact("");
      setFormPhone("");
      setFormEmail("");
      setFormInstagram("");
      setFormNotes("");
    } catch (e) {
      console.error("Lead add error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: LeadItem["lead_status"]) => {
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      await updateDoc(doc(db, "leads", id), {
        lead_status: newStatus,
        updated_at: new Date().toISOString(),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, lead_status: newStatus } : l))
      );
    } catch (e) {
      console.error("Lead status update error:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      await deleteDoc(doc(db, "leads", id));
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error("Lead delete error:", e);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = statusFilter === "ALL" || l.lead_status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      (l.business_name || "").toLowerCase().includes(q) ||
      (l.contact_person || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.instagram_profile || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-3" />
        <span className="font-mono text-xs uppercase">Loading Sales CRM Leads from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
            Sales CRM & Lead Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            Website enquiries, Instagram outreach, and follow-up tracking • {leads.length} total records
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gold-400 text-navy-950 text-xs font-mono font-bold hover:brightness-110 shadow-gold flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prospect (Instagram / Referral)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-navy-900 border border-navy-800 overflow-x-auto">
          {["ALL", "new", "contacted", "qualified", "closed_won", "lost"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-gold-400 text-navy-950 shadow-gold"
                  : "text-navy-300 hover:text-white"
              }`}
            >
              {s.replace("_", " ")}
              <span className="ml-1 opacity-70 text-[10px]">
                ({s === "ALL" ? leads.length : leads.filter((l) => l.lead_status === s).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, IG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-navy-900 border border-navy-800 rounded-2xl text-white placeholder-navy-500 focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-3xl bg-navy-900 border border-navy-800 overflow-hidden shadow-lg">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-navy-400 space-y-2">
            <PhoneCall className="w-8 h-8 text-navy-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No CRM leads found.</p>
            <p className="text-xs">Website enquiries and manual Instagram prospects will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-200">
              <thead className="bg-navy-950 border-b border-navy-800 font-mono text-[11px] uppercase text-navy-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Business & Contact</th>
                  <th className="py-3.5 px-6 font-bold">Channels</th>
                  <th className="py-3.5 px-6 font-bold">Plan & Source</th>
                  <th className="py-3.5 px-6 font-bold">Follow-Up Date</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-navy-850 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">
                        {lead.business_name || "Unnamed Business"}
                      </div>
                      <div className="text-[11px] text-navy-300 mt-0.5">
                        Contact: {lead.contact_person || "N/A"}
                      </div>
                      {lead.message && (
                        <div className="text-[10px] text-navy-400 italic mt-0.5 truncate max-w-xs">
                          {lead.message}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-gold-300">
                          <Phone className="w-3 h-3 text-gold-400" />
                          <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-navy-300 text-[11px] mt-0.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-navy-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.instagram_profile && (
                        <div className="flex items-center gap-1.5 text-orange-400 text-[11px] mt-0.5">
                          <Instagram className="w-3 h-3" />
                          <span>{lead.instagram_profile}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-white uppercase">
                        {lead.interested_plan || "Professional"}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-navy-950 text-gold-400 border border-gold-500/20 uppercase">
                        {lead.lead_source}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-navy-300">
                      {lead.follow_up_date || "Not set"}
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={lead.lead_status}
                        onChange={(e) =>
                          handleUpdateStatus(lead.id, e.target.value as LeadItem["lead_status"])
                        }
                        className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-navy-950 border border-navy-700 text-gold-300 focus:outline-none focus:border-gold-400"
                      >
                        <option value="new">NEW</option>
                        <option value="contacted">CONTACTED</option>
                        <option value="qualified">QUALIFIED</option>
                        <option value="closed_won">CLOSED WON</option>
                        <option value="lost">LOST</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-lg"
                        title="Delete lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-navy-900 border border-gold-500/30 shadow-gold space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <h2 className="font-display text-xl font-black uppercase text-white">
                Add Sales Prospect / Lead
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-navy-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Lead Source *
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400 font-mono"
                  >
                    <option value="instagram">Instagram Outreach</option>
                    <option value="website_enquiry">Website Enquiry</option>
                    <option value="referral">Referral</option>
                    <option value="outbound">Direct Cold Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Interested Plan
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400 font-mono"
                  >
                    <option value="professional">Professional (₹499/mo)</option>
                    <option value="business">Business (₹999/mo)</option>
                    <option value="enterprise">Custom Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Aesthetic Clinic"
                    value={formBusiness}
                    onChange={(e) => setFormBusiness(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Verma"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@businesshandle"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@business.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-navy-400 mb-1">
                  Notes / Next Steps
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes from initial DM or call..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="pt-4 border-t border-navy-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-navy-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gold-400 text-navy-950 font-mono text-xs font-bold hover:brightness-110 shadow-gold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving to CRM..." : "Save Prospect"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
