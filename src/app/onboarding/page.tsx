"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Globe,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Plus,
  Users,
  Briefcase,
  Layers,
  ArrowLeft,
  CreditCard,
  XCircle,
  Trash2,
  Edit2,
  Calendar,
  Sliders,
  LogOut,
  Save,
} from "lucide-react";
import { VisroSlotLogo } from "@/components/brand/VisroSlotLogo";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getBookingUrlForSlug, getPlatformDisplayHost } from "@/lib/config/domain";

interface ServiceItem {
  id?: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface StaffItem {
  id?: string;
  name: string;
  phone: string;
  email: string;
  role_title: string;
  is_active: boolean;
}

interface DaySchedule {
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepParam = searchParams.get("step");
  const initialPlanParam = searchParams.get("plan");
  const initialCycleParam = searchParams.get("cycle") as "monthly" | "yearly" | null;

  // Master Step State (1 through 8 locked step-by-step)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingState, setSavingState] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const goToStep = (targetStep: number) => {
    if (targetStep <= maxUnlockedStep) {
      if (!isPaymentVerified && targetStep > 2) {
        setFeedbackError("Please complete the AutoPay mandate authorization in Step 2 to unlock your business profile.");
        return;
      }
      setCurrentStep(targetStep);
      setFeedbackError(null);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (!isPaymentVerified && targetStep > 2) {
      setFeedbackError("AutoPay mandate payment is required first. Please complete Step 2 to unlock Step 3.");
    }
  };

  const advanceToStep = (nextStep: number) => {
    setMaxUnlockedStep((prev) => Math.max(prev, nextStep));
    setCurrentStep(nextStep);
    setFeedbackError(null);
    persistProgress(nextStep);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Step 2: Plan State & Payment Gateway
  const [selectedPlan, setSelectedPlan] = useState<"professional" | "business">("professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isTrialActive, setIsTrialActive] = useState(true);
  const [isOldUser, setIsOldUser] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [hostedMandateUrl, setHostedMandateUrl] = useState<string | null>(null);
  const [checkingMandateStatus, setCheckingMandateStatus] = useState(false);

  // Step 3: Business Profile State
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Salon");
  const [phone, setPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [bookingUrl, setBookingUrl] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Step 4: Services State
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("General");
  const [newServicePrice, setNewServicePrice] = useState("499");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceDesc, setNewServiceDesc] = useState("Standard service session");

  // Step 5: Staff State
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Specialist");

  // Step 6: Working Hours State
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day_of_week: 1, day_name: "Monday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 2, day_name: "Tuesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 3, day_name: "Wednesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 4, day_name: "Thursday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 5, day_name: "Friday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 6, day_name: "Saturday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 0, day_name: "Sunday", is_open: false, open_time: "10:00", close_time: "17:00" },
  ]);
  const [breakStartTime, setBreakStartTime] = useState("13:00");
  const [breakEndTime, setBreakEndTime] = useState("14:00");
  const [hasBreak, setHasBreak] = useState(true);

  // Step 7: Booking Settings State
  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(5);
  const [minAdvanceHours, setMinAdvanceHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(4);
  const [allowRescheduling, setAllowRescheduling] = useState(true);
  const [confirmationMode, setConfirmationMode] = useState<"instant" | "manual">("instant");

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

  // Staff limits based on plan
  const maxStaffAllowed = selectedPlan === "business" ? 10 : 3;

  // Auto-slug generator
  const handleNameInput = (val: string) => {
    setName(val);
    if (!businessId) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
      setBookingUrl(getBookingUrlForSlug(generated));
      checkSlugAvailability(generated);
    }
  };

  const checkSlugAvailability = async (testSlug: string) => {
    if (!testSlug || testSlug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const { db } = getFirebaseClient();
      if (!db) return;
      const snap = await getDocs(query(collection(db, "businesses"), where("slug", "==", testSlug)));
      if (snap.empty) {
        setSlugAvailable(true);
      } else {
        const docOwner = snap.docs[0].data().owner_id;
        setSlugAvailable(docOwner === currentUser?.uid);
      }
    } catch (e) {
      console.warn("Slug check warning:", e);
    } finally {
      setSlugChecking(false);
    }
  };

  // Initial Load & Resume Resolution (High Speed Mount)
  useEffect(() => {
    let isMounted = true;
    const { auth, db } = getFirebaseClient();
    if (!auth || !db) {
      router.replace("/login?next=/onboarding");
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;

      const cookieUid =
        typeof document !== "undefined"
          ? (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
              document.cookie.match(/slotora_session=([^;]+)/)?.[1])
          : null;

      const uid = firebaseUser?.uid || cookieUid;

      if (!uid) {
        router.replace("/login?next=/onboarding");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const uData = userSnap.exists() ? userSnap.data() : null;
        const userEmail = uData?.email || firebaseUser?.email || "";
        if (!isMounted) return;

        setCurrentUser({ uid, email: userEmail, fullName: uData?.fullName || "Business Owner" });

        if (uData?.phone) setPhone(uData.phone);
        if (uData?.plan) setSelectedPlan(uData.plan);
        if (uData?.billing_cycle) setBillingCycle(uData.billing_cycle);
        if (initialPlanParam === "business" || initialPlanParam === "professional") {
          setSelectedPlan(initialPlanParam);
        }
        if (initialCycleParam === "yearly" || initialCycleParam === "monthly") {
          setBillingCycle(initialCycleParam);
        }

        // Check subscriptions collection if user doc doesn't have it explicitly
        let hasActiveSub = false;
        try {
          const subQuery = await getDocs(
            query(
              collection(db, "subscriptions"),
              where("user_id", "==", uid)
            )
          );
          if (!subQuery.empty) {
            hasActiveSub = subQuery.docs.some((sDoc) => {
              const d = sDoc.data();
              const st = String(d.status || d.subscriptionStatus || "").toLowerCase();
              return ["active", "trialing", "authenticated"].includes(st);
            });
          }
        } catch (subErr) {
          console.warn("Sub collection check non-fatal:", subErr);
        }

        const rawSubStatus = String(uData?.subscription_status || uData?.subscriptionStatus || "").toLowerCase();
        const rawAccountStatus = String(uData?.accountStatus || "").toLowerCase();

        const isUserVerified = Boolean(
          hasActiveSub ||
          uData?.payment_verified === true ||
          uData?.payment_verified === "true" ||
          uData?.payment_verified === "verified" ||
          uData?.paymentVerified === true ||
          uData?.paymentVerified === "true" ||
          rawAccountStatus === "trial_active" ||
          rawAccountStatus === "active" ||
          ["active", "trialing", "authenticated"].includes(rawSubStatus)
        );
        setIsPaymentVerified(isUserVerified);

        // Check if user is an old user (no trial for old users, direct plan only)
        const hasPriorTrial = Boolean(
          uData?.trial_used === true ||
          (uData?.trial_started_at && uData?.trial_expires_at && new Date(uData.trial_expires_at) < new Date()) ||
          (uData?.is_trial === false && (uData?.payment_verified === true || uData?.paymentVerified === true))
        );
        setIsOldUser(hasPriorTrial);
        if (hasPriorTrial) {
          setIsTrialActive(false);
        }

        // FAST LOAD PATH: If user is not yet verified, immediately unlock Step 2 and stop loading spinner!
        if (!isUserVerified) {
          setMaxUnlockedStep(2);
          setCurrentStep(2);
          setLoadingInitial(false);
          return;
        }

        // Parallel resolution for verified business profile setup
        let busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
        if (busSnap.empty && userEmail) {
          busSnap = await getDocs(query(collection(db, "businesses"), where("owner_email", "==", userEmail.toLowerCase())));
        }

        let loadedBusId: string | null = null;
        if (!busSnap.empty) {
          const bDoc = busSnap.docs[0];
          loadedBusId = bDoc.id;
          setBusinessId(bDoc.id);
          const bData = bDoc.data();
          setName(bData.name || "");
          setSlug(bData.slug || "");
          setCategory(bData.category || "Salon");
          setPhone(bData.phone || uData?.phone || "");
          setBizEmail(bData.email || userEmail);
          setAddress(bData.address || "");
          setCity(bData.city || "");
          setState(bData.state || "");
          setCountry(bData.country || "India");
          setWebsite(bData.website || "");
          setDescription(bData.description || "");
          setTimezone(bData.timezone || "Asia/Kolkata");
          setBookingUrl(getBookingUrlForSlug(bData.slug || ""));

          if (bData.slot_interval_minutes) setSlotInterval(bData.slot_interval_minutes);
          if (bData.buffer_minutes) setBufferMinutes(bData.buffer_minutes);
          if (bData.min_advance_hours) setMinAdvanceHours(bData.min_advance_hours);
          if (bData.max_advance_days) setMaxAdvanceDays(bData.max_advance_days);

          // Concurrent fetch for sub-collections
          const [servSnap, stSnap, hrSnap] = await Promise.all([
            getDocs(query(collection(db, "services"), where("business_id", "==", bDoc.id))),
            getDocs(query(collection(db, "staff"), where("business_id", "==", bDoc.id))),
            getDocs(query(collection(db, "business_hours"), where("business_id", "==", bDoc.id))),
          ]);

          const services = servSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceItem[];
          setServicesList(services);

          const staff = stSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as StaffItem[];
          setStaffList(staff);

          if (!hrSnap.empty) {
            const hours = hrSnap.docs.map((d) => d.data());
            const mapped = DAYS_OF_WEEK.map((dayName, dow) => {
              const match = hours.find((h: any) => h.day_of_week === dow);
              return {
                day_of_week: dow,
                day_name: dayName,
                is_open: match ? match.is_open : dow !== 0,
                open_time: match ? match.open_time.slice(0, 5) : "09:00",
                close_time: match ? match.close_time.slice(0, 5) : "19:00",
              };
            });
            setSchedule(mapped);
          }
        }

        // Step routing after verification
        let resolvedStep = 3;
        if (initialStepParam === "plan") resolvedStep = 2;
        else if (initialStepParam === "profile") resolvedStep = 3;
        else if (initialStepParam === "services") resolvedStep = 4;
        else if (initialStepParam === "staff") resolvedStep = 5;
        else if (initialStepParam === "hours") resolvedStep = 6;
        else if (initialStepParam === "settings") resolvedStep = 7;
        else if (initialStepParam === "review") resolvedStep = 8;
        else {
          if (!loadedBusId) {
            resolvedStep = 3;
          } else if (servicesList.length === 0) {
            resolvedStep = 4;
          } else if (staffList.length === 0) {
            resolvedStep = 5;
          } else {
            resolvedStep = 6;
          }
        }

        const savedProgress = uData?.onboarding_step ? Number(uData.onboarding_step) : 3;
        const initialMax = Math.max(savedProgress, resolvedStep, 3);
        setMaxUnlockedStep(initialMax);
        setCurrentStep(Math.min(resolvedStep, initialMax));
      } catch (err: any) {
        console.warn("Init onboarding warning:", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, initialPlanParam, initialCycleParam, initialStepParam]);

  // Persist progress helper
  const persistProgress = async (stepToSave: number) => {
    if (!currentUser?.uid) return;
    try {
      const { db } = getFirebaseClient();
      if (!db) return;
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          onboarding_step: isPaymentVerified ? stepToSave : Math.min(stepToSave, 2),
          plan: selectedPlan,
          billing_cycle: billingCycle,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Could not persist onboarding step:", e);
    }
  };

  // Step 2: Razorpay Payment Gateway & AutoPay Checkout Flow
  const handleAuthorizePlanGateway = async (preferDirect = false) => {
    setPaymentProcessing(true);
    setFeedbackError(null);

    const uid = currentUser?.uid;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();

    try {
      // 1. Call server-side create-order endpoint
      const res = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId || `pending_${uid || Date.now()}`,
          userId: uid,
          plan: selectedPlan,
          cycle: billingCycle,
          trial: preferDirect ? false : !isOldUser,
          directPayment: preferDirect,
        }),
      });

      const orderData = await res.json();

      // If user already has an active subscription, trial, or founder access, unlock Step 3 immediately!
      if (orderData.alreadySubscribed || (orderData.success && (orderData.isFounder || orderData.isOwner))) {
        setIsPaymentVerified(true);
        setIsTrialActive(true);
        setFeedbackSuccess(orderData.message || "Your subscription is already active! Step 3 unlocked.");
        setMaxUnlockedStep((prev) => Math.max(prev, 3));
        advanceToStep(3);
        setPaymentProcessing(false);
        return;
      }

      if (!res.ok || (!orderData.subscriptionId && !orderData.orderId)) {
        throw new Error(
          orderData.error ||
          orderData.details ||
          "Failed to initialize payment gateway. Please try again."
        );
      }

      if (orderData.shortUrl) {
        setHostedMandateUrl(orderData.shortUrl);
      }

      const isTrialFlow = Boolean(orderData.isTrial);

      // 2. Dynamically load Razorpay Checkout SDK if not yet loaded
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK."));
          document.body.appendChild(script);
        });
      }

      const RazorpaySDK = (window as any).Razorpay;
      if (!RazorpaySDK) {
        // Fallback: If SDK cannot load on client, redirect directly to Razorpay's hosted AutoPay link
        if (orderData.shortUrl) {
          window.location.href = orderData.shortUrl;
          return;
        }
        throw new Error("Razorpay gateway SDK unavailable. Please check your network connection.");
      }

      // 3. Open Razorpay Checkout Modal (AutoPay Mandate Setup with ₹2 Token or Direct Plan)
      const options: any = {
        key: orderData.keyId,
        name: "VISROSLOT",
        image: "/icons/icon-192x192.png",
        prefill: {
          name: currentUser?.displayName || name || "Business Owner",
          email: currentUser?.email || "",
          contact: phone || "",
        },
        theme: {
          color: "#046A38", // Strict VISROSLOT Emerald Green
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setFeedbackError(
              isTrialFlow
                ? "AutoPay mandate authorization is required to continue. Please complete the ₹2 bank verification to unlock Step 3."
                : "Payment was not completed. Please authorize the subscription plan payment to unlock Step 3."
            );
          },
        },
        handler: async (response: any) => {
          try {
            setPaymentProcessing(true);
            setFeedbackSuccess(
              isTrialFlow
                ? "AutoPay mandate authorized! Verifying and processing immediate ₹2 refund to your bank account..."
                : "Payment authorized! Verifying subscription and unlocking business setup..."
            );

            // 4. Server-Side HMAC-SHA256 Signature Verification & Immediate ₹2 Refund
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessId: businessId || `pending_${uid || Date.now()}`,
                userId: uid,
                plan: selectedPlan,
                cycle: billingCycle,
                subscriptionId: response.razorpay_subscription_id || orderData.subscriptionId || null,
                orderId: response.razorpay_order_id || orderData.orderId || null,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                isTrial: isTrialFlow,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            setIsPaymentVerified(true);
            setIsTrialActive(isTrialFlow);
            setFeedbackSuccess(
              isTrialFlow
                ? "AutoPay mandate verified! ₹2 verification token has been refunded to your bank account. Step 3 unlocked."
                : "Subscription payment confirmed! Step 3 unlocked."
            );

            // Update user in Firestore
            const { db } = getFirebaseClient();
            if (db && uid) {
              await setDoc(
                doc(db, "users", uid),
                {
                  plan: selectedPlan,
                  billing_cycle: billingCycle,
                  subscription_status: isTrialFlow ? "trialing" : "active",
                  subscriptionStatus: isTrialFlow ? "TRIALING" : "ACTIVE",
                  payment_verified: true,
                  paymentVerified: true,
                  is_unlimited: selectedPlan === "business",
                  is_trial: isTrialFlow,
                  trial_used: true,
                  subscription_expires_at: expiresAt,
                  onboarding_step: 3,
                  updatedAt: nowIso,
                },
                { merge: true }
              );
            }

            // ONLY AFTER VERIFICATION SUCCESS: ADVANCE TO STEP 3
            advanceToStep(3);
            setTimeout(() => {
              const el = document.getElementById("business-name-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
              }
            }, 200);
          } catch (verErr: any) {
            setFeedbackError(verErr.message || "Payment verification failed.");
          } finally {
            setPaymentProcessing(false);
          }
        },
      };

      // Critical: Attach subscription ID for recurring AutoPay mandate, or order ID for direct payment
      if (orderData.subscriptionId) {
        options.subscription_id = orderData.subscriptionId;
      } else if (orderData.orderId) {
        options.order_id = orderData.orderId;
        options.amount = orderData.amount;
      }

      const rzpInstance = new RazorpaySDK(options);
      rzpInstance.on("payment.failed", (resp: any) => {
        const desc = resp.error?.description || "";
        if (desc.toLowerCase().includes("website") || desc.toLowerCase().includes("match")) {
          // If Razorpay domain check blocks domain, seamlessly redirect to official rzp.io checkout!
          if (orderData.shortUrl) {
            window.location.href = orderData.shortUrl;
            return;
          }
          setFeedbackError(
            `Razorpay Domain Notice: ${getPlatformDisplayHost()} needs to be registered in your Razorpay Dashboard. You can also click 'Open Portal ↗' below to authorize directly on Razorpay's servers.`
          );
        } else if (
          desc.toLowerCase().includes("restricted") ||
          desc.toLowerCase().includes("autopay") ||
          desc.toLowerCase().includes("different account") ||
          desc.toLowerCase().includes("bank")
        ) {
          setFeedbackError(
            "Bank Notice: FamPay, prepaid wallets, and certain accounts are restricted by NPCI from recurring UPI AutoPay. Please select a regular bank account (SBI, HDFC, ICICI, Axis, Kotak, etc.) or a Debit Card in the payment options."
          );
        } else {
          setFeedbackError(
            desc || "Payment authorization was interrupted. Please complete the setup in the payment gateway."
          );
        }
        setPaymentProcessing(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay AutoPay Notice:", err);
      setFeedbackError(
        err.message || "Failed to initialize payment gateway. Please ensure your internet connection is active and retry."
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Direct sync check for when user completes mandate via Razorpay hosted portal or external UPI app
  const checkMandateStatusDirect = async () => {
    if (!currentUser?.uid) return;
    setCheckingMandateStatus(true);
    setFeedbackError(null);
    try {
      const res = await fetch("/api/subscription/sync-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId || `pending_${currentUser.uid}`,
          userId: currentUser.uid,
        }),
      });
      const data = await res.json();
      if (
        data.verified === true ||
        data.mandateStatus === "AUTHORIZED" ||
        data.subscriptionStatus === "active" ||
        data.subscriptionStatus === "trialing" ||
        data.subscriptionStatus === "authenticated"
      ) {
        setIsPaymentVerified(true);
        setIsTrialActive(true);
        setFeedbackSuccess("AutoPay mandate verified! Proceeding to business profile...");
        advanceToStep(3);
      } else {
        setFeedbackError(
          "AutoPay mandate is pending authorization in your UPI app. Please complete authorization and try again."
        );
      }
    } catch (e: any) {
      setFeedbackError("Could not check mandate status. Please try again.");
    } finally {
      setCheckingMandateStatus(false);
    }
  };

  // Fallback: Confirm Selected Plan Directly
  const handleConfirmPlanDirectly = async () => {
    setPaymentProcessing(true);
    setFeedbackError(null);
    try {
      setIsPaymentVerified(true);
      setIsTrialActive(true);
      setFeedbackSuccess(
        `Plan confirmed! Your ${selectedPlan === "business" ? "Business Suite" : "Professional Plan"} is active. Please enter your business name below.`
      );

      // Persist plan selection & verified status in Firestore
      try {
        const { db } = getFirebaseClient();
        if (db && currentUser?.uid) {
          const nowIso = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              plan: selectedPlan,
              billing_cycle: billingCycle,
              subscription_status: "active",
              subscriptionStatus: "ACTIVE",
              payment_verified: true,
              paymentVerified: true,
              is_unlimited: selectedPlan === "business",
              is_trial: false,
              subscription_expires_at: expiresAt,
              onboarding_step: 3,
              updatedAt: nowIso,
            },
            { merge: true }
          );

          if (businessId) {
            await setDoc(
              doc(db, "businesses", businessId),
              {
                plan: selectedPlan,
                subscription_status: "active",
                subscriptionStatus: "ACTIVE",
                payment_verified: true,
                paymentVerified: true,
                is_unlimited: selectedPlan === "business",
                publicBookingStatus: "ACTIVE",
                subscription_expires_at: expiresAt,
                updated_at: nowIso,
              },
              { merge: true }
            );
          }
        }
      } catch (e) {
        console.warn("User doc update warning:", e);
      }

      advanceToStep(3);
      setTimeout(() => {
        const el = document.getElementById("business-name-input");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }, 200);
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to confirm plan.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Step 2 Submission: Plan Selection & Trial Activation
  const handlePlanSubmit = async () => {
    setSavingState(true);
    setFeedbackError(null);
    try {
      const { db } = getFirebaseClient();
      if (db && currentUser?.uid) {
        const nowIso = new Date().toISOString();
        const trialEnd = new Date(Date.now() + 7 * 86400000).toISOString();

        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            plan: selectedPlan,
            billing_cycle: billingCycle,
            subscription_status: "TRIALING",
            subscriptionStatus: "TRIALING",
            is_trial: true,
            trial_started_at: nowIso,
            trial_expires_at: trialEnd,
            onboarding_step: 3,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        // Also record trial subscription record if none exists
        try {
          const subSnap = await getDocs(
            query(collection(db, "subscriptions"), where("user_id", "==", currentUser.uid))
          );
          if (subSnap.empty) {
            await addDoc(collection(db, "subscriptions"), {
              user_id: currentUser.uid,
              uid: currentUser.uid,
              business_id: businessId || `pending_${currentUser.uid}`,
              plan: selectedPlan,
              plan_id: selectedPlan,
              billing_cycle: billingCycle,
              status: "TRIALING",
              subscriptionStatus: "TRIALING",
              trial_started_at: nowIso,
              expires_at: trialEnd,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
        } catch (subErr) {
          console.warn("Trial subscription record sync non-fatal:", subErr);
        }
      }
    } catch (err: any) {
      console.warn("Firestore sync non-fatal, continuing to Step 3:", err);
    } finally {
      setIsTrialActive(true);
      advanceToStep(3);
      setSavingState(false);
      setTimeout(() => {
        const el = document.getElementById("business-name-input");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }, 150);
    }
  };

  // Step 3 Submission: Business Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingState(true);
    setFeedbackError(null);

    try {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "");
      if (!cleanSlug) throw new Error("Please enter a valid booking link slug.");

      let cleanDigits = phone.replace(/\D/g, "");
      if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) cleanDigits = cleanDigits.slice(2);
      if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) cleanDigits = cleanDigits.slice(1);
      if (cleanDigits.length !== 10) {
        throw new Error("Business phone number must be exactly 10 digits (e.g. 9876543210).");
      }

      let resolvedBizId: string | null = null;
      let resolvedBookingUrl: string | null = null;

      // 1. Try server-side profile creation (with REST fallback)
      try {
        const res = await fetch("/api/business/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: currentUser?.uid,
            name: name.trim(),
            category,
            phone: cleanDigits,
            email: bizEmail.trim() || currentUser?.email,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            website: website.trim(),
            description: description.trim(),
            workingHours: "9:00 AM - 7:00 PM (Monday - Saturday)",
            timezone,
            slug: cleanSlug,
          }),
        });

        const data = await res.json();
        if (res.ok && data.businessId) {
          resolvedBizId = data.businessId;
          resolvedBookingUrl = data.bookingUrl;
        } else if (data.error === "SLUG_TAKEN") {
          throw new Error(data.message);
        } else {
          console.warn("Server profile API notice:", data.message);
        }
      } catch (srvErr: any) {
        if (srvErr.message?.includes("already taken")) throw srvErr;
        console.warn("Falling back to client Firestore for business profile:", srvErr);
      }

      // 2. Direct client-side Firestore fallback (guaranteed to succeed via client SDK)
      if (!resolvedBizId) {
        const { db: clientDb } = getFirebaseClient();
        const uid = currentUser?.uid;
        if (!clientDb || !uid) {
          throw new Error("Unable to save business profile. Please check your network connection.");
        }

        const nowIso = new Date().toISOString();
        resolvedBizId = businessId || `biz_${uid.substring(0, 8)}_${Date.now().toString(36)}`;
        resolvedBookingUrl = getBookingUrlForSlug(cleanSlug);

        const bizPayload: any = {
          id: resolvedBizId,
          businessId: resolvedBizId,
          owner_id: uid,
          ownerUid: uid,
          owner_email: currentUser?.email || bizEmail.trim(),
          businessName: name.trim(),
          name: name.trim(),
          category,
          phone: cleanDigits,
          email: bizEmail.trim() || currentUser?.email,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim() || "India",
          website: website.trim(),
          description: description.trim(),
          working_hours: "9:00 AM - 7:00 PM (Monday - Saturday)",
          timezone,
          slug: cleanSlug,
          bookingSlug: cleanSlug,
          bookingUrl: resolvedBookingUrl,
          paymentVerified: true,
          profileCompleted: true,
          sharingLinkUnlocked: true,
          publicBookingStatus: "ACTIVE",
          plan: selectedPlan,
          subscription_status: isTrialActive ? "trialing" : "active",
          subscriptionStatus: isTrialActive ? "TRIALING" : "ACTIVE",
          is_active: true,
          updated_at: nowIso,
          updatedAt: nowIso,
        };

        await setDoc(doc(clientDb, "businesses", resolvedBizId), bizPayload, { merge: true });

        await setDoc(
          doc(clientDb, "users", uid),
          {
            uid,
            businessId: resolvedBizId,
            business_id: resolvedBizId,
            businessName: name.trim(),
            bookingSlug: cleanSlug,
            accountStatus: "ACTIVE",
            onboarding_step: 4,
            onboardingStatus: "PROFILE_COMPLETED",
            profileCompleted: true,
            sharingLinkUnlocked: true,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }

      setBusinessId(resolvedBizId);
      setBookingUrl(resolvedBookingUrl || "");
      setFeedbackError(null);
      setFeedbackSuccess("Business profile saved successfully!");
      advanceToStep(4);
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to create business profile.");
    } finally {
      setSavingState(false);
    }
  };

  // Step 4: Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      setFeedbackError("Please complete your business profile first.");
      return;
    }

    const priceNum = parseFloat(newServicePrice);
    const durationNum = parseInt(newServiceDuration, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setFeedbackError("Please enter a valid service price.");
      return;
    }
    if (isNaN(durationNum) || durationNum < 5) {
      setFeedbackError("Service duration must be at least 5 minutes.");
      return;
    }

    setSavingState(true);
    setFeedbackError(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      const nowIso = new Date().toISOString();
      const serviceData: any = {
        business_id: businessId,
        name: newServiceName.trim(),
        category: newServiceCategory.trim(),
        price: priceNum,
        duration_minutes: durationNum,
        description: newServiceDesc.trim(),
        currency: "INR",
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const docRef = await addDoc(collection(db, "services"), serviceData);
      setServicesList((prev) => [...prev, { id: docRef.id, ...serviceData }]);

      // Reset form
      setNewServiceName("");
      setNewServicePrice("499");
      setNewServiceDuration("30");
      setNewServiceDesc("");
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to save service.");
    } finally {
      setSavingState(false);
    }
  };

  const handleDeleteService = async (serviceId?: string) => {
    if (!serviceId) return;
    try {
      const { db } = getFirebaseClient();
      if (!db) return;
      await deleteDoc(doc(db, "services", serviceId));
      setServicesList((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to delete service.");
    }
  };

  // Step 5: Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      setFeedbackError("Please complete your business profile first.");
      return;
    }

    if (staffList.length >= maxStaffAllowed) {
      setFeedbackError(`Your ${selectedPlan.toUpperCase()} plan limit is ${maxStaffAllowed} staff members.`);
      return;
    }

    setSavingState(true);
    setFeedbackError(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      const nowIso = new Date().toISOString();
      const staffData: any = {
        business_id: businessId,
        name: newStaffName.trim(),
        phone: newStaffPhone.trim() || null,
        email: newStaffEmail.trim() || null,
        role_title: newStaffRole.trim() || "Specialist",
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const docRef = await addDoc(collection(db, "staff"), staffData);
      setStaffList((prev) => [...prev, { id: docRef.id, ...staffData }]);

      setNewStaffName("");
      setNewStaffPhone("");
      setNewStaffEmail("");
      setNewStaffRole("Specialist");
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to save staff member.");
    } finally {
      setSavingState(false);
    }
  };

  const handleDeleteStaff = async (staffId?: string) => {
    if (!staffId) return;
    try {
      const { db } = getFirebaseClient();
      if (!db) return;
      await deleteDoc(doc(db, "staff", staffId));
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to delete staff member.");
    }
  };

  // Step 6: Save Hours
  const handleSaveHours = async () => {
    if (!businessId) {
      setFeedbackError("Please complete your business profile first.");
      return;
    }

    // Validate that open < close for each day open
    for (const d of schedule) {
      if (d.is_open && d.open_time >= d.close_time) {
        setFeedbackError(`On ${d.day_name}, opening time must precede closing time.`);
        return;
      }
    }

    setSavingState(true);
    setFeedbackError(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      const nowIso = new Date().toISOString();

      // Delete existing hours
      const oldSnap = await getDocs(query(collection(db, "business_hours"), where("business_id", "==", businessId)));
      const deletePromises = oldSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // Insert new hours
      const addPromises = schedule.map((item) =>
        addDoc(collection(db, "business_hours"), {
          business_id: businessId,
          day_of_week: item.day_of_week,
          is_open: item.is_open,
          open_time: `${item.open_time}:00`,
          close_time: `${item.close_time}:00`,
          created_at: nowIso,
          updated_at: nowIso,
        })
      );
      await Promise.all(addPromises);

      // Save break to business doc
      await updateDoc(doc(db, "businesses", businessId), {
        break_start: hasBreak ? breakStartTime : null,
        break_end: hasBreak ? breakEndTime : null,
        timezone,
        updated_at: nowIso,
      });

      advanceToStep(7);
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to save working hours.");
    } finally {
      setSavingState(false);
    }
  };

  // Step 7: Save Settings
  const handleSaveSettings = async () => {
    if (!businessId) {
      setFeedbackError("Please complete your business profile first.");
      return;
    }

    setSavingState(true);
    setFeedbackError(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, "businesses", businessId), {
        slot_interval_minutes: slotInterval,
        buffer_minutes: bufferMinutes,
        min_advance_hours: minAdvanceHours,
        max_advance_days: maxAdvanceDays,
        cancellation_notice_hours: cancellationNoticeHours,
        allow_rescheduling: allowRescheduling,
        confirmation_mode: confirmationMode,
        updated_at: nowIso,
      });

      advanceToStep(8);
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to save booking settings.");
    } finally {
      setSavingState(false);
    }
  };

  // Step 8: Final Review & Confirmation
  const handleCompleteOnboarding = async () => {
    if (!businessId) {
      setFeedbackError("Business profile is required to finish setup.");
      return;
    }
    if (servicesList.length === 0) {
      setFeedbackError("Please add at least one service before completing onboarding.");
      goToStep(4);
      return;
    }
    if (staffList.length === 0) {
      setFeedbackError("Please add at least one staff member before completing onboarding.");
      goToStep(5);
      return;
    }

    setSavingState(true);
    setFeedbackError(null);

    try {
      const { db } = getFirebaseClient();
      if (!db) throw new Error("Database unavailable");

      const nowIso = new Date().toISOString();

      // Mark business as active and complete
      await updateDoc(doc(db, "businesses", businessId), {
        onboarding_complete: true,
        is_active: true,
        sharing_link_unlocked: true,
        sharingLinkUnlocked: true,
        publicBookingStatus: "ACTIVE",
        updated_at: nowIso,
      });

      // Mark user as onboarding complete
      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          onboarding_complete: true,
          onboarding_step: 8,
          updatedAt: nowIso,
        });
      }

      setFeedbackSuccess("Onboarding complete! Launching your business dashboard...");

      setTimeout(() => {
        router.push("/app/overview");
      }, 1200);
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to complete onboarding.");
      setSavingState(false);
    }
  };

  const handleResumeLater = () => {
    persistProgress(currentStep);
    router.push("/");
  };

  const stepsHeader = [
    { num: 1, title: "Account", short: "Account" },
    { num: 2, title: "Plan & Trial", short: "Plan" },
    { num: 3, title: "Business Profile", short: "Profile" },
    { num: 4, title: "Services", short: "Services" },
    { num: 5, title: "Staff", short: "Staff" },
    { num: 6, title: "Working Hours", short: "Hours" },
    { num: 7, title: "Booking Rules", short: "Rules" },
    { num: 8, title: "Review & Finish", short: "Review" },
  ];

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F3] dark:bg-[#10251D] text-slate-500 dark:text-navy-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#046A38] mb-3" />
        <span className="font-mono text-xs">Loading onboarding workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] transition-colors duration-200 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation (Image 2) */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-4 border-b border-[#D8DED8] dark:border-[#D8DED8]/20">
        <div className="flex items-center gap-3">
          <VisroSlotLogo size="sm" href="/" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] text-xs font-mono font-bold">
            Business Setup Wizard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResumeLater}
            className="text-xs font-mono font-semibold text-[#404944] dark:text-[#D8DED8] hover:text-[#046A38] px-3.5 py-1.5 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 hover:bg-[#FFFFFF] dark:hover:bg-[#043D2E] transition-colors"
          >
            Save &amp; Continue Later
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl mx-auto my-6">
        {/* Step Progress Tracker */}
        <div className="mb-8 bg-[#FFFFFF] dark:bg-[#043D2E] p-4 sm:p-6 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-[#046A38] dark:text-[#9EF6B6] font-bold uppercase tracking-wider">
              Step {currentStep} of 8 • {stepsHeader[currentStep - 1]?.title}
            </span>
            <span className="text-[#707974] dark:text-[#A7B9AA]">
              {Math.round(((currentStep - 1) / 7) * 100)}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F7F6F0] dark:bg-[#10251D] h-2 rounded-full overflow-hidden mb-5">
            <div
              className="bg-[#046A38] h-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 7) * 100}%` }}
            />
          </div>

          {/* Step Pills with Sequential Step Locking */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
            {stepsHeader.map((s) => {
              const isPast = s.num < currentStep;
              const isCurrent = s.num === currentStep;
              const isUnlocked = s.num <= maxUnlockedStep;

              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => goToStep(s.num)}
                  className={`py-2 px-1 rounded-md text-[10px] font-mono font-bold transition-all truncate select-none ${
                    !isUnlocked
                      ? "opacity-35 cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border border-transparent"
                      : isCurrent
                      ? "bg-[#046A38] text-white ring-2 ring-[#046A38] shadow-md scale-105 cursor-pointer"
                      : isPast
                      ? "bg-[#046A38]/10 text-[#046A38] dark:bg-[#9EF6B6]/15 dark:text-[#9EF6B6] hover:bg-[#046A38]/20 cursor-pointer"
                      : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-[#046A38]/15 hover:text-[#046A38] cursor-pointer"
                  }`}
                  title={
                    isUnlocked
                      ? `Go to Step ${s.num}: ${s.title}`
                      : `Step ${s.num} is locked. Complete previous steps to unlock.`
                  }
                >
                  <span className="block flex items-center justify-center gap-0.5">
                    {isPast ? "✓" : !isUnlocked ? "🔒" : s.num}
                  </span>
                  <span className="truncate block mt-0.5">{s.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {feedbackError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Action Required</span>
              <span className="leading-relaxed">{feedbackError}</span>
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {feedbackSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <span className="font-semibold">{feedbackSuccess}</span>
          </div>
        )}

        {/* STEP 1: Account Confirmation */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Account Verified
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Signed in as <strong className="text-slate-800 dark:text-white">{currentUser?.email}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{currentUser?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Role:</span>
                <span className="font-mono text-emerald-600 font-bold">Business Owner</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-white/10">
              <span className="text-xs text-slate-500 font-mono">Next: Select your business plan with 7-day free trial</span>
              <button
                type="button"
                onClick={() => advanceToStep(2)}
                className="px-6 py-3 rounded-full text-xs font-mono font-bold bg-[#043D2E] text-white dark:bg-gold-400 dark:text-navy-950 hover:brightness-105 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Continue to Step 2: Plan Selection →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Plan Selection */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 2 of 8 • Subscription Plan
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Choose Your Plan & Activate 7-Day Free Trial
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Both plans include a 7-day risk-free trial. Zero rupees are charged today.
              </p>

              {/* Billing Toggle */}
              <div className="pt-3 flex items-center gap-2">
                <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                      billingCycle === "monthly"
                        ? "bg-[#043D2E] text-white dark:bg-[#046A38] dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === "yearly"
                        ? "bg-[#043D2E] text-white dark:bg-[#046A38] dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-bold">
                      Save 17%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Professional */}
              <div
                onClick={() => setSelectedPlan("professional")}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === "professional"
                    ? "border-[#043D2E] dark:border-white bg-slate-50/80 dark:bg-[#10251D]/80 shadow-md ring-2 ring-slate-400/20"
                    : "border-slate-200 dark:border-[#D8DED8]/20 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500">STANDARD</span>
                    {selectedPlan === "professional" && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-900 dark:text-white">
                    Professional
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-black text-slate-900 dark:text-white">
                      ₹{billingCycle === "monthly" ? "499" : "4,990"}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold">✓ 7-Day Free Trial Included</p>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#D8DED8]/20">
                    <li>• Maximum 3 staff members</li>
                    <li>• Up to 300 appointments / month</li>
                    <li>• Dedicated booking link & QR code</li>
                    <li>• Calendar conflict prevention</li>
                  </ul>
                </div>
              </div>

              {/* Business */}
              <div
                onClick={() => setSelectedPlan("business")}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
                  selectedPlan === "business"
                    ? "border-[#046A38] bg-gold-50/30 dark:bg-[#10251D]/80 shadow-lg ring-2 ring-[#046A38]/30"
                    : "border-slate-200 dark:border-[#D8DED8]/20 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#046A38]">MOST POPULAR</span>
                    {selectedPlan === "business" && (
                      <span className="w-5 h-5 rounded-full bg-[#046A38] text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-900 dark:text-white">
                    Business Suite
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-black text-slate-900 dark:text-white">
                      ₹{billingCycle === "monthly" ? "999" : "9,990"}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold">✓ 7-Day Free Trial Included</p>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#D8DED8]/20">
                    <li>• Maximum 10 staff members</li>
                    <li>• Unlimited appointment bookings</li>
                    <li>• Advanced CRM & analytics</li>
                    <li>• Priority phone support</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Razorpay Secure Payment Gateway */}
            <div className="p-5 rounded-2xl bg-[#046A38]/5 dark:bg-[#10251D] border-2 border-[#046A38] text-xs text-[#10251D] dark:text-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#046A38] dark:text-[#9EF6B6]" />
                  <span className="font-bold text-sm text-[#046A38] dark:text-[#9EF6B6] font-mono uppercase">
                    Razorpay Secure Payment Gateway
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-[#046A38] text-white px-2.5 py-0.5 rounded-full">
                  {isOldUser
                    ? `₹${selectedPlan === "business" ? (billingCycle === "yearly" ? "9,990" : "999") : (billingCycle === "yearly" ? "4,990" : "499")} Total`
                    : "7-Day Free Trial"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                All major payment methods supported: UPI (Google Pay, PhonePe, Paytm, CRED, BHIM), Debit/Credit Cards, and Net Banking with 256-bit bank-grade encryption.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#046A38]" />
                  256-Bit Bank Grade Security
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#046A38]" />
                  All UPI Apps &amp; Cards Supported
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#046A38]" />
                  7-Day Full Free Trial Included
                </span>
              </div>
            </div>

            {/* Direct Razorpay Hosted Portal Option */}
            {hostedMandateUrl && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-800 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1 text-left">
                  <span className="font-bold font-mono text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Direct Portal Option (Official Razorpay Server):
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    If mobile popup is blocked by your browser, open Razorpay&apos;s verified authorization link directly:
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={hostedMandateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-full bg-[#046A38] text-white font-mono font-bold text-xs uppercase shadow hover:bg-[#043D2E] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1"
                  >
                    Open Portal ↗
                  </a>
                  <button
                    type="button"
                    onClick={checkMandateStatusDirect}
                    disabled={checkingMandateStatus}
                    className="px-4 py-2.5 rounded-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    {checkingMandateStatus ? "Checking..." : "I have completed setup ✓"}
                  </button>
                </div>
              </div>
            )}

            {/* Verified Mandate Banner */}
            {isPaymentVerified && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#046A38] shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs">Payment &amp; AutoPay Mandate Verified!</p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Your 7-day free trial is now active. Step 3 (Business Profile Setup) has been unlocked.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => advanceToStep(3)}
                  className="px-4 py-2 rounded-full bg-[#046A38] text-white font-mono font-bold text-xs uppercase shadow hover:bg-[#043D2E] transition-all whitespace-nowrap cursor-pointer shrink-0"
                >
                  Proceed to Step 3 →
                </button>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-5 py-3 rounded-full text-xs font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back to Account
              </button>

              <div className="flex items-center gap-3">
                {isPaymentVerified ? (
                  <button
                    type="button"
                    onClick={() => advanceToStep(3)}
                    className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-white bg-[#046A38] hover:bg-[#043D2E] shadow-md transition-all flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Payment Verified • Unlock Step 3 →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={paymentProcessing}
                    onClick={() => handleAuthorizePlanGateway(false)}
                    className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-white bg-[#046A38] hover:bg-[#043D2E] shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Connecting Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Authorize &amp; Activate 7-Day Trial →</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Business Profile */}
        {currentStep === 3 && (
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6"
          >
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 3 of 8 • Commercial Details
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Set up your business
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Provide your commercial information to generate your dedicated booking link.
              </p>
            </div>

            {/* Business Name Highlight Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/60 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                  Write Your Business Name Below
                </h4>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300 leading-relaxed">
                  Enter your Salon, Spa, Clinic, or Studio name in the <strong>Business Name</strong> input box below. We will instantly reserve and generate your dedicated customer booking link!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-white font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Business Name *
                  </span>
                  <span className="text-emerald-600 text-[10px] lowercase font-normal">(enter your salon/clinic name)</span>
                </label>
                <input
                  id="business-name-input"
                  type="text"
                  required
                  placeholder="e.g. Aura Luxury Salon, Glow Clinic, Velvet Spa"
                  value={name}
                  onChange={(e) => handleNameInput(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white dark:bg-[#10251D] border-2 border-emerald-500 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Business Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-[#046A38]"
                >
                  {businessCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Booking Slug */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Your Public Booking URL Link *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-3 text-xs font-mono bg-slate-100 dark:bg-[#10251D] text-slate-500 border border-r-0 border-slate-200 dark:border-[#D8DED8]/20 rounded-l-2xl">
                    {getPlatformDisplayHost()}/book/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="my-business"
                    value={slug}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setSlug(clean);
                      setBookingUrl(getBookingUrlForSlug(clean));
                      checkSlugAvailability(clean);
                    }}
                    className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-r-2xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#046A38]"
                  />
                </div>
                {slugChecking && <span className="text-[10px] text-slate-400 mt-1 block">Checking availability...</span>}
                {slugAvailable === true && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">✓ Booking link is available!</span>
                )}
                {slugAvailable === false && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 block">✕ Link is already taken. Choose another name.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Business Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Business Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={bizEmail}
                  onChange={(e) => setBizEmail(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Full Physical Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Shop/Suite No., Street, Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Business Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell clients about your expertise, signature services, and amenities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-[#FAF9F3] dark:bg-[#10251D]/80 border border-slate-200 dark:border-[#D8DED8]/20 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#046A38]"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={savingState || slugAvailable === false}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingState ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Services</span>
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Services Setup */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 4 of 8 • Services Menu
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Add Your Services
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Configure your appointment menu with durations and prices. You can add more later.
              </p>
            </div>

            {/* List of Added Services */}
            {servicesList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                  Added Services ({servicesList.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicesList.map((s) => (
                    <div
                      key={s.id || s.name}
                      className="p-3.5 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {s.duration_minutes} mins • ₹{s.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(s.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                        title="Delete service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Service Sub-Form */}
            <form onSubmit={handleAddService} className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D]/60 border border-slate-200 dark:border-[#D8DED8]/20 space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 block">
                + Add a Service
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Haircut"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Styling / Consultations"
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="499"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white font-mono"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description of what the client receives..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingState || !newServiceName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#043D2E] text-white dark:bg-white dark:text-navy-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save This Service</span>
                </button>
              </div>
            </form>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={servicesList.length === 0}
                onClick={() => advanceToStep(5)}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <span>Continue to Staff Setup</span>
                <ArrowRight className="w-4 h-4 text-navy-950" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Staff Setup */}
        {currentStep === 5 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                  Step 5 of 8 • Team & Specialists
                </span>
                <span className="text-xs font-mono bg-slate-100 dark:bg-[#10251D] px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                  {staffList.length} of {maxStaffAllowed} staff added
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Add Team Members
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Add staff members who take client appointments. Your {selectedPlan.toUpperCase()} plan supports up to {maxStaffAllowed} team members.
              </p>
            </div>

            {/* List of Added Staff */}
            {staffList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                  Added Team Members ({staffList.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {staffList.map((st) => (
                    <div
                      key={st.id || st.name}
                      className="p-3.5 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {st.role_title} {st.phone ? `• ${st.phone}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(st.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Staff Sub-Form */}
            {staffList.length < maxStaffAllowed ? (
              <form onSubmit={handleAddStaff} className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D]/60 border border-slate-200 dark:border-[#D8DED8]/20 space-y-4">
                <span className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 block">
                  + Add Staff Member
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Staff Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Role / Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Stylist / Consultant"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="staff@business.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingState || !newStaffName.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#043D2E] text-white dark:bg-white dark:text-navy-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Team Member</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#043D2E]/40 border border-amber-200 dark:border-amber-900 text-xs text-emerald-800 dark:text-emerald-300">
                Plan limit reached ({maxStaffAllowed} staff members). You can upgrade to Business Suite later to add up to 10 staff members.
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={staffList.length === 0}
                onClick={() => advanceToStep(6)}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <span>Continue to Working Hours</span>
                <ArrowRight className="w-4 h-4 text-navy-950" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Working Hours */}
        {currentStep === 6 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 6 of 8 • Schedule Matrix
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Business Working Hours
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Define the days and hours your business is open for appointments.
              </p>
            </div>

            {/* 7-Day Matrix */}
            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div
                  key={item.day_name}
                  className="p-3.5 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.is_open}
                      onChange={(e) => {
                        const updated = [...schedule];
                        updated[idx].is_open = e.target.checked;
                        setSchedule(updated);
                      }}
                      className="rounded border-slate-300 text-[#046A38] focus:ring-gold-400"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white w-24">
                      {item.day_name}
                    </span>
                  </div>

                  {item.is_open ? (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span>Open:</span>
                      <input
                        type="time"
                        value={item.open_time}
                        onChange={(e) => {
                          const updated = [...schedule];
                          updated[idx].open_time = e.target.value;
                          setSchedule(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={item.close_time}
                        onChange={(e) => {
                          const updated = [...schedule];
                          updated[idx].close_time = e.target.value;
                          setSchedule(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">Closed (Day Off)</span>
                  )}
                </div>
              ))}
            </div>

            {/* Daily Break Configuration */}
            <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D]/60 border border-slate-200 dark:border-[#D8DED8]/20 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasBreak}
                  onChange={(e) => setHasBreak(e.target.checked)}
                  className="rounded border-slate-300 text-[#046A38] focus:ring-gold-400"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Schedule Daily Staff Lunch / Rest Break
                </span>
              </div>
              {hasBreak && (
                <div className="flex items-center gap-2 text-xs font-mono pt-1">
                  <span>Break from:</span>
                  <input
                    type="time"
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20"
                  />
                  <span className="text-slate-400">(Slots will be automatically blocked)</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={savingState}
                onClick={handleSaveHours}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingState ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Saving Schedule...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Booking Rules</span>
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: Booking Settings */}
        {currentStep === 7 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 7 of 8 • Booking Rules
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Booking Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Configure your appointment booking policies, buffer times, and customer advance notice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Slot Interval (Minutes)
                </label>
                <select
                  value={slotInterval}
                  onChange={(e) => setSlotInterval(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
                >
                  <option value={15}>15 minutes interval</option>
                  <option value={30}>30 minutes interval</option>
                  <option value={45}>45 minutes interval</option>
                  <option value={60}>60 minutes interval</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Buffer Time Between Slots
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
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
                  value={minAdvanceHours}
                  onChange={(e) => setMinAdvanceHours(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
                >
                  <option value={1}>1 hour in advance</option>
                  <option value={2}>2 hours in advance</option>
                  <option value={4}>4 hours in advance</option>
                  <option value={24}>24 hours (1 day) in advance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Maximum Advance Booking
                </label>
                <select
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
                >
                  <option value={7}>Up to 7 days ahead</option>
                  <option value={14}>Up to 14 days ahead</option>
                  <option value={30}>Up to 30 days ahead</option>
                  <option value={60}>Up to 60 days ahead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Booking Confirmation Mode
                </label>
                <select
                  value={confirmationMode}
                  onChange={(e) => setConfirmationMode(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
                >
                  <option value="instant">Instant Confirmation (Recommended)</option>
                  <option value="manual">Manual Approval by Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Cancellation Policy
                </label>
                <select
                  value={cancellationNoticeHours}
                  onChange={(e) => setCancellationNoticeHours(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200 dark:border-[#D8DED8]/20 rounded-xl"
                >
                  <option value={2}>Allow cancel up to 2 hours before</option>
                  <option value={4}>Allow cancel up to 4 hours before</option>
                  <option value={12}>Allow cancel up to 12 hours before</option>
                  <option value={24}>Allow cancel up to 24 hours before</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(6)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={savingState}
                onClick={handleSaveSettings}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingState ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Saving Rules...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Final Review</span>
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: Review & Finish */}
        {currentStep === 8 && (
          <div className="bg-white dark:bg-[#043D2E] p-8 rounded-3xl border border-slate-200 dark:border-[#D8DED8]/20 shadow-md space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#046A38] font-bold">
                Step 8 of 8 • Review & Confirmation
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Review Your Business Setup
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Verify your configuration before unlocking your live public booking page.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4 text-xs">
              {/* Business & Plan */}
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                    Business Profile & Plan
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{name}</h3>
                  <p className="text-slate-500">{category} • {city || "India"}</p>
                  <p className="font-mono text-emerald-600 font-bold">
                    {selectedPlan.toUpperCase()} ({billingCycle}) • 7-Day Free Trial
                  </p>
                  <p className="font-mono text-[11px] text-[#046A38]">
                    Booking Link: {bookingUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="text-xs font-mono text-[#046A38] dark:text-[#9EF6B6] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Services Added */}
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                    Services Configured ({servicesList.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {servicesList.map((s) => (
                      <span
                        key={s.id || s.name}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 font-mono text-[11px]"
                      >
                        {s.name} (₹{s.price})
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="text-xs font-mono text-[#046A38] dark:text-[#9EF6B6] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Staff Added */}
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                    Team Members ({staffList.length} of {maxStaffAllowed})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {staffList.map((st) => (
                      <span
                        key={st.id || st.name}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#043D2E] border border-slate-200 dark:border-[#D8DED8]/20 font-mono text-[11px]"
                      >
                        {st.name} ({st.role_title})
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="text-xs font-mono text-[#046A38] dark:text-[#9EF6B6] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Schedule & Rules */}
              <div className="p-4 rounded-2xl bg-[#FAF9F3] dark:bg-[#10251D] border border-slate-200/80 dark:border-[#D8DED8]/20 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                    Schedule & Policies
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Open: Mon - Sat • {slotInterval}m slots • {bufferMinutes}m buffer
                  </p>
                  <p className="text-slate-500">
                    Confirmation: {confirmationMode === "instant" ? "Instant" : "Manual Approval"} • Cancel notice: {cancellationNoticeHours}h
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(6)}
                  className="text-xs font-mono text-[#046A38] dark:text-[#9EF6B6] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(7)}
                className="px-4 py-2.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={savingState}
                onClick={handleCompleteOnboarding}
                className="px-8 py-3.5 rounded-full text-xs font-bold font-mono uppercase text-navy-950 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 hover:brightness-105 active:scale-95 shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {savingState ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                    <span>Activating Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-3 text-[11px] font-mono text-slate-400 dark:text-navy-500">
        © 2026 VISROSLOT • EVERY SLOT. SIMPLIFIED.
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F3] dark:bg-[#10251D] text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#046A38]" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
