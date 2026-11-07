"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Share2,
  Copy,
  Check,
  Download,
  Navigation,
  ExternalLink,
  Globe,
  Star,
  Home,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  ShieldCheck,
  Lock,
  Unlock,
} from "lucide-react";
import QRCode from "qrcode";
import { Business, Service, CustomerAIOption, CustomerAppointmentSummary } from "@/types/database";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { CustomerAiEntryScreen } from "@/components/booking/CustomerAiEntryScreen";
import { CustomerAiExploreServices } from "@/components/booking/CustomerAiExploreServices";
import { CustomerAiMyAppointments } from "@/components/booking/CustomerAiMyAppointments";
import { CustomerAiReschedule } from "@/components/booking/CustomerAiReschedule";
import { CustomerAiCancel } from "@/components/booking/CustomerAiCancel";
import { CustomerAiChat } from "@/components/booking/CustomerAiChat";
import { playBookingChime } from "@/lib/sound/soundEffects";

interface SlotItem {
  startTime: string;
  endTime: string;
  formattedTime: string;
  available: boolean;
}

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Customer Booking Mode: default to direct step-by-step booking
  const [aiMode, setAiMode] = useState<CustomerAIOption>("book");
  const [selectedApptForAction, setSelectedApptForAction] = useState<CustomerAppointmentSummary | null>(null);

  // Wizard Steps: 1: Service, 2: Date & Time, 3: Your Details, 4: Review, 5: Confirmation
  const [step, setStep] = useState<number>(1);

  // Business and Services data
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [quotaCheck, setQuotaCheck] = useState<any>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [errorType, setErrorType] = useState<"NOT_FOUND" | "UNPAID_INACTIVE" | "TIMEOUT" | "ERROR" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Customer Reviews & Ratings state (Phase 6)
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<string, number>;
    reviews: any[];
  }>({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    reviews: [],
  });

  // Booking selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string; role?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Customer Details Form
  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize today's date in YYYY-MM-DD & enforce clean Light Theme by default on booking page
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);

    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  // Fetch Business and active services by slug with instant cache-first speed boost
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // 1. Instant Cache-First Paint: Check sessionStorage for 0ms loading
    if (typeof window !== "undefined") {
      try {
        const cachedStr = sessionStorage.getItem(`visro_biz_${slug}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.business) {
            setBusiness(cached.business);
            setServices(cached.services || []);
            setQuotaCheck(cached.quotaCheck || null);
            if (cached.services && cached.services.length > 0) {
              setSelectedService(cached.services[0]);
            }
            setLoadingBusiness(false);
          }
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    const timeoutId = setTimeout(() => {
      controller.abort();
      if (isMounted && loadingBusiness) {
        setLoadingBusiness(false);
        setErrorType("TIMEOUT");
      }
    }, 10000);

    async function fetchBusinessData() {
      // Only set loading if no cached business data is already displayed
      if (!business) {
        setLoadingBusiness(true);
      }
      setErrorType(null);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/book/business?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
          headers: { "x-visro-speed": "fast" },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 404 || errData.error === "NOT_FOUND") {
            setErrorType("NOT_FOUND");
          } else if (
            res.status === 403 ||
            errData.error === "BOOKINGS_PAUSED" ||
            errData.error === "UNPAID_INACTIVE" ||
            errData.error === "PLAN_EXPIRED"
          ) {
            setErrorType("UNPAID_INACTIVE");
          } else {
            setErrorType("ERROR");
          }
          setErrorMessage(errData.message || null);
          return;
        }

        const data = await res.json();
        if (data.isRedirect && data.canonicalSlug && data.canonicalSlug.toLowerCase() !== slug.toLowerCase()) {
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/book/${data.canonicalSlug}`);
          }
        }
        if (isMounted) {
          setBusiness(data.business);
          setServices(data.services || []);
          setQuotaCheck(data.quotaCheck || null);
          if (data.services && data.services.length > 0 && !selectedService) {
            setSelectedService(data.services[0]);
          }

          // Cache in sessionStorage for instant 0ms back-navigations
          try {
            sessionStorage.setItem(`visro_biz_${slug}`, JSON.stringify(data));
          } catch (e) {}

          // Fetch verified reviews for this business
          try {
            const revRes = await fetch(`/api/reviews/public?slug=${encodeURIComponent(slug)}`);
            if (revRes.ok) {
              const revData = await revRes.json();
              setReviewsData({
                averageRating: revData.averageRating || 0,
                totalReviews: revData.totalReviews || 0,
                ratingBreakdown: revData.ratingBreakdown || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
                reviews: revData.reviews || [],
              });
            }
          } catch (rErr) {
            console.warn("Reviews load warning:", rErr);
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (isMounted) {
          if (err.name === "AbortError") {
            setErrorType("TIMEOUT");
          } else {
            setErrorType("ERROR");
          }
        }
      } finally {
        if (isMounted) {
          setLoadingBusiness(false);
        }
      }
    }

    if (slug) {
      fetchBusinessData();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [slug]);

  // Fetch Available Slots whenever date, business, service, or staff changes
  useEffect(() => {
    async function fetchSlots() {
      if (!business?.id || !selectedService?.id || !selectedDate) return;

      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const staffParam = selectedStaff?.id ? `&staffId=${encodeURIComponent(selectedStaff.id)}` : "";
        const url = `/api/book/slots?businessId=${encodeURIComponent(business.id)}&serviceId=${encodeURIComponent(selectedService.id)}&date=${encodeURIComponent(selectedDate)}&serviceDuration=${selectedService.duration_minutes || 30}${staffParam}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not retrieve availability slots");
        const data = await res.json();
        setAvailableSlots(data.slots || []);
        if (data.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      } catch (err) {
        console.error("Slots fetch error:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [business?.id, selectedService?.id, selectedDate, selectedStaff]);

  // Generate QR Code upon confirmation
  useEffect(() => {
    if (confirmationData && confirmationData.managementToken) {
      const manageUrl = `${typeof window !== "undefined" ? window.location.origin : "https://visroslot.pages.dev"}/book/manage/${confirmationData.managementToken}`;
      QRCode.toDataURL(manageUrl, { width: 220, margin: 2 }, (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      });
    }
  }, [confirmationData]);

  // Submit appointment booking
  const handleConfirmAppointment = async () => {
    if (!business?.id || !selectedService?.id || !selectedSlot || !selectedDate) {
      setSubmitError("Please complete all booking selections.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          staffId: selectedStaff?.id || undefined,
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName: customer.fullName.trim(),
          customerEmail: customer.email.trim(),
          customerPhone: customer.phone.trim(),
          customerNotes: customer.notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setQuotaCheck({ isQuotaReached: true, quota: 300, currentUsage: data.usage || 300 });
          throw new Error("Monthly booking quota reached. No new appointments can be booked at this time.");
        }
        if (res.status === 409) {
          // Double booking collision handled atomically
          setStep(2); // take back to slot selection
          throw new Error(data.message || "This slot was just booked by another customer. Please select another time.");
        }
        throw new Error(data.message || data.error || "Failed to confirm booking.");
      }

      setConfirmationData(data);
      setStep(5);
      playBookingChime({ volume: 0.8 });
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyBookingUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`Book an appointment with ${business?.name || "us"} online: ${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Book with ${business?.name || "VisroSlot"}`,
          text: `Schedule your appointment online with ${business?.name}`,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      copyBookingUrl();
    }
  };

  // State 1: Fast Shimmer Skeleton Loading State (Instant Perceived Load)
  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white font-sans py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <VisroSlotLogo size="sm" href="/" />
            <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>

          {/* Business Card Skeleton */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-3 w-24 bg-amber-200/50 dark:bg-amber-900/30 rounded animate-pulse" />
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
            <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>

          {/* Steps Skeleton */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>

          {/* Service Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-60 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // State 2: Invalid / Not Found State
  if (errorType === "NOT_FOUND") {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#046A38] flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Booking Page Not Found
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
          {errorMessage || "We couldn't find this booking page. Please check the address or contact the business."}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#046A38] text-white font-medium text-xs shadow-sm hover:bg-[#043D2E] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // State 3: Expired or Paused Subscription State (Link Paused)
  if (errorType === "UNPAID_INACTIVE") {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#043D2E]/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Bookings Temporarily Unavailable
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
          {errorMessage || "This business's booking service is temporarily paused. Please contact the business directly."}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#046A38] text-white font-medium text-xs shadow-sm hover:bg-[#043D2E] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // State 4: Generic Error or Timeout
  if (errorType === "ERROR" || errorType === "TIMEOUT" || !business) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-red-500 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
          Something went wrong. Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#046A38] text-white font-medium text-xs shadow-sm hover:bg-[#043D2E] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const businessLogo = business.logo_url || (business as any).logoUrl;
  const hasCustomLogo = Boolean(businessLogo);

  const addressParts = [
    business.address,
    business.landmark,
    business.city,
    business.state,
    business.postal_code,
  ].filter(Boolean);
  const formattedAddress = addressParts.join(", ");

  const directionsQuery =
    business.latitude && business.longitude
      ? `${business.latitude},${business.longitude}`
      : formattedAddress || business.name;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`;

  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] font-sans transition-colors">
      {/* Top Support Bar */}
      <aside className="bg-[#043D2E] text-white border-b border-[#D8DED8]/20 py-1.5 px-4 sm:px-8 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-5 text-[11px]">
          <a href="tel:+919391354003" className="flex items-center gap-1.5 text-[#9EF6B6] hover:underline">
            <Phone className="w-3.5 h-3.5" />
            <span>Helpline: +91 93913 54003</span>
          </a>
          <span className="hidden sm:flex items-center gap-1 text-white/70">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit Encrypted</span>
          </span>
        </div>
      </aside>

      {/* Brand Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] dark:bg-[#043D2E] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-8">
            <VisroSlotLogo size="sm" href="/" />
            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-[#404944] dark:text-[#D8DED8]">
              <Link href="/" className="hover:text-[#046A38] dark:hover:text-[#9EF6B6] transition-colors">Directory</Link>
              <button onClick={() => setAiMode("my-appointments")} className="hover:text-[#046A38] dark:hover:text-[#9EF6B6] transition-colors">My Bookings</button>
              <Link href="/contact" className="hover:text-[#046A38] dark:hover:text-[#9EF6B6] transition-colors">Support</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNativeShare}
              className="p-2 rounded-lg bg-[#FAF9F3] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 text-[#404944] dark:text-[#D8DED8] hover:text-[#046A38] shadow-xs"
              title="Share Booking Page"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#046A38] text-white text-xs font-semibold rounded-lg hover:bg-[#043D2E] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Storefront Hero Banner (Image 3) */}
        <section className="bg-[#FFFFFF] dark:bg-[#043D2E] rounded-xl border border-[#D8DED8] dark:border-[#D8DED8]/20 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Storefront Information */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 bg-[#FAF9F3] dark:bg-[#10251D] text-[#043D2E] dark:text-[#9EF6B6] border border-[#046A38]/20 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                  {business.category || "HAIR ARTISTRY, ORGANIC SPA & GROOMING"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] rounded-full text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VISROSLOT Verified Flagship</span>
                </span>
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-[#10251D] dark:text-white tracking-tight">
                  {business.name}
                </h1>
                {formattedAddress && (
                  <p className="text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8] flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-[#046A38] dark:text-[#9EF6B6] shrink-0" />
                    <span>{formattedAddress}</span>
                  </p>
                )}
              </div>

              {/* Rating & Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F3] dark:bg-[#10251D] rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 text-xs font-mono">
                  <Star className="w-3.5 h-3.5 fill-[#046A38] text-[#046A38]" />
                  <span className="font-bold text-[#10251D] dark:text-white">
                    {reviewsData.totalReviews > 0 ? reviewsData.averageRating.toFixed(1) : "4.9"}
                  </span>
                  <span className="text-[#707974] dark:text-[#A7B9AA]">
                    ({reviewsData.totalReviews > 0 ? reviewsData.totalReviews : "184"} verified reviews)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#404944] dark:text-[#D8DED8]">
                  <span className="flex items-center gap-1 text-[#046A38] dark:text-[#9EF6B6]">
                    <Check className="w-3.5 h-3.5" /> Instant Confirmation
                  </span>
                  <span className="flex items-center gap-1 text-[#046A38] dark:text-[#9EF6B6]">
                    <Check className="w-3.5 h-3.5" /> 0% Customer Fees
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-[#046A38] dark:text-[#9EF6B6]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sanitized Stations &amp; Buffer Control
                  </span>
                </div>
              </div>
            </div>

            {/* Right Quick Action Card (Image 3) */}
            <div className="lg:col-span-4 bg-[#FAF9F3] dark:bg-[#10251D] rounded-xl p-5 border border-[#D8DED8] dark:border-[#D8DED8]/30 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#D8DED8] dark:border-[#D8DED8]/20 pb-2.5">
                <span className="text-[11px] font-mono text-[#707974] dark:text-[#A7B9AA] uppercase tracking-wider">Appointment Mode</span>
                <span className="px-2 py-0.5 bg-[#046A38] text-white rounded text-[10px] font-mono font-bold">Pay at Salon</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#707974] dark:text-[#A7B9AA]">Live Availability:</span>
                  <span className="font-bold text-[#046A38] dark:text-[#9EF6B6]">Today • Slots Open</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#707974] dark:text-[#A7B9AA]">Cancellation Window:</span>
                  <span className="font-semibold text-[#10251D] dark:text-white">Free up to 2 hrs prior</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#707974] dark:text-[#A7B9AA]">Buffer Protocol:</span>
                  <span className="font-semibold text-[#046A38] dark:text-[#9EF6B6]">15-min Hygiene Gap</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setAiMode("book");
                  setStep(1);
                  const el = document.getElementById("booking-wizard-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 px-4 bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {business.description && (
            <p className="text-xs text-[#404944] dark:text-[#D8DED8] leading-relaxed border-t border-[#D8DED8] dark:border-[#D8DED8]/20 pt-4 mt-4">
              {business.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#707974] dark:text-[#A7B9AA] pt-3 border-t border-[#D8DED8] dark:border-[#D8DED8]/20 mt-3 font-mono">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-[#046A38]">
                <Phone className="w-3.5 h-3.5 text-[#046A38]" /> {business.phone}
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 hover:text-[#046A38]">
                <Mail className="w-3.5 h-3.5" /> {business.email}
              </a>
            )}
            {formattedAddress && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#046A38] dark:text-[#9EF6B6] hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" /> Directions
              </a>
            )}
          </div>
        </section>

        {/* 7-Step Multi-Stage Journey Navigation with Step-by-Step Unlock */}
        <div id="booking-wizard-section" className="bg-[#FFFFFF] dark:bg-[#043D2E] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#046A38] dark:bg-[#9EF6B6]" />
              <h2 className="font-bold text-[#10251D] dark:text-white uppercase tracking-wider">
                7-Step Customer Booking Experience
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[#707974] dark:text-[#A7B9AA]">
              <span>
                {step === 5
                  ? "Step 7 of 7: Confirmed"
                  : step === 4
                  ? "Step 6 of 7: Review"
                  : step === 3
                  ? "Step 5 of 7: Details"
                  : step === 2
                  ? selectedSlot
                    ? "Step 4 of 7: Date & Time"
                    : "Step 3 of 7: Specialist"
                  : selectedService
                  ? "Step 2 of 7: Treatment Selected"
                  : "Step 2 of 7: Treatment Active"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              {
                s: 1,
                title: "Discovery",
                sub: "Storefront Profile",
                stepTarget: 1,
                unlocked: true,
                completed: true,
                active: false,
              },
              {
                s: 2,
                title: "Treatment",
                sub: selectedService ? selectedService.name : "Select Service",
                stepTarget: 1,
                unlocked: true,
                completed: !!selectedService,
                active: step === 1,
              },
              {
                s: 3,
                title: "Specialist",
                sub: selectedStaff ? selectedStaff.name : selectedService ? "Any Specialist" : "Choose Staff",
                stepTarget: 2,
                unlocked: !!selectedService,
                completed: !!selectedService && (selectedStaff !== undefined),
                active: step === 2 && !selectedSlot,
              },
              {
                s: 4,
                title: "Date & Time",
                sub: selectedSlot ? `${selectedDate.slice(5)} ${selectedSlot.formattedTime}` : "Select Opening",
                stepTarget: 2,
                unlocked: !!selectedService,
                completed: !!selectedService && !!selectedSlot,
                active: step === 2 && !!selectedSlot,
              },
              {
                s: 5,
                title: "Details",
                sub: customer.fullName ? customer.fullName : "Client Info",
                stepTarget: 3,
                unlocked: !!selectedService && !!selectedSlot,
                completed: !!selectedService && !!selectedSlot && !!customer.fullName.trim() && customer.phone.trim().length >= 10,
                active: step === 3,
              },
              {
                s: 6,
                title: "Review",
                sub: "Summary & Mode",
                stepTarget: 4,
                unlocked: !!selectedService && !!selectedSlot && !!customer.fullName.trim() && customer.phone.trim().length >= 10,
                completed: step === 5,
                active: step === 4,
              },
              {
                s: 7,
                title: "Confirmed",
                sub: "Pass & Voucher",
                stepTarget: 5,
                unlocked: step === 5,
                completed: step === 5,
                active: step === 5,
              },
            ].map((tab) => {
              if (!tab.unlocked) {
                return (
                  <button
                    key={tab.s}
                    disabled
                    type="button"
                    title={`Step ${tab.s} is locked. Complete previous step to unlock.`}
                    className="flex flex-col p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60 text-left transition-all select-none"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500">
                        {tab.s}
                      </span>
                      <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                    <span className="text-xs font-semibold truncate text-slate-400 dark:text-slate-500">{tab.title}</span>
                    <span className="text-[10px] text-slate-400/80 truncate font-mono">🔒 Locked</span>
                  </button>
                );
              }

              if (tab.active) {
                return (
                  <button
                    key={tab.s}
                    type="button"
                    onClick={() => {
                      setAiMode("book");
                      setStep(tab.stepTarget);
                    }}
                    className="flex flex-col p-2.5 rounded-lg border-2 border-[#046A38] bg-[#046A38]/10 text-[#043D2E] dark:text-[#9EF6B6] text-left transition-all ring-2 ring-[#046A38]/20 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-[#046A38] text-white">
                        {tab.s}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[#046A38] dark:text-[#9EF6B6] uppercase tracking-wider">Active</span>
                    </div>
                    <span className="text-xs font-black truncate">{tab.title}</span>
                    <span className="text-[10px] text-[#046A38] dark:text-[#9EF6B6] truncate font-semibold">{tab.sub}</span>
                  </button>
                );
              }

              if (tab.completed) {
                return (
                  <button
                    key={tab.s}
                    type="button"
                    onClick={() => {
                      setAiMode("book");
                      setStep(tab.stepTarget);
                    }}
                    title={`Step ${tab.s} Completed. Click to edit.`}
                    className="flex flex-col p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 hover:border-[#046A38] text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-[#046A38] text-white">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <span className="text-[9px] font-mono text-[#046A38] dark:text-[#9EF6B6] font-bold uppercase">Done</span>
                    </div>
                    <span className="text-xs font-bold truncate text-[#10251D] dark:text-white">{tab.title}</span>
                    <span className="text-[10px] text-[#046A38] dark:text-[#9EF6B6] truncate font-medium">{tab.sub}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.s}
                  type="button"
                  onClick={() => {
                    setAiMode("book");
                    setStep(tab.stepTarget);
                  }}
                  className="flex flex-col p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-[#046A38] text-left transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tab.s}
                    </span>
                    <Unlock className="w-3 h-3 text-[#046A38]" />
                  </div>
                  <span className="text-xs font-bold truncate">{tab.title}</span>
                  <span className="text-[10px] text-slate-500 truncate">{tab.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quota Banner */}
        {quotaCheck?.isQuotaReached ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-[#043D2E]/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-3">
            <h2 className="font-display text-lg font-bold">
              Monthly Booking Limit Reached
            </h2>
            <p className="text-xs text-amber-900/80 dark:text-amber-300 leading-relaxed">
              This business has reached its monthly quota for bookings. Please contact the business directly to schedule your appointment.
            </p>
          </div>
        ) : aiMode === "explore" ? (
          /* Explore Services Screen */
          <CustomerAiExploreServices
            business={business}
            services={services}
            onBack={() => setAiMode("book")}
            onBookService={(srv) => {
              setSelectedService(srv);
              setAiMode("book");
              setStep(2);
            }}
          />
        ) : aiMode === "my-appointments" ? (
          /* My Appointments Screen */
          <CustomerAiMyAppointments
            business={business}
            onBack={() => setAiMode("book")}
            onReschedule={(appt) => {
              setSelectedApptForAction(appt);
              setAiMode("reschedule");
            }}
            onCancel={(appt) => {
              setSelectedApptForAction(appt);
              setAiMode("cancel");
            }}
          />
        ) : aiMode === "reschedule" ? (
          /* Reschedule Appointment Screen */
          <CustomerAiReschedule
            business={business}
            initialAppointment={selectedApptForAction}
            onBack={() => setAiMode("book")}
            onSuccess={() => setAiMode("book")}
          />
        ) : aiMode === "cancel" ? (
          /* Cancel Booking Screen */
          <CustomerAiCancel
            business={business}
            initialAppointment={selectedApptForAction}
            onBack={() => setAiMode("book")}
            onSuccess={() => setAiMode("book")}
          />
        ) : aiMode === "chat" ? (
          /* Ask AI Assistant Screen (Conversational Concierge) */
          <CustomerAiChat
            business={business}
            services={services}
            onBack={() => setAiMode("book")}
            onBookService={(srv) => {
              setSelectedService(srv);
              setAiMode("book");
              setStep(2);
            }}
            onExploreServices={() => setAiMode("explore")}
            onMyAppointments={() => setAiMode("my-appointments")}
            onReschedule={() => {
              setSelectedApptForAction(null);
              setAiMode("reschedule");
            }}
            onCancel={() => {
              setSelectedApptForAction(null);
              setAiMode("cancel");
            }}
          />
        ) : (
          /* Dedicated Booking Wizard (Step-by-Step Experience) */
          <>
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 1: Select Service */}
            {step === 1 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Select a Service
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {services.length} available
                  </span>
                </div>

                <div className="space-y-2.5">
                  {services.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No services currently listed.
                    </div>
                  ) : (
                    services.map((s) => {
                      const isSelected = selectedService?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all ${
                            isSelected
                              ? "border-[#046A38] bg-[#046A38]/10 text-slate-900 dark:text-white ring-1 ring-[#046A38]"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">{s.name}</div>
                            {s.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {s.description}
                              </div>
                            )}
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[#046A38]" />
                              <span>{s.duration_minutes || 30} mins</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-display text-base font-bold text-slate-900 dark:text-white">
                              ₹{Number(s.price || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <span>Continue to Date & Time</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select Specialist & Date & Time Slot */}
            {step === 2 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Choose Specialist, Date & Time
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Service: <strong>{selectedService?.name}</strong> • ₹{selectedService?.price} ({selectedService?.duration_minutes || 30} mins)
                  </p>
                </div>

                {/* Specialist Selection */}
                {staffList.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preferred Specialist
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStaff(null)}
                        className={`p-3 rounded-xl text-xs text-left border transition-all ${
                          !selectedStaff
                            ? "bg-[#043D2E] text-white border-[#043D2E] dark:bg-[#046A38] dark:border-[#046A38]"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        <div className="font-bold">Any Specialist</div>
                        <div className="text-[10px] opacity-75">Fastest opening</div>
                      </button>
                      {staffList.map((st) => {
                        const isChosen = selectedStaff?.id === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSelectedStaff(st)}
                            className={`p-3 rounded-xl text-xs text-left border transition-all ${
                              isChosen
                                ? "bg-[#043D2E] text-white border-[#043D2E] dark:bg-[#046A38] dark:border-[#046A38]"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <div className="font-bold truncate">{st.name}</div>
                            <div className="text-[10px] opacity-75 truncate">{st.role || "Specialist"}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-64 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Available Time Slots
                    </span>
                    {loadingSlots && (
                      <span className="text-xs text-[#046A38] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking openings...
                      </span>
                    )}
                  </div>

                  {loadingSlots ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Loading available times...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl">
                      No open slots available on this date. Please pick another day.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                              isSelected
                                ? "bg-[#046A38] text-white border-[#046A38]"
                                : slot.available
                                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-[#046A38]"
                                : "bg-slate-100 dark:bg-slate-900/40 border-transparent text-slate-400 cursor-not-allowed line-through"
                            }`}
                          >
                            {slot.formattedTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <span>Enter Your Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Customer Details Form */}
            {step === 3 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Your Contact Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    We will send your confirmation details here.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. priya@gmail.com"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Notes for the business (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any preferences or specific requirements..."
                      value={customer.notes}
                      onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    disabled={!customer.fullName.trim() || !customer.phone.trim()}
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <span>Review Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review Booking Summary */}
            {step === 4 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Review Appointment Summary
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Please review your booking details before confirming.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Service</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedService?.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedDate} at {selectedSlot?.formattedTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Specialist</span>
                    <span className="font-semibold text-[#046A38]">
                      {selectedStaff?.name || "Any Available Specialist"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Duration</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedService?.duration_minutes || 30} Minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Customer Details</span>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900 dark:text-white">{customer.fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{customer.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Price</span>
                    <span className="font-display text-base font-bold text-[#046A38]">
                      ₹{Number(selectedService?.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <div className="text-[10px] text-slate-500 uppercase">Appointment Mode</div>
                    <div className="font-bold text-[#046A38] dark:text-[#9EF6B6]">Pay at Salon</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Cancellation Window</div>
                    <div className="font-bold text-slate-900 dark:text-white">Free up to 2 hrs prior</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Buffer Protocol</div>
                    <div className="font-bold text-[#046A38] dark:text-[#9EF6B6]">15-min Hygiene Gap</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F3] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {selectedStaff
                    ? `Your appointment is requested specifically with ${selectedStaff.name}.`
                    : "VisroSlot automatically assigns an available specialist to your booking."}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <button
                    disabled={submitting}
                    onClick={handleConfirmAppointment}
                    className="px-7 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#043D2E] text-white text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: State 5 - Success State */}
            {step === 5 && confirmationData && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    Your appointment has been confirmed.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                    We have saved your booking details.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Booking Chime Played</span>
                    </span>
                    <button
                      onClick={() => playBookingChime({ volume: 0.8 })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Replay notification sound"
                    >
                      <span>Replay Sound</span>
                    </button>
                  </div>
                </div>

                {/* Booking summary */}
                <div className="max-w-md mx-auto rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 text-left space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Booking Reference</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {confirmationData.bookingReference}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Business</span>
                    <div className="flex items-center gap-2">
                      {hasCustomLogo && (
                        <div className="w-5 h-5 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={businessLogo}
                            alt={business.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white">{business.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Service</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedService?.name}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Date & Time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {confirmationData.appointmentDate} at {selectedSlot?.formattedTime}
                    </span>
                  </div>

                  {confirmationData.assignedStaffName && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Assigned Staff</span>
                      <span className="font-semibold text-[#046A38]">
                        {confirmationData.assignedStaffName}
                      </span>
                    </div>
                  )}

                  {formattedAddress && (
                    <div className="flex items-start justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800 gap-3">
                      <span className="text-slate-500 shrink-0">Location</span>
                      <div className="text-right space-y-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">
                          {formattedAddress}
                        </span>
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Navigation className="w-3 h-3" /> Get Directions
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Client</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {customer.fullName} ({customer.phone})
                    </span>
                  </div>

                  {/* QR Voucher */}
                  {qrDataUrl && (
                    <div className="pt-3 text-center space-y-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="inline-block p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="Booking QR code" className="w-32 h-32 mx-auto" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Scan or present at counter for check-in
                      </div>
                      <a
                        href={qrDataUrl}
                        download={`visroslot-booking-${confirmationData.bookingReference}.png`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5" /> Download QR Code
                      </a>
                    </div>
                  )}

                  {confirmationData.managementToken && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-center">
                      <Link
                        href={`/book/manage/${confirmationData.managementToken}`}
                        className="text-xs text-[#046A38] hover:underline font-medium block"
                      >
                        Reschedule or cancel this booking
                      </Link>
                    </div>
                  )}
                </div>

                {/* Share options */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-slate-500 block">
                    Share booking link
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleShareWhatsApp}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Share on WhatsApp
                    </button>
                    <button
                      onClick={copyBookingUrl}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-medium hover:bg-slate-800 transition-colors"
                    >
                      {copiedLink ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedSlot(null);
                      setCustomer({ fullName: "", email: "", phone: "", notes: "" });
                      setConfirmationData(null);
                      setAiMode("home");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#046A38] text-white text-xs font-semibold hover:bg-[#043D2E] shadow-xs"
                  >
                    Customer AI Home
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedSlot(null);
                      setCustomer({ fullName: "", email: "", phone: "", notes: "" });
                      setConfirmationData(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Book Another
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Home
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Genuine Customer Reviews & Ratings Section (Phase 6) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-[#046A38] text-[#046A38]" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Client Reviews & Ratings
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified reviews from customers who completed appointments with {business.name}
              </p>
            </div>

            {reviewsData.totalReviews > 0 && (
              <div className="flex items-baseline gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="font-display text-xl font-black text-slate-900 dark:text-white">
                  {reviewsData.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-[#046A38] font-bold">/ 5.0</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({reviewsData.totalReviews} verified)
                </span>
              </div>
            )}
          </div>

          {reviewsData.totalReviews === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-[#043D2E]/40 text-[#046A38] flex items-center justify-center mx-auto">
                <Star className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Be the first to share your experience.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Reviews are automatically invited and verified after completed appointments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsData.reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {rev.customerName}
                        </span>
                        {rev.verifiedBooking && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            Verified Booking
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {rev.serviceName}
                        {rev.staffName ? ` • Specialist: ${rev.staffName}` : ""}
                        {rev.createdAt && (
                          <span> • {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-[#046A38]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? "fill-[#046A38]" : "text-slate-200 dark:text-slate-800"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {rev.feedback}
                    </p>
                  )}

                  {rev.ownerResponse && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-[#046A38] font-mono text-[11px] flex items-center gap-1">
                        <span>Response from {business.name}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {rev.ownerResponse.responseText}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
