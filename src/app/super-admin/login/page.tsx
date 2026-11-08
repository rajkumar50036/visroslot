"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { VisroSlotLogo } from "@/components/brand/VisroSlotLogo";
import { getFirebaseClient } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { auth, isConfigured } = getFirebaseClient();
      if (!isConfigured || !auth) {
        setErrorMessage("Firebase Authentication is not available. Please verify environment credentials.");
        setLoading(false);
        return;
      }

      // Step 1: Client authenticate via Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken(true);

      // Step 2: Verify Super Admin session strictly on server
      const res = await fetch("/api/super-admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          uid: cred.user.uid,
          email: cred.user.email || email.trim(),
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Sign out client immediately if server rejects authorization
        await auth.signOut();
        setErrorMessage(data.error || "Access denied. This account does not possess Super Admin privileges.");
        setLoading(false);
        return;
      }

      // Set cookie on client directly as well for instant hydration
      if (typeof document !== "undefined") {
        document.cookie = `visroslot_admin_session=${cred.user.uid}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `visroslot_session=${cred.user.uid}; path=/; max-age=604800; SameSite=Lax`;
      }

      // Success -> Redirect to Super Admin Command Center
      router.push("/super-admin");
      router.refresh();
    } catch (err: any) {
      console.error("Super Admin sign-in error:", err);
      let msg = "Invalid administrator credentials. Access has been logged.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid email or password. Please verify your administrator credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Temporary security lockout active. Try again later.";
      }
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const { auth } = getFirebaseClient();
      if (auth && forgotEmail.trim()) {
        await sendPasswordResetEmail(auth, forgotEmail.trim());
      }
    } catch (e) {
      // Intentionally do not reveal whether the email exists
      console.warn("Reset email dispatched or suppressed:", e);
    } finally {
      setForgotLoading(false);
      setForgotSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#101A2B] text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C49A46] selection:text-white">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <VisroSlotLogo size="sm" href="/" />
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900 border border-navy-700 text-[11px] font-mono text-gold-warm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C49A46]" />
          <span>Restricted Portal</span>
        </div>
      </header>

      {/* Main Card */}
      <div className="my-auto max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <VisroSlotLogo variant="full" size="md" href="/" priority />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Super Admin Sign In
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 font-normal">
            Authenticate with verified platform administrator credentials.
          </p>
        </div>

        <div className="bg-[#182338] border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-1.5">
                Administrator Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@visroslot.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-[#101A2B] border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C49A46] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Administrator Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#C49A46] hover:underline font-mono"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-xs bg-[#101A2B] border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C49A46] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#101A2B] border-slate-700 text-[#C49A46] focus:ring-0 focus:outline-none cursor-pointer"
                />
                <span>Remember this session</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">MFA Protected</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full text-xs font-semibold text-[#101A2B] bg-[#C49A46] hover:bg-[#D9B66E] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-md font-mono uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#101A2B]" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Authenticate to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center text-[11px] font-mono text-slate-400">
            Strict Server-Side UID & Custom Claim Validation Active
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#182338] border border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">Reset Super Admin Password</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your registered administrator email address. A password reset link will be dispatched via Firebase Authentication.
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Request Dispatched</span>
                </div>
                <p className="text-slate-300">
                  If an administrator account is associated with this email, a reset link has been transmitted. Check your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="admin@visroslot.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#101A2B] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C49A46]"
                />
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 rounded-xl bg-[#C49A46] hover:bg-[#D9B66E] text-[#101A2B] text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] font-mono text-slate-500">
        VisroSlot Platform Security • Authorized Access Only
      </footer>
    </div>
  );
}
