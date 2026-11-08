"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { VisroSlotLogo, VisroContactPhone } from "@/components/brand/VisroSlotLogo";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "professional";
  const cycleParam = searchParams.get("cycle") || "monthly";
  const typeParam = searchParams.get("type");

  const [accountType, setAccountType] = useState<"owner" | "customer">(
    typeParam === "customer" ? "customer" : "owner"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);

    // In-App Browser Protection
    if (typeof navigator !== "undefined" && typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const inApp = /Instagram|FBAN|FBAV|Twitter|Line|BytedanceWebview/i.test(ua);
      const isAndroidDevice = /Android/i.test(ua);

      if (inApp) {
        if (isAndroidDevice) {
          const cleanUrl = window.location.href.replace(/^https?:\/\//, "");
          window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
          return;
        } else {
          setErrorMessage(
            "Google restricts sign-ups inside in-app browsers. Please open this page in Safari or Chrome, or register below with your Email & Password."
          );
          return;
        }
      }
    }

    setGoogleLoading(true);

    try {
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !auth) {
        setErrorMessage("Authentication service initializing. Please try again or use email sign-up below.");
        setGoogleLoading(false);
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const isOwnerEmail = user.email?.toLowerCase() === OWNER_EMAIL;

      if (db) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              id: user.uid,
              email: user.email,
              fullName: user.displayName || (accountType === "owner" ? "Business Owner" : "Customer"),
              role: accountType === "owner" ? "OWNER" : "CUSTOMER",
              is_owner: accountType === "owner" || isOwnerEmail,
              lifetime_free: isOwnerEmail,
              plan: planParam,
              billing_cycle: cycleParam,
              onboarding_step: accountType === "owner" ? 2 : 1,
              authProvider: "google",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (dbErr: any) {
          console.warn("Firestore sync warning on Google registration:", dbErr);
        }
      }

      if (typeof document !== "undefined") {
        document.cookie = `visroslot_session=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `slotora_session=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (accountType === "owner") {
        router.push(`/onboarding?step=plan&plan=${planParam}&cycle=${cycleParam}`);
      } else {
        router.push("/profile");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Google sign-up error:", err);
      if (err.code === "auth/popup-blocked") {
        setErrorMessage("Popup blocked by browser. Please allow popups or register with email below.");
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMessage("Domain verification is updating. Please sign up using your Email & Password below for immediate access.");
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setErrorMessage(err.message || "Failed to sign up with Google. You can register with email below.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!termsAccepted) {
      setErrorMessage("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !auth) {
        setErrorMessage("Authentication service unavailable. Please check your network.");
        setLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.warn("Could not send email verification immediately:", e);
      }

      const isOwnerEmail = cleanEmail === OWNER_EMAIL;

      if (db) {
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          email: cleanEmail,
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          phone: cleanPhone,
          role: accountType === "owner" ? "OWNER" : "CUSTOMER",
          is_owner: accountType === "owner" || isOwnerEmail,
          lifetime_free: isOwnerEmail,
          plan: planParam,
          billing_cycle: cycleParam,
          onboarding_step: accountType === "owner" ? 1 : 1,
          authProvider: "password",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (typeof document !== "undefined") {
        document.cookie = `visroslot_session=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `slotora_session=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
      }

      setSuccessMessage("Account created successfully! Preparing your account...");

      setTimeout(() => {
        if (accountType === "owner") {
          router.push(`/onboarding?step=plan&plan=${planParam}&cycle=${cycleParam}`);
        } else {
          router.push("/profile");
        }
        router.refresh();
      }, 900);
    } catch (err: any) {
      let msg = "An error occurred during registration.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Please sign in instead.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please provide a valid email address.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 8 characters.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#043D2E] p-6 sm:p-8 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/25 shadow-xs">
      {/* Account Type Selector Toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F7F6F0] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/20 rounded-md mb-6">
        <button
          type="button"
          onClick={() => {
            setAccountType("owner");
            setErrorMessage(null);
          }}
          className={`py-2 text-xs font-bold font-mono transition-all rounded flex items-center justify-center gap-1.5 ${
            accountType === "owner"
              ? "bg-[#046A38] text-white shadow-xs"
              : "text-[#404944] dark:text-[#A7B9AA] hover:text-[#10251D]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Business Owner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType("customer");
            setErrorMessage(null);
          }}
          className={`py-2 text-xs font-bold font-mono transition-all rounded flex items-center justify-center gap-1.5 ${
            accountType === "customer"
              ? "bg-[#046A38] text-white shadow-xs"
              : "text-[#404944] dark:text-[#A7B9AA] hover:text-[#10251D]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Customer Account</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-[#046A38] dark:text-[#9EF6B6] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google Registration */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-md border border-[#D8DED8] dark:border-[#D8DED8]/25 bg-[#FFFFFF] dark:bg-[#10251D] text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#F7F6F0] dark:hover:bg-[#10251D]/80 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#046A38]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Connecting..." : `Continue with Google`}</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D8DED8] dark:border-[#D8DED8]/20" />
          </div>
          <div className="relative flex justify-center text-[10px] font-mono uppercase">
            <span className="bg-[#FFFFFF] dark:bg-[#043D2E] px-3 text-[#707974] dark:text-[#A7B9AA] font-bold tracking-wider">
              Or register with email
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
            {accountType === "owner" ? "Business Email *" : "Email Address *"}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
            <input
              type="email"
              required
              placeholder={accountType === "owner" ? "owner@yourbusiness.com" : "you@example.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] font-mono focus:outline-none focus:border-[#046A38] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707974] hover:text-[#10251D] dark:hover:text-[#FFFFFF] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#10251D] dark:text-[#FFFFFF] font-bold mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707974]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/30 rounded-md text-[#10251D] dark:text-[#FFFFFF] placeholder-[#A7B9AA] focus:outline-none focus:border-[#046A38] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Terms acceptance checkbox */}
        <div className="pt-1 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[#D8DED8] text-[#046A38] focus:ring-[#046A38] cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-[#404944] dark:text-[#D8DED8] cursor-pointer leading-tight">
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-[#046A38] dark:text-[#9EF6B6] font-semibold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="text-[#046A38] dark:text-[#9EF6B6] font-semibold hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-md text-xs font-bold font-mono uppercase text-[#FFFFFF] bg-[#046A38] hover:bg-[#043D2E] active:scale-95 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>{accountType === "owner" ? "Start Business Onboarding" : "Complete Registration"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#D8DED8] dark:border-[#D8DED8]/20 flex items-center justify-between text-xs">
        <Link
          href="/"
          className="font-mono text-[#707974] dark:text-[#A7B9AA] hover:text-[#10251D] dark:hover:text-[#FFFFFF] inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <Link
          href={`/login?type=${accountType}`}
          className="font-mono font-bold text-[#046A38] dark:text-[#9EF6B6] hover:underline"
        >
          Already have an account? Sign in →
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-[#10251D] dark:text-[#FFFFFF] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3">
        <VisroSlotLogo size="sm" href="/" />
        <ThemeToggle variant="segmented" size="sm" />
      </header>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <VisroSlotLogo variant="full" size="md" href="/" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#10251D] dark:text-[#FFFFFF] tracking-tight font-display">
            Create Your Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#404944] dark:text-[#D8DED8]">
            Start your appointment journey with VISROSLOT
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-[#707974]">Loading registration...</div>}>
          <RegisterForm />
        </Suspense>

        <div className="mt-6 text-center">
          <VisroContactPhone variant="dark" />
        </div>
      </div>

      <footer className="w-full text-center py-3 text-[11px] font-mono text-[#707974] dark:text-[#A7B9AA]">
        © 2026 VISROSLOT • EVERY SLOT. SIMPLIFIED.
      </footer>
    </div>
  );
}
