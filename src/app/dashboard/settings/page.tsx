"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Building2, 
  Save, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Globe,
  RefreshCw,
  Lock
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Business } from "@/types/database";

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    description: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const uid = auth?.currentUser?.uid || (typeof document !== "undefined" && document.cookie.match(/slotora_session=([^;]+)/)?.[1]);
        if (uid) {
          let busDocSnap = null;
          const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
          if (!busSnap.empty) {
            busDocSnap = busSnap.docs[0];
          } else {
            setBusiness(null);
            setLoading(false);
            return;
          }

          if (busDocSnap) {
            const bus = { id: busDocSnap.id, ...busDocSnap.data() } as Business;
            setBusiness(bus);
            const isFounder = uid === "vMZQTGlYSfM8adohQAZmSE3cNX02" || auth?.currentUser?.email?.toLowerCase() === "rajkumar50036@gmail.com";
            if (isFounder || (bus as any).lifetime_free) {
              setIsPaid(true);
            } else {
              const subSnap = await getDocs(query(collection(db, "subscriptions"), where("business_id", "==", busDocSnap.id)));
              if (!subSnap.empty && subSnap.docs[0].data().status === "ACTIVE" && subSnap.docs[0].data().plan_id !== "free") {
                setIsPaid(true);
              }
            }
            setForm({
              name: bus.name,
              slug: bus.slug,
              category: bus.category,
              email: bus.email,
              phone: bus.phone,
              address: bus.address || "",
              city: bus.city,
              description: bus.description || "",
            });
          }
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleNameChange = (newName: string) => {
    const autoSlug = generateSlug(newName);
    setForm((prev) => ({
      ...prev,
      name: newName,
      slug: autoSlug || prev.slug,
    }));
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && form.slug) {
      const fullUrl = `${window.location.origin}/book/${form.slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const { db, isConfigured } = getFirebaseClient();

    if (!isConfigured || !db || !business) {
      setSaving(false);
      setFeedback({ type: "success", message: "Profile settings updated in memory." });
      return;
    }

    try {
      const cleanName = form.name.trim();
      let canonicalSlug = generateSlug(cleanName) || form.slug;
      
      const previousSlugs: string[] = (business as any).previous_slugs || [];
      if (business.slug && business.slug !== canonicalSlug && !previousSlugs.includes(business.slug)) {
        previousSlugs.push(business.slug);
      }

      // Check if another business owns this canonicalSlug
      const slugCheck = await getDocs(
        query(collection(db, "businesses"), where("slug", "==", canonicalSlug))
      );
      const isTakenByOther = slugCheck.docs.some((d) => d.id !== business.id);
      if (isTakenByOther) {
        canonicalSlug = `${canonicalSlug}-${Date.now().toString().slice(-4)}`;
      }

      const nowIso = new Date().toISOString();

      await updateDoc(doc(db, "businesses", business.id), {
        name: cleanName,
        slug: canonicalSlug,
        previous_slugs: previousSlugs,
        category: form.category.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        city: form.city.trim(),
        description: form.description.trim() || null,
        updated_at: nowIso,
      });

      const updatedBusiness = {
        ...business,
        name: cleanName,
        slug: canonicalSlug,
        previous_slugs: previousSlugs,
        updated_at: nowIso,
      };
      setBusiness(updatedBusiness);
      setForm((prev) => ({ ...prev, name: cleanName, slug: canonicalSlug }));

      setFeedback({ 
        type: "success", 
        message: `Business name and public booking URL (/book/${canonicalSlug}) successfully synchronized!` 
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Business Profile & Booking Link
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                Synchronized Matrix
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Synchronize brand identity, public URL slug, and contact channels
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
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
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Synchronized Public Booking Link Card */}
          <div className="p-6 rounded-2xl bg-[#171717] text-[#F5F0E6] border border-[#262626] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E75A32]">
                  Public Booking Engine
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#C8E56A]/20 text-[#C8E56A] border border-[#C8E56A]/40">
                  Auto-Synchronized
                </span>
              </div>
              <div className="text-base sm:text-lg font-mono font-bold mt-1 text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E75A32] shrink-0" />
                <span>slotora.com/book/{form.slug || "your-business"}</span>
              </div>
              <p className="text-xs font-sans text-[#A39E93] mt-0.5">
                Changing your business name automatically updates your public booking slug while redirecting previous links.
              </p>
            </div>

            {!isPaid ? (
              <Link
                href="/pricing"
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5"
                title="Paid subscription required to activate public sharing link"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Sharing Link Locked</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!form.slug}
                  className="px-4 py-2 rounded-xl bg-[#E75A32] hover:bg-[#D24823] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 active:scale-[0.98]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
                {form.slug && (
                  <Link
                    href={`/book/${form.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-white transition-colors border border-[#333333]"
                    title="Open client booking page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#DCD8CF] p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-display font-bold text-[#171717]">Brand & Contact Details</h2>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Beauty Studio"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
              />
              <span className="text-[11px] font-sans text-[#77736D] mt-1 block">
                Public booking link slug will be: <span className="font-mono text-[#E75A32] font-semibold">/book/{form.slug || "..."}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salon & Spa"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  Official Contact Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@business.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-mono placeholder:text-[#A39E93] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. Linking Road, Bandra West"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#77736D] mb-1">
                Business Description
              </label>
              <textarea
                rows={3}
                placeholder="Tell clients about your services, specialized equipment or signature treatments..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCD8CF] rounded-xl focus:outline-none focus:border-[#E75A32] text-[#171717] font-sans placeholder:text-[#A39E93] transition-colors resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#E75A32] hover:bg-[#D24823] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#E75A32]/20 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Synchronize</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
