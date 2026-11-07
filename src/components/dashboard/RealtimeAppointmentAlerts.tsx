"use client";

import React, { useEffect, useState, useRef } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { playBookingChime } from "@/lib/sound/soundEffects";
import { Bell, CheckCircle2, X } from "lucide-react";
import Link from "next/link";

interface RealtimeAlertProps {
  businessId: string;
}

export function RealtimeAppointmentAlerts({ businessId }: RealtimeAlertProps) {
  const [latestAlert, setLatestAlert] = useState<{
    id: string;
    customerName: string;
    serviceName: string;
    time: string;
    date: string;
  } | null>(null);

  const isFirstMount = useRef(true);
  const mountTime = useRef(new Date().toISOString());

  useEffect(() => {
    if (!businessId) return;

    const { db, isConfigured } = getFirebaseClient();
    if (!isConfigured || !db) return;

    try {
      const q = query(
        collection(db, "appointments"),
        where("business_id", "==", businessId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              // Only alert for appointments created after page opened
              if (data.created_at && data.created_at >= mountTime.current) {
                // 1. Play loud booking chime
                playBookingChime({ volume: 0.9 });

                // 2. Set in-app toast
                setLatestAlert({
                  id: change.doc.id,
                  customerName: data.customer_name || data.customer?.name || "Customer",
                  serviceName: data.service_name || data.service?.name || "Service",
                  time: data.start_time || "Scheduled Time",
                  date: data.appointment_date || "Today",
                });

                // 3. System desktop notification
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                  try {
                    new Notification("🔔 New Appointment Booked!", {
                      body: `${data.customer_name || "Customer"} booked ${data.service_name || "Service"} for ${data.appointment_date} at ${data.start_time}.`,
                      icon: "/assets/visroslot-logo.png",
                    });
                  } catch (e) {
                    // Ignore notification error
                  }
                }
              }
            }
          });
        },
        (err) => {
          console.warn("[Realtime Appt Alert Listener Error]:", err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn("[Realtime Alert Setup Error]:", e);
    }
  }, [businessId]);

  if (!latestAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl border border-[#C49A46]/40 shadow-2xl flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#C49A46] border border-amber-500/30 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 animate-bounce" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono uppercase font-bold text-[#C49A46]">
            New Appointment!
          </span>
          <button
            onClick={() => setLatestAlert(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-bold text-white truncate mt-0.5">
          {latestAlert.customerName}
        </p>
        <p className="text-xs text-slate-300 truncate">
          {latestAlert.serviceName} • {latestAlert.date} at {latestAlert.time}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/app/appointments"
            onClick={() => setLatestAlert(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C49A46] text-navy-950 hover:brightness-105 transition-all inline-block"
          >
            View in Calendar
          </Link>
          <button
            onClick={() => setLatestAlert(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
