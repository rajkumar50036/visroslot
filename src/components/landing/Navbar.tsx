"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Building2, LogOut, ChevronDown, Phone, ArrowRight, UserCheck } from "lucide-react";
import { VisroSlotLogo, VISRO_PHONE, VISRO_PHONE_TEL } from "@/components/brand/VisroSlotLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getFirebaseClient } from "@/lib/firebase/client";

interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOwner: boolean;
  isPaid: boolean;
  hasBusiness: boolean;
  businessSlug?: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 15);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to Firebase Auth state for real-time user session detection
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { auth, db } = getFirebaseClient();
      if (auth) {
        import("firebase/auth").then(({ onAuthStateChanged }) => {
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              const email = user.email?.toLowerCase() || "";
              const isOwner = email === "rajkumar50036@gmail.com" || user.uid === "vMZQTGlYSfM8adohQAZmSE3cNX02";

              let isPaid = isOwner;
              let hasBusiness = false;
              let businessSlug = isOwner ? "rajkumar-hq" : "";

              if (db) {
                try {
                  const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");

                  const userSnap = await getDoc(doc(db, "users", user.uid));
                  if (userSnap.exists()) {
                    const uData = userSnap.data();
                    if (uData.lifetime_free || uData.is_owner || uData.is_paid || uData.subscription_status === "active") {
                      isPaid = true;
                    }
                  }

                  const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", user.uid)));
                  if (!busSnap.empty) {
                    hasBusiness = true;
                    const bData = busSnap.docs[0].data();
                    businessSlug = bData.slug || "";
                    if (bData.lifetime_free) isPaid = true;

                    if (!isPaid) {
                      const subSnap = await getDocs(query(collection(db, "subscriptions"), where("business_id", "==", busSnap.docs[0].id)));
                      if (!subSnap.empty) {
                        const sData = subSnap.docs[0].data();
                        if (sData.status === "ACTIVE" && sData.plan_id !== "free") {
                          isPaid = true;
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error("Error loading user context in navbar:", e);
                }
              }

              setUserSession({
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || user.email?.split("@")[0] || "User",
                photoURL: user.photoURL || undefined,
                isOwner,
                isPaid,
                hasBusiness,
                businessSlug,
              });
            } else {
              setUserSession(null);
            }
          });
        });
      }
    } catch (e) {
      console.warn("Firebase client unavailable in Navbar:", e);
    }

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { auth } = getFirebaseClient();
      if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
    } catch (e) {
      console.error("Error signing out:", e);
    }

    if (typeof document !== "undefined") {
      document.cookie = "visroslot_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "slotora_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    setUserSession(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Industries", href: "/#industries" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${
        isScrolled
          ? "bg-[#F7F6F0]/95 dark:bg-[#10251D]/95 backdrop-blur-md border-[#D8DED8] dark:border-[#D8DED8]/20 shadow-sm py-3"
          : "bg-[#F7F6F0]/90 dark:bg-[#10251D]/90 backdrop-blur-sm border-[#D8DED8]/80 dark:border-[#D8DED8]/15 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Official VisroSlot Logo Lockup */}
          <div className="flex items-center">
            <VisroSlotLogo size="md" href="/" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-[#404944] dark:text-[#D8DED8] hover:text-[#046A38] dark:hover:text-[#9EF6B6] transition-colors duration-150 py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-3.5">
            {/* Phone direct link */}
            <a
              href={VISRO_PHONE_TEL}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#404944] hover:text-[#046A38] dark:text-[#A7B9AA] dark:hover:text-[#F7F6F0] transition-colors"
              title="Call VISROSLOT Operations"
            >
              <Phone className="w-3.5 h-3.5 text-[#046A38] dark:text-[#9EF6B6]" />
              <span className="font-mono">{VISRO_PHONE}</span>
            </a>

            {/* Theme Toggle */}
            <ThemeToggle variant="compact" size="sm" />

            {/* Profile Pill or Login / Get Started */}
            {userSession ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#FFFFFF] hover:bg-[#F7F6F0] dark:bg-[#043D2E] dark:hover:bg-[#046A38] border border-[#D8DED8] dark:border-[#D8DED8]/30 transition-all text-left shadow-xs"
                >
                  {userSession.photoURL ? (
                    <img src={userSession.photoURL} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-[#046A38]" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#043D2E] text-[#FFFFFF] font-bold text-xs flex items-center justify-center font-sans shadow-inner">
                      {userSession.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] max-w-[110px] truncate">
                    {userSession.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#707974] dark:text-[#A7B9AA]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#FFFFFF] dark:bg-[#10251D] border border-[#D8DED8] dark:border-[#D8DED8]/25 shadow-xl py-2 z-50 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-[#D8DED8] dark:border-[#D8DED8]/15">
                      <p className="font-semibold text-[#10251D] dark:text-[#FFFFFF] truncate">{userSession.displayName}</p>
                      <p className="text-[11px] text-[#707974] dark:text-[#A7B9AA] truncate mt-0.5">{userSession.email}</p>
                    </div>

                    <div className="py-1">
                      {userSession.hasBusiness ? (
                        <Link
                          href="/app/overview"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#F7F6F0] dark:hover:bg-[#043D2E] transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-[#046A38]" />
                          <span>Owner Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#F7F6F0] dark:hover:bg-[#043D2E] transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-[#046A38]" />
                          <span>My Customer Account</span>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#F7F6F0] dark:hover:bg-[#043D2E] transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-[#707974]" />
                        <span>Profile & Appointments</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#D8DED8] dark:border-[#D8DED8]/15">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#10251D] dark:text-[#FFFFFF] hover:text-[#046A38] dark:hover:text-[#9EF6B6] px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#046A38] hover:bg-[#043D2E] text-[#FFFFFF] text-xs font-bold transition-all duration-150 active:scale-95 shadow-sm"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle variant="compact" size="sm" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#D8DED8]/40 dark:hover:bg-[#043D2E] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F7F6F0] dark:bg-[#10251D] border-b border-[#D8DED8] dark:border-[#D8DED8]/20 px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#10251D] dark:text-[#FFFFFF] hover:bg-[#D8DED8]/40 dark:hover:bg-[#043D2E]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#D8DED8] dark:border-[#D8DED8]/20 space-y-2.5">
            <a
              href={VISRO_PHONE_TEL}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#404944] dark:text-[#A7B9AA]"
            >
              <Phone className="w-4 h-4 text-[#046A38]" />
              <span>{VISRO_PHONE}</span>
            </a>

            {userSession ? (
              <div className="space-y-2 pt-2">
                <Link
                  href={userSession.hasBusiness ? "/app/overview" : "/profile"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#046A38] text-[#FFFFFF] text-xs font-bold"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{userSession.hasBusiness ? "Go to Dashboard" : "My Account"}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg border border-[#D8DED8] dark:border-[#D8DED8]/30 text-[#10251D] dark:text-[#FFFFFF] text-xs font-bold"
                >
                  Sign In
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#046A38] text-[#FFFFFF] text-xs font-bold shadow-sm"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
