"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Camera,
  Trash2,
  ShieldCheck,
  Compass,
  User,
  Sliders,
  Navigation,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { Business } from "@/types/database";
import { getUserPersonalBusiness, OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { uploadImageWithProgress } from "@/lib/storage/uploadHelper";

export default function SettingsPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ownerAvatarInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"business" | "location" | "owner" | "rules">("business");
  const [business, setBusiness] = useState<Business | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload progress states
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [ownerAvatarProgress, setOwnerAvatarProgress] = useState<number | null>(null);

  // Tab 1: Business Details & Logo
  const [bizForm, setBizForm] = useState({
    name: "",
    slug: "",
    category: "Salon",
    email: "",
    phone: "",
    description: "",
    website: "",
    timezone: "Asia/Kolkata",
    logo_url: "",
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  // Tab 2: Location & Map
  const [locForm, setLocForm] = useState({
    address: "",
    landmark: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    latitude: "19.0760",
    longitude: "72.8777",
  });
  const [locatingUser, setLocatingUser] = useState(false);

  // Tab 3: Owner Profile
  const [ownerForm, setOwnerForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    photoURL: "",
  });
  const [previewOwnerPhoto, setPreviewOwnerPhoto] = useState<string | null>(null);

  // Tab 4: Booking Rules
  const [rulesForm, setRulesForm] = useState({
    slot_interval_minutes: 30,
    buffer_minutes: 5,
    min_advance_hours: 2,
    max_advance_days: 30,
    cancellation_notice_hours: 4,
    confirmation_mode: "instant",
    publicBookingStatus: "ACTIVE",
  });

  const businessCategories = [
    "Salon",
    "Barbershop",
    "Spa",
    "Beauty & Aesthetics",
    "Clinic",
    "Dental Clinic",
    "Fitness Studio & Gym",
    "Consultant & Advisory",
    "Tutor & Coaching",
    "Other",
  ];

  const generateSlug = (rawName: string) => {
    return rawName
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
        const uid =
          auth?.currentUser?.uid ||
          (typeof document !== "undefined" &&
            (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
              document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

        if (uid) {
          const [userSnap, userCtx] = await Promise.all([
            getDoc(doc(db, "users", uid)),
            getUserPersonalBusiness(db, uid, auth?.currentUser?.email),
          ]);

          const uData = userSnap.exists() ? userSnap.data() : null;
          setCurrentUser({ uid, email: uData?.email || auth?.currentUser?.email, ...uData });

          const isFounder = userCtx.isOwner || userCtx.isFounder || userCtx.userEmail === OWNER_EMAIL;
          setIsOwner(isFounder);

          // Populate Owner Profile Form
          setOwnerForm({
            fullName: uData?.fullName || auth?.currentUser?.displayName || "Business Owner",
            phone: uData?.phone || "",
            email: uData?.email || auth?.currentUser?.email || "",
            photoURL: uData?.ownerPhotoURL || uData?.photoURL || uData?.avatar_url || "",
          });

          if (userCtx.business) {
            const bus = userCtx.business;
            setBusiness(bus);

            setBizForm({
              name: bus.name || "",
              slug: bus.slug || "",
              category: bus.category || "Salon",
              email: bus.email || "",
              phone: bus.phone || "",
              description: bus.description || "",
              website: (bus as any).website || "",
              timezone: bus.timezone || "Asia/Kolkata",
              logo_url: bus.logo_url || (bus as any).logoUrl || "",
            });

            setLocForm({
              address: bus.address || "",
              landmark: (bus as any).landmark || "",
              city: bus.city || "",
              state: (bus as any).state || "",
              postal_code: (bus as any).postal_code || (bus as any).pincode || "",
              country: bus.country || "India",
              latitude: String((bus as any).latitude || "19.0760"),
              longitude: String((bus as any).longitude || "72.8777"),
            });

            setRulesForm({
              slot_interval_minutes: bus.slot_interval_minutes || 30,
              buffer_minutes: bus.buffer_minutes || 5,
              min_advance_hours: bus.min_advance_hours || 2,
              max_advance_days: bus.max_advance_days || 30,
              cancellation_notice_hours: (bus as any).cancellation_notice_hours || 4,
              confirmation_mode: (bus as any).confirmation_mode || "instant",
              publicBookingStatus: (bus as any).publicBookingStatus || "ACTIVE",
            });
          }
        } else {
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;

    setFeedback(null);
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Business logo must be smaller than 5MB." });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewLogo(preview);

    try {
      setLogoUploadProgress(15);
      const res = await uploadImageWithProgress({
        file,
        type: "business_logo",
        businessId: business.id,
        onProgress: (p) => setLogoUploadProgress(p),
      });

      setBizForm((prev) => ({ ...prev, logo_url: res.url }));
      setPreviewLogo(null);
      setLogoUploadProgress(null);
      setFeedback({ type: "success", message: "Business logo updated successfully!" });
    } catch (err: any) {
      setPreviewLogo(null);
      setLogoUploadProgress(null);
      setFeedback({ type: "error", message: err.message || "Failed to upload business logo. Existing logo preserved." });
    }
  };

  const handleRemoveLogo = async () => {
    if (!business?.id) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { db } = getFirebaseClient();
      if (db) {
        await updateDoc(doc(db, "businesses", business.id), {
          logo_url: "",
          logoUrl: "",
          updated_at: new Date().toISOString(),
        });
      }
      setBizForm((prev) => ({ ...prev, logo_url: "" }));
      setPreviewLogo(null);
      setFeedback({ type: "success", message: "Business logo removed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to remove logo." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Owner Photo Upload
  const handleOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid) return;

    setFeedback(null);
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Owner profile photo must be smaller than 5MB." });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewOwnerPhoto(preview);

    try {
      setOwnerAvatarProgress(15);
      const res = await uploadImageWithProgress({
        file,
        type: "owner_profile",
        userId: currentUser.uid,
        onProgress: (p) => setOwnerAvatarProgress(p),
      });

      setOwnerForm((prev) => ({ ...prev, photoURL: res.url }));
      setPreviewOwnerPhoto(null);
      setOwnerAvatarProgress(null);
      setFeedback({ type: "success", message: "Owner profile photo updated successfully!" });
    } catch (err: any) {
      setPreviewOwnerPhoto(null);
      setOwnerAvatarProgress(null);
      setFeedback({ type: "error", message: err.message || "Failed to upload owner photo." });
    }
  };

  const handleRemoveOwnerPhoto = async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { db } = getFirebaseClient();
      if (db) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          ownerPhotoURL: "",
          photoURL: "",
          avatar_url: "",
          updatedAt: new Date().toISOString(),
        });
      }
      setOwnerForm((prev) => ({ ...prev, photoURL: "" }));
      setPreviewOwnerPhoto(null);
      setFeedback({ type: "success", message: "Owner profile photo removed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to remove photo." });
    } finally {
      setSaving(false);
    }
  };

  // Detect GPS Location
  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setFeedback({ type: "error", message: "Geolocation is not supported by your browser." });
      return;
    }

    setLocatingUser(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLocForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setLocatingUser(false);
        setFeedback({ type: "success", message: `GPS coordinates captured: ${lat}, ${lng}` });
      },
      (err) => {
        setLocatingUser(false);
        setFeedback({
          type: "error",
          message: err.message || "Could not retrieve GPS coordinates. Please enter them manually.",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Master Save Handler
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    setSaving(true);
    setFeedback(null);

    const { db } = getFirebaseClient();
    if (!db) {
      setFeedback({ type: "error", message: "Database connection unavailable." });
      setSaving(false);
      return;
    }

    try {
      const cleanSlug = generateSlug(bizForm.slug || bizForm.name);

      // Verify slug uniqueness if slug changed
      if (cleanSlug !== business.slug) {
        const slugQuery = query(collection(db, "businesses"), where("slug", "==", cleanSlug));
        const slugSnap = await getDocs(slugQuery);
        if (!slugSnap.empty && slugSnap.docs[0].id !== business.id) {
          setFeedback({
            type: "error",
            message: `The booking link slug '${cleanSlug}' is already taken. Please choose another.`,
          });
          setSaving(false);
          return;
        }
      }

      // Validate coordinates
      const latNum = parseFloat(locForm.latitude);
      const lngNum = parseFloat(locForm.longitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        setFeedback({ type: "error", message: "Latitude must be between -90 and 90." });
        setSaving(false);
        return;
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        setFeedback({ type: "error", message: "Longitude must be between -180 and 180." });
        setSaving(false);
        return;
      }

      const nowIso = new Date().toISOString();

      // 1. Update Business Record
      const updatedBusinessData = {
        name: bizForm.name.trim(),
        slug: cleanSlug,
        category: bizForm.category.trim(),
        email: bizForm.email.trim(),
        phone: bizForm.phone.trim(),
        description: bizForm.description.trim(),
        website: bizForm.website.trim(),
        timezone: bizForm.timezone,
        logo_url: bizForm.logo_url,
        logoUrl: bizForm.logo_url,

        address: locForm.address.trim(),
        landmark: locForm.landmark.trim(),
        city: locForm.city.trim(),
        state: locForm.state.trim(),
        postal_code: locForm.postal_code.trim(),
        country: locForm.country.trim(),
        latitude: latNum,
        longitude: lngNum,

        slot_interval_minutes: rulesForm.slot_interval_minutes,
        buffer_minutes: rulesForm.buffer_minutes,
        min_advance_hours: rulesForm.min_advance_hours,
        max_advance_days: rulesForm.max_advance_days,
        cancellation_notice_hours: rulesForm.cancellation_notice_hours,
        confirmation_mode: rulesForm.confirmation_mode,
        publicBookingStatus: rulesForm.publicBookingStatus,

        updated_at: nowIso,
        updatedAt: nowIso,
      };

      await updateDoc(doc(db, "businesses", business.id), updatedBusinessData);
      setBusiness((prev) => (prev ? ({ ...prev, ...updatedBusinessData } as any) : null));

      // 2. Update Owner Record
      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          fullName: ownerForm.fullName.trim(),
          phone: ownerForm.phone.trim(),
          updatedAt: nowIso,
        });
      }

      setBizForm((prev) => ({ ...prev, slug: cleanSlug }));
      setFeedback({ type: "success", message: "All business settings, logo, and location saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (typeof window !== "undefined" && bizForm.slug) {
      const fullUrl = `${window.location.origin}/book/${bizForm.slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading business configuration...</span>
      </div>
    );
  }

  const currentDisplayLogo = previewLogo || bizForm.logo_url;
  const currentDisplayOwnerPhoto = previewOwnerPhoto || ownerForm.photoURL;

  // Map Embed URL using OpenStreetMap
  const latVal = parseFloat(locForm.latitude) || 19.076;
  const lngVal = parseFloat(locForm.longitude) || 72.8777;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lngVal - 0.015}%2C${latVal - 0.01}%2C${lngVal + 0.015}%2C${latVal + 0.01}&layer=mapnik&marker=${latVal}%2C${lngVal}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latVal + "," + lngVal)}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase text-slate-900 dark:text-white break-words">
              Settings & Location
            </h1>
            {isOwner && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gold-400 text-navy-950 shadow-xs">
                OWNER ACCESS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-navy-400 mt-1">
            Manage your commercial identity, custom logo, GPS coordinates, and owner credentials
          </p>
        </div>

        {business && (
          <button
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gold-400 hover:brightness-105 active:scale-95 text-navy-950 text-xs font-mono font-bold shadow-sm flex items-center gap-2 self-start md:self-auto transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-navy-950" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200"
              : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-700 dark:text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "business"
              ? "bg-[#101A2B] text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Business Details & Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("location")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "location"
              ? "bg-[#101A2B] text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Location & Interactive Map</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("owner")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "owner"
              ? "bg-[#101A2B] text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Owner Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "rules"
              ? "bg-[#101A2B] text-white dark:bg-gold-400 dark:text-navy-950 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Booking Rules & Policies</span>
        </button>
      </div>

      {/* TAB 1: Business Details & Custom Logo */}
      {activeTab === "business" && (
        <div className="space-y-6">
          {/* Logo Management Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#C49A46]" />
                <span>Business Brand Logo</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your independent commercial logo. This logo appears dynamically on your public booking page, confirmation receipts, and customer appointment views.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
              {/* Logo Preview Container */}
              <div className="w-28 h-28 rounded-2xl bg-[#F7F5F0] dark:bg-navy-950 border-2 border-slate-200 dark:border-navy-700 flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0">
                {currentDisplayLogo ? (
                  <img
                    src={currentDisplayLogo}
                    alt={bizForm.name || "Business Logo"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400 text-xs font-mono">
                    <Building2 className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-navy-600" />
                    <span>No Logo</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#101A2B] text-white dark:bg-white dark:text-navy-950 hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{bizForm.logo_url ? "Change Logo" : "Upload Logo"}</span>
                  </button>

                  {bizForm.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-red-600 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {logoUploadProgress !== null && (
                  <div className="w-48 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gold-500 h-full transition-all duration-200"
                        style={{ width: `${logoUploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Uploading {logoUploadProgress}%</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Accepts PNG, JPG, WebP, SVG up to 5MB. Square or rectangular aspect ratios supported.
                </p>
              </div>
            </div>
          </div>

          {/* Business Details Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
            <div className="pb-3 border-b border-slate-100 dark:border-navy-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Commercial Profile Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Information displayed to customers on your public booking page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Business Category *
                </label>
                <select
                  value={bizForm.category}
                  onChange={(e) => setBizForm({ ...bizForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                >
                  {businessCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Public Booking Slug */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Public Booking Link Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 text-xs font-mono bg-slate-100 dark:bg-navy-950 text-slate-500 border border-r-0 border-slate-200 dark:border-navy-700 rounded-l-xl">
                    {typeof window !== "undefined" ? window.location.host : "visroslot.pages.dev"}/book/
                  </span>
                  <input
                    type="text"
                    required
                    value={bizForm.slug}
                    onChange={(e) => setBizForm({ ...bizForm, slug: generateSlug(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-r-xl"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="ml-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-mono flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-navy-800"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Public Phone
                </label>
                <input
                  type="tel"
                  value={bizForm.phone}
                  onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  value={bizForm.email}
                  onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={bizForm.website}
                  onChange={(e) => setBizForm({ ...bizForm, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={bizForm.description}
                  onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Location & Interactive Map */}
      {activeTab === "location" && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C49A46]" />
                  <span>Physical Address & GPS Coordinates</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accurate coordinates ensure customers get precise directions via Google Maps.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={locatingUser}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#101A2B] text-white dark:bg-gold-400 dark:text-navy-950 flex items-center gap-2 hover:brightness-105 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                {locatingUser ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{locatingUser ? "Detecting GPS..." : "Detect Current GPS"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Shop/Suite No, Street, Road"
                  value={locForm.address}
                  onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Near Metro Station / Mall"
                  value={locForm.landmark}
                  onChange={(e) => setLocForm({ ...locForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={locForm.city}
                  onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={locForm.state}
                  onChange={(e) => setLocForm({ ...locForm, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Postal Code / PIN
                </label>
                <input
                  type="text"
                  value={locForm.postal_code}
                  onChange={(e) => setLocForm({ ...locForm, postal_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Latitude (GPS)
                </label>
                <input
                  type="text"
                  value={locForm.latitude}
                  onChange={(e) => setLocForm({ ...locForm, latitude: e.target.value })}
                  placeholder="e.g. 19.0760"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Longitude (GPS)
                </label>
                <input
                  type="text"
                  value={locForm.longitude}
                  onChange={(e) => setLocForm({ ...locForm, longitude: e.target.value })}
                  placeholder="e.g. 72.8777"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Live Interactive Map Preview */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Interactive Location Preview
                </span>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#C49A46] hover:underline flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 shadow-inner bg-slate-100 dark:bg-navy-950 relative">
                <iframe
                  title="Business Location Preview"
                  width="100%"
                  height="100%"
                  src={mapEmbedUrl}
                  className="border-0"
                  loading="lazy"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Customers on your booking page can tap &quot;Get Directions&quot; to open GPS navigation directly to this location.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Owner Profile */}
      {activeTab === "owner" && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#C49A46]" />
                <span>Business Owner Identity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your personal owner credentials. This identity is kept strictly separate from your public commercial business logo.
              </p>
            </div>

            {/* Owner Photo Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
              <div className="w-24 h-24 rounded-full bg-[#F7F5F0] dark:bg-navy-950 border-2 border-slate-200 dark:border-navy-700 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {currentDisplayOwnerPhoto ? (
                  <img
                    src={currentDisplayOwnerPhoto}
                    alt={ownerForm.fullName || "Owner"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-display font-black text-[#C49A46]">
                    {(ownerForm.fullName || ownerForm.email || "O").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  ref={ownerAvatarInputRef}
                  onChange={handleOwnerPhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => ownerAvatarInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#101A2B] text-white dark:bg-white dark:text-navy-950 hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{ownerForm.photoURL ? "Change Photo" : "Upload Photo"}</span>
                  </button>

                  {ownerForm.photoURL && (
                    <button
                      type="button"
                      onClick={handleRemoveOwnerPhoto}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-red-600 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {ownerAvatarProgress !== null && (
                  <div className="w-48 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gold-500 h-full transition-all duration-200"
                        style={{ width: `${ownerAvatarProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Uploading {ownerAvatarProgress}%</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Accepts JPEG, PNG, WebP up to 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-navy-800">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerForm.fullName}
                  onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Direct Mobile Number
                </label>
                <input
                  type="tel"
                  value={ownerForm.phone}
                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                  placeholder="10-digit phone number"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Master Account Email (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={ownerForm.email}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Booking Rules & Policies */}
      {activeTab === "rules" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-navy-800">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C49A46]" />
              <span>Booking Rules & Operating Policies</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure slot intervals, buffer times, and public booking status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Public Booking Link Status
              </label>
              <select
                value={rulesForm.publicBookingStatus}
                onChange={(e) => setRulesForm({ ...rulesForm, publicBookingStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-mono font-bold"
              >
                <option value="ACTIVE">ACTIVE (Accepting Bookings)</option>
                <option value="PAUSED">PAUSED (Temporarily Suspended)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Slot Interval
              </label>
              <select
                value={rulesForm.slot_interval_minutes}
                onChange={(e) => setRulesForm({ ...rulesForm, slot_interval_minutes: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              >
                <option value={15}>15 minutes interval</option>
                <option value={30}>30 minutes interval</option>
                <option value={45}>45 minutes interval</option>
                <option value={60}>60 minutes interval</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Buffer Time Between Appointments
              </label>
              <select
                value={rulesForm.buffer_minutes}
                onChange={(e) => setRulesForm({ ...rulesForm, buffer_minutes: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              >
                <option value={0}>No buffer</option>
                <option value={5}>5 minutes buffer</option>
                <option value={10}>10 minutes buffer</option>
                <option value={15}>15 minutes buffer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Minimum Advance Notice
              </label>
              <select
                value={rulesForm.min_advance_hours}
                onChange={(e) => setRulesForm({ ...rulesForm, min_advance_hours: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              >
                <option value={1}>1 hour in advance</option>
                <option value={2}>2 hours in advance</option>
                <option value={4}>4 hours in advance</option>
                <option value={24}>24 hours (1 day) in advance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Maximum Advance Booking Window
              </label>
              <select
                value={rulesForm.max_advance_days}
                onChange={(e) => setRulesForm({ ...rulesForm, max_advance_days: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              >
                <option value={7}>Up to 7 days ahead</option>
                <option value={14}>Up to 14 days ahead</option>
                <option value={30}>Up to 30 days ahead</option>
                <option value={60}>Up to 60 days ahead</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                Cancellation Window
              </label>
              <select
                value={rulesForm.cancellation_notice_hours}
                onChange={(e) => setRulesForm({ ...rulesForm, cancellation_notice_hours: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl"
              >
                <option value={2}>Allow cancel up to 2 hours before</option>
                <option value={4}>Allow cancel up to 4 hours before</option>
                <option value={12}>Allow cancel up to 12 hours before</option>
                <option value={24}>Allow cancel up to 24 hours before</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Trigger */}
      {business && (
        <div className="pt-4 flex items-center justify-between">
          <Link
            href="/app/overview"
            className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            ← Back to Overview
          </Link>

          <button
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="px-8 py-3.5 rounded-full bg-gold-400 hover:brightness-105 active:scale-95 text-navy-950 text-xs font-mono font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-navy-950" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving All Changes..." : "Save All Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
