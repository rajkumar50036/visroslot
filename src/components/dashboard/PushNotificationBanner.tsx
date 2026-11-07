"use client";

import React, { useState, useEffect } from "react";
import { Bell, Volume2, CheckCircle2, ShieldCheck, X, Sparkles } from "lucide-react";
import { playBookingChime } from "@/lib/sound/soundEffects";

interface PushNotificationBannerProps {
  businessId: string;
  userId?: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationBanner({ businessId, userId }: PushNotificationBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setSupported(false);
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // Register service worker if not already registered
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // If already granted, auto-sync subscription in the background
        if (Notification.permission === "granted" && businessId) {
          syncSubscription(reg, businessId, userId);
        }
      })
      .catch((err) => {
        console.warn("[SW Register Warning]:", err);
      });
  }, [businessId, userId]);

  const syncSubscription = async (
    registration: ServiceWorkerRegistration,
    bizId: string,
    uId?: string
  ) => {
    try {
      const resKey = await fetch("/api/notifications/subscribe");
      const keyData = await resKey.json();
      const vapidPublicKey = keyData.vapidPublicKey;

      if (!vapidPublicKey) return;

      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: bizId,
          userId: uId || null,
          subscription: sub.toJSON(),
        }),
      });
    } catch (e) {
      // Non-blocking sync error
    }
  };

  const handleEnableNotifications = async () => {
    if (!supported) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Play chime immediately as audible proof
      await playBookingChime({ volume: 0.8 });

      // 2. Request browser permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const reg = await navigator.serviceWorker.ready;
        await syncSubscription(reg, businessId, userId);
        setStatusMessage("✅ Sound & background alerts are active!");

        // Show test notification
        if ("showNotification" in reg) {
          reg.showNotification("🔔 VISROSLOT Alerts Active!", {
            body: "You will receive sound and lock-screen alerts whenever an appointment is booked—even when the website is closed.",
            icon: "/assets/visroslot-logo.png",
            badge: "/assets/visroslot-logo.png",
          });
        }
      } else {
        setStatusMessage("Notification permission was denied. Please allow notifications in browser settings.");
      }
    } catch (err: any) {
      console.error("[Enable Push Error]:", err);
      setStatusMessage("Failed to enable push: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleTestSound = async () => {
    await playBookingChime({ volume: 0.9 });
    if (Notification.permission === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("🔊 Sound Test Successful!", {
        body: "New appointment notification chime played.",
        icon: "/assets/visroslot-logo.png",
      });
    }
  };

  if (!supported || dismissed) return null;

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 text-slate-900 dark:text-white shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#C49A46] border border-amber-500/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Booking Chime & Lock-Screen Notifications
              </h4>
              {permission === "granted" ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Receive a loud notification chime and lock-screen alert whenever a customer books an appointment—<strong>even when this website is closed and your phone screen is off</strong>.
            </p>
            {statusMessage && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                {statusMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {permission !== "granted" ? (
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-navy-950 bg-gradient-to-r from-[#D9B66E] to-[#C49A46] hover:brightness-105 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{loading ? "Activating..." : "Enable Sound & Push Alerts"}</span>
            </button>
          ) : (
            <button
              onClick={handleTestSound}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#C49A46]" />
              <span>Test Sound Chime</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
