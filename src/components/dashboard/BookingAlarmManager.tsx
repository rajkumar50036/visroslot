"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Volume2,
  VolumeX,
  BellRing,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";

/**
 * Utility to convert base64 VAPID public key into Uint8Array for PushManager
 */
function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Synthesizes a loud, warm, 2-second dual-tone chime via Web Audio API.
 * Frequency combination: D5 (587.33 Hz) -> E5 (659.25 Hz) with A5 (880 Hz) -> D6 (1174.66 Hz)
 */
export function playBookingChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primary Tone: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.35);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.45, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic Tone: A5 (880 Hz) resonant chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.6);

    gain2.gain.setValueAtTime(0.001, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.5, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 1.3);

    osc2.start(now + 0.18);
    osc2.stop(now + 2.2);
  } catch (e) {
    console.warn("Could not synthesize booking chime:", e);
  }
}

interface BookingAlarmManagerProps {
  businessId?: string;
  userId?: string;
  className?: string;
}

export function BookingAlarmManager({
  businessId,
  userId,
  className = "",
}: BookingAlarmManagerProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [recentAlert, setRecentAlert] = useState<{ customer: string; time: string } | null>(null);
  const [pushStatus, setPushStatus] = useState<"checking" | "unsupported" | "prompt" | "granted" | "denied">("checking");
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoad = useRef(true);

  // 1. Restore sound preference and inspect Push Notification support
  useEffect(() => {
    try {
      const stored = localStorage.getItem("visroslot_booking_sound");
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
      const dismissed = localStorage.getItem("visroslot_push_banner_dismissed");
      if (dismissed === "true") {
        setBannerDismissed(true);
      }
    } catch (e) {}

    // Check service worker & Notification API support
    if (typeof window !== "undefined") {
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        setPushStatus("unsupported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "granted") {
        setPushStatus("granted");
        // Ensure service worker is registered and subscription refreshed
        registerServiceWorkerAndSync();
      } else if (permission === "denied") {
        setPushStatus("denied");
      } else {
        setPushStatus("prompt");
      }
    }
  }, [businessId, userId]);

  // Register service worker and maintain subscription
  const registerServiceWorkerAndSync = async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      if (!("PushManager" in window)) return;

      // Get VAPID public key
      const keyRes = await fetch("/api/push/subscribe");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) return;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(keyData.publicKey),
        });
      }

      if (sub && businessId) {
        // Post subscription to server
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            businessId,
            userId: userId || null,
          }),
        });
      }
    } catch (e: any) {
      console.warn("Background Push registration warning:", e.message);
    }
  };

  // User explicitly clicks "Enable Loud Phone Alarms (Even if Phone/Site is Off)"
  const handleEnablePushAlarms = async () => {
    setIsSubscribingPush(true);
    try {
      // Warm up audio element on direct user gesture
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        alert("Push notifications are not supported on this browser. Please use Google Chrome or install as a PWA.");
        setPushStatus("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushStatus("granted");
        await registerServiceWorkerAndSync();

        // Trigger immediate test notification so the user hears & sees it working
        playFullAlarm(true);
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "TRIGGER_NOTIFICATION",
            title: "🔔 VISROSLOT Alarms Activated!",
            body: "You will hear loud chimes & vibrations even when your phone is locked or website is closed.",
          });
        }
      } else if (permission === "denied") {
        setPushStatus("denied");
      }
    } catch (err: any) {
      console.error("Error enabling push alarms:", err);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("visroslot_booking_sound", String(next));
    } catch (e) {}

    // If enabling sound, warm up audio
    if (next && audioRef.current) {
      audioRef.current.load();
      playBookingChime();
    }
  };

  // Plays both Web Audio API chime AND HTML5 audio element + vibration
  const playFullAlarm = (isTest = false) => {
    playBookingChime();

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      // Distinct pulsing alert vibration pattern
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
    }
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    playFullAlarm(true);

    // If service worker is active, also trigger system notification
    if (Notification.permission === "granted" && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "TRIGGER_NOTIFICATION",
        title: "🔔 VISROSLOT Alarm Test Chime",
        body: "Sample booking alert sound. Your phone and audio system are working!",
      });
    }

    setTimeout(() => setIsPlayingTest(false), 2200);
  };

  // Real-time Firestore snapshot listener for foreground notifications
  useEffect(() => {
    if (!businessId) return;
    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) return;

    try {
      const q = query(
        collection(db, "appointments"),
        where("business_id", "==", businessId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Skip first snapshot so existing appointments don't trigger sound on load
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (soundEnabled) {
              playFullAlarm(false);
            }

            const customer = data.customer_name || data.customerName || "Customer";
            const time = data.slot_start_time || data.startTime || new Date().toLocaleTimeString();

            setRecentAlert({ customer, time });

            // If tab is in background and permission is granted, trigger desktop notification
            if (
              document.visibilityState === "hidden" &&
              Notification.permission === "granted" &&
              navigator.serviceWorker.controller
            ) {
              navigator.serviceWorker.controller.postMessage({
                type: "TRIGGER_NOTIFICATION",
                title: `🔔 New Booking: ${customer}`,
                body: `Appointment scheduled for ${time}. Tap to view.`,
                url: "/app/overview",
              });
            }

            setTimeout(() => setRecentAlert(null), 9000);
          }
        });
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Error subscribing to appointment alerts:", e);
    }
  }, [businessId, soundEnabled]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Hidden preloaded high-fidelity audio element */}
      <audio
        ref={audioRef}
        src="/sounds/booking-chime.wav"
        preload="auto"
        className="hidden"
      />

      {/* Real-time alert pill when appointment arrives */}
      {recentAlert && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs animate-pulse shadow-sm">
          <BellRing className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">New Booking:</span>
          <span>
            {recentAlert.customer} ({recentAlert.time})
          </span>
        </div>
      )}

      {/* Push Notification Setup Pill (Shown when user hasn't enabled background/lockscreen push yet) */}
      {pushStatus === "prompt" && !bannerDismissed && (
        <button
          type="button"
          onClick={handleEnablePushAlarms}
          disabled={isSubscribingPush}
          title="Enable phone lock-screen and background audio alarms"
          className="px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-105 shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse"
        >
          {isSubscribingPush ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Activating Phone Alarm...</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Phone-Off Alarms</span>
            </>
          )}
        </button>
      )}

      {/* Active Phone Alarm Status Badge */}
      {pushStatus === "granted" && (
        <span
          title="Phone-off & background alarm active: You will hear loud chimes & vibrations even when your phone is locked or website is closed."
          className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="hidden sm:inline">Phone Alarms Active</span>
          <span className="sm:hidden">Active</span>
        </span>
      )}

      {/* Permission Blocked Guide */}
      {pushStatus === "denied" && (
        <span
          title="Notifications are blocked in your browser settings. Please allow notifications in site settings to hear alarms when website is closed."
          className="px-2.5 py-1 rounded-full text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 text-rose-500" />
          <span className="hidden sm:inline">Notifications Blocked (Check Browser Settings)</span>
          <span className="sm:hidden">Blocked</span>
        </span>
      )}

      {/* Sound Chime Toggle Button */}
      <button
        type="button"
        onClick={toggleSound}
        title={
          soundEnabled
            ? "Loud booking chime enabled (tap to mute)"
            : "Booking chime muted (tap to enable)"
        }
        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
          soundEnabled
            ? "bg-amber-50 dark:bg-navy-900 border-amber-300 dark:border-navy-700 text-slate-800 dark:text-amber-300 hover:border-amber-400"
            : "bg-slate-100 dark:bg-navy-950 border-slate-200 dark:border-navy-800 text-slate-400 hover:text-slate-600"
        }`}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Sound ON</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Muted</span>
          </>
        )}
      </button>

      {/* Test Sound Button */}
      <button
        type="button"
        onClick={handleTestSound}
        disabled={isPlayingTest}
        title="Test the loud 2-second booking chime & vibration"
        className="px-2.5 py-1.5 rounded-full text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
      >
        {isPlayingTest ? (
          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
        ) : (
          <Sparkles className="w-3 h-3 text-amber-500" />
        )}
        <span className="hidden md:inline">Test Alarm</span>
      </button>
    </div>
  );
}
