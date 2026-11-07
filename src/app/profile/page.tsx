"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  User,
  Mail,
  Phone,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { uploadImageWithProgress } from "@/lib/storage/uploadHelper";

interface AppointmentItem {
  id: string;
  booking_reference: string;
  appointment_date: string;
  start_time: string;
  status: string;
  service_name?: string;
  business_id: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profile Form State
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [role, setRole] = useState("CUSTOMER");
  const [recentAppointments, setRecentAppointments] = useState<AppointmentItem[]>([]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();

      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

      if (!uid) {
        router.replace("/login?next=/profile");
        return;
      }

      setUserId(uid);

      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setEmail(uData.email || auth?.currentUser?.email || "");
          setFullName(uData.fullName || uData.displayName || "");
          setPhone(uData.phone || uData.phoneNumber || "");
          setAvatarUrl(uData.customerPhotoURL || uData.photoURL || uData.avatar_url || "");
          setRole(uData.role || "CUSTOMER");
        } else if (auth?.currentUser) {
          setEmail(auth.currentUser.email || "");
          setFullName(auth.currentUser.displayName || "");
          setAvatarUrl(auth.currentUser.photoURL || "");
        }

        // Load appointments for this customer
        const userEmail = (auth?.currentUser?.email || email).toLowerCase();
        if (userEmail) {
          const apptSnap = await getDocs(
            query(collection(db, "appointments"), where("customer_email", "==", userEmail))
          );
          const list = apptSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as AppointmentItem[];
          list.sort((a, b) => (b.appointment_date || "").localeCompare(a.appointment_date || ""));
          setRecentAppointments(list.slice(0, 5));
        }
      } catch (err) {
        console.error("Error loading customer profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Handle Photo File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setFeedback(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Image must be smaller than 5MB." });
      return;
    }

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatar(objectUrl);

    try {
      setUploadProgress(10);
      const res = await uploadImageWithProgress({
        file,
        type: "customer_profile",
        userId,
        onProgress: (p) => setUploadProgress(p),
      });

      setAvatarUrl(res.url);
      setPreviewAvatar(null);
      setUploadProgress(null);
      setFeedback({ type: "success", message: "Profile photo updated successfully!" });
    } catch (err: any) {
      setPreviewAvatar(null);
      setUploadProgress(null);
      setFeedback({ type: "error", message: err.message || "Failed to upload image. Previous photo retained." });
    }
  };

  // Remove Photo
  const handleRemovePhoto = async () => {
    if (!userId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { db } = getFirebaseClient();
      if (db) {
        await updateDoc(doc(db, "users", userId), {
          customerPhotoURL: "",
          photoURL: "",
          avatar_url: "",
          updatedAt: new Date().toISOString(),
        });
      }
      setAvatarUrl("");
      setPreviewAvatar(null);
      setFeedback({ type: "success", message: "Profile photo removed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to remove photo." });
    } finally {
      setSaving(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits && cleanDigits.length !== 10) {
      setFeedback({ type: "error", message: "Mobile number must be exactly 10 digits." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      await updateDoc(doc(db, "users", userId), {
        fullName: fullName.trim(),
        phone: cleanDigits,
        updatedAt: new Date().toISOString(),
      });

      setFeedback({ type: "success", message: "Profile details saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#046A38] mb-3" />
          <span className="font-mono text-xs text-[#707974]">Loading your profile...</span>
        </div>
        <Footer />
      </div>
    );
  }

  const currentDisplayPhoto = previewAvatar || avatarUrl;

  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors duration-200 flex flex-col justify-between selection:bg-[#046A38] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-8">
        {/* Header */}
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] dark:text-[#9EF6B6] font-bold">
            Account Management
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-black text-[#10251D] dark:text-[#FFFFFF] mt-1">
            My Customer Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] mt-1">
            Manage your personal identity, verified contact information, and appointment records.
          </p>
        </div>

        {/* Global Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-md border text-xs flex items-start gap-3 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-[#046A38] dark:text-[#9EF6B6]"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs flex flex-col items-center text-center space-y-4">
            {/* Avatar Container */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-[#F7F6F0] dark:bg-[#10251D] border-2 border-[#D8DED8] dark:border-[#D8DED8]/30 shadow-md flex items-center justify-center">
                {currentDisplayPhoto ? (
                  <img
                    src={currentDisplayPhoto}
                    alt={fullName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-3xl font-display font-black text-[#046A38]">
                    {(fullName || email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#046A38] text-white hover:bg-[#043D2E] shadow-md transition-all cursor-pointer"
                title="Upload new profile photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="w-full space-y-1">
                <div className="w-full bg-[#F7F6F0] dark:bg-[#10251D] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#046A38] h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#707974]">Uploading {uploadProgress}%</span>
              </div>
            )}

            <div>
              <h2 className="font-display text-base font-bold text-[#10251D] dark:text-[#FFFFFF]">
                {fullName || "Customer"}
              </h2>
              <p className="text-xs text-[#707974] dark:text-[#A7B9AA] truncate max-w-[200px]">{email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F6F0] dark:bg-[#10251D] text-[11px] font-mono font-bold text-[#046A38] dark:text-[#9EF6B6]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{role === "OWNER" ? "Business Owner" : "Verified Customer"}</span>
              </div>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={saving}
                className="text-xs font-mono text-rose-500 hover:text-rose-700 flex items-center gap-1.5 pt-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            )}

            {role === "OWNER" && (
              <div className="pt-4 border-t border-[#D8DED8] dark:border-[#D8DED8]/20 w-full">
                <Link
                  href="/app/overview"
                  className="w-full py-2.5 px-4 rounded-md text-xs font-mono font-bold bg-[#046A38] text-white hover:bg-[#043D2E] flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Business Dashboard</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Edit Profile Details Form */}
          <div className="md:col-span-2 space-y-6">
            <form
              onSubmit={handleSaveProfile}
              className="p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs space-y-5"
            >
              <div className="pb-3 border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
                <h3 className="font-display text-lg font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  Personal Details
                </h3>
                <p className="text-xs text-[#707974] dark:text-[#A7B9AA]">
                  Keep your booking contact details up to date for confirmations and reminders.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] focus:outline-none focus:border-[#046A38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-md text-[#707974] dark:text-[#A7B9AA] cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit phone number"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#046A38]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-md text-xs font-bold font-mono uppercase text-[#FFFFFF] bg-[#046A38] hover:bg-[#043D2E] active:scale-95 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Recent Bookings Card */}
            <div className="p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
                <h3 className="font-display text-base font-bold text-[#10251D] dark:text-[#FFFFFF]">
                  My Recent Bookings
                </h3>
                <span className="text-xs font-mono text-[#707974] dark:text-[#A7B9AA]">
                  {recentAppointments.length} Bookings
                </span>
              </div>

              {recentAppointments.length > 0 ? (
                <div className="space-y-2.5">
                  {recentAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-md bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-[#10251D] dark:text-[#FFFFFF] block">
                          {app.service_name || "Appointment Service"}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#707974] dark:text-[#A7B9AA]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#046A38] dark:text-[#9EF6B6]" /> {app.appointment_date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#707974]" /> {app.start_time}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                          app.status === "CONFIRMED"
                            ? "bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6]"
                            : app.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-[#D8DED8] text-[#10251D]"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#707974] dark:text-[#A7B9AA]">
                  <p>No previous appointments found for this account.</p>
                  <Link href="/#industries" className="text-[#046A38] dark:text-[#9EF6B6] font-bold mt-1 inline-block">
                    Explore appointment services →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
