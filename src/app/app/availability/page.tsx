"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CalendarDays,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

interface DaySchedule {
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface HolidayItem {
  id?: string;
  holiday_date: string;
  reason: string;
}

export default function AvailabilityPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferTime, setBufferTime] = useState(5);
  const [minAdvanceHours, setMinAdvanceHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day_of_week: 0, day_name: "Sunday", is_open: true, open_time: "09:00", close_time: "20:00" },
    { day_of_week: 1, day_name: "Monday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 2, day_name: "Tuesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 3, day_name: "Wednesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 4, day_name: "Thursday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 5, day_name: "Friday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 6, day_name: "Saturday", is_open: true, open_time: "09:00", close_time: "19:00" },
  ]);

  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");

  useEffect(() => {
    async function loadAvailability() {
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
          let bId = "";
          let busData: any = {};
          let busSnap = await getDocs(
            query(collection(db, "businesses"), where("owner_id", "==", uid))
          );
          if (busSnap.empty && auth?.currentUser?.email) {
            busSnap = await getDocs(
              query(collection(db, "businesses"), where("owner_email", "==", auth.currentUser.email.toLowerCase()))
            );
          }

          if (!busSnap.empty) {
            bId = busSnap.docs[0].id;
            busData = busSnap.docs[0].data();
          } else {
            // Strict Privacy: Do not leak another user's schedule
            setLoading(false);
            return;
          }

          if (bId) {
            setBusinessId(bId);
            setSlotInterval(busData.slot_interval_minutes || 30);
            setBufferTime(busData.buffer_minutes || 5);
            setMinAdvanceHours(busData.min_advance_hours || 2);
            setMaxAdvanceDays(busData.max_advance_days || 30);

            // Fetch business_hours
            const hoursSnap = await getDocs(
              query(collection(db, "business_hours"), where("business_id", "==", bId))
            );
            if (!hoursSnap.empty) {
              const hours = hoursSnap.docs.map((d) => d.data());
              const mapped = daysOfWeek.map((name, dow) => {
                const found = hours.find((h: any) => h.day_of_week === dow);
                return {
                  day_of_week: dow,
                  day_name: name,
                  is_open: found ? found.is_open : true,
                  open_time: found ? found.open_time.slice(0, 5) : "09:00",
                  close_time: found ? found.close_time.slice(0, 5) : "19:00",
                };
              });
              setSchedule(mapped);
            }

            // Fetch business_holidays
            const holSnap = await getDocs(
              query(collection(db, "business_holidays"), where("business_id", "==", bId))
            );
            const hols = holSnap.docs.map((d) => ({
              id: d.id,
              holiday_date: d.data().holiday_date,
              reason: d.data().reason,
            })) as HolidayItem[];
            setHolidays(hols);
          }
        }
      } catch (err) {
        console.error("Availability load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  const handleScheduleChange = (
    index: number,
    field: keyof DaySchedule,
    value: any
  ) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleSaveAll = async () => {
    if (!businessId) return;
    setSaving(true);
    setFeedback(null);

    const { db } = getFirebaseClient();
    if (!db) {
      setFeedback({ type: "error", message: "Database connection unavailable." });
      setSaving(false);
      return;
    }

    try {
      // 1. Update business timing buffer config
      await updateDoc(doc(db, "businesses", businessId), {
        slot_interval_minutes: Number(slotInterval),
        buffer_minutes: Number(bufferTime),
        min_advance_hours: Number(minAdvanceHours),
        max_advance_days: Number(maxAdvanceDays),
        updated_at: new Date().toISOString(),
      });

      // 2. Upsert business_hours for all 7 days
      for (const day of schedule) {
        const hourDocId = `${businessId}_day_${day.day_of_week}`;
        await setDoc(doc(db, "business_hours", hourDocId), {
          business_id: businessId,
          day_of_week: day.day_of_week,
          is_open: day.is_open,
          open_time: day.open_time,
          close_time: day.close_time,
          updated_at: new Date().toISOString(),
        });
      }

      setFeedback({
        type: "success",
        message: "Operating schedule, buffer times & advance rules saved to Firestore.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save schedule." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !businessId) return;

    const { db } = getFirebaseClient();
    if (!db) return;

    try {
      const docRef = await addDoc(collection(db, "business_holidays"), {
        business_id: businessId,
        holiday_date: newHolidayDate,
        reason: newHolidayReason.trim() || "Closed for Holiday",
        created_at: new Date().toISOString(),
      });

      setHolidays((prev) => [
        ...prev,
        {
          id: docRef.id,
          holiday_date: newHolidayDate,
          reason: newHolidayReason.trim() || "Closed for Holiday",
        },
      ]);
      setNewHolidayDate("");
      setNewHolidayReason("");
    } catch (err: any) {
      console.error("Error adding holiday:", err);
    }
  };

  const handleDeleteHoliday = async (id?: string) => {
    if (!id) return;
    const { db } = getFirebaseClient();
    if (!db) return;
    try {
      await deleteDoc(doc(db, "business_holidays", id));
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (e) {
      console.error("Error deleting holiday:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-600">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading availability matrix from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Availability & Buffer Engine
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Weekly operating hours, post-appointment buffer intervals, and holiday closures
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gold-400 hover:brightness-110 text-navy-950 text-xs font-mono font-bold shadow-gold flex items-center gap-2 self-start md:self-auto transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving..." : "Save Operating Rules"}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Timing & Buffer Settings */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-6">
        <h2 className="font-display text-lg font-black uppercase text-navy-950 border-b border-navy-100 pb-3">
          Slot Intervals & Buffer Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
              Slot Interval
            </label>
            <select
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono font-bold focus:outline-none focus:border-gold-500"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
              Post-Service Buffer
            </label>
            <select
              value={bufferTime}
              onChange={(e) => setBufferTime(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono font-bold focus:outline-none focus:border-gold-500"
            >
              <option value="0">0 Minutes (Back-to-back)</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="20">20 Minutes</option>
              <option value="30">30 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
              Minimum Advance Booking
            </label>
            <select
              value={minAdvanceHours}
              onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono font-bold focus:outline-none focus:border-gold-500"
            >
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="4">4 Hours</option>
              <option value="24">24 Hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
              Maximum Booking Horizon
            </label>
            <select
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono font-bold focus:outline-none focus:border-gold-500"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Operating Schedule */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 pb-3">
          <h2 className="font-display text-lg font-black uppercase text-navy-950">
            Weekly Operating Schedule
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSchedule((prev) =>
                  prev.map((d) => ({
                    ...d,
                    is_open: true,
                    open_time: "09:00",
                    close_time: "19:00",
                  }))
                );
              }}
              className="px-3 py-1 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 font-mono text-[11px] font-bold border border-navy-200 transition-colors"
            >
              Preset: 9 AM - 7 PM (All Days)
            </button>
            <button
              type="button"
              onClick={() => {
                setSchedule((prev) =>
                  prev.map((d) => ({
                    ...d,
                    is_open: true,
                    open_time: "08:00",
                    close_time: "22:00",
                  }))
                );
              }}
              className="px-3 py-1 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 font-mono text-[11px] font-bold border border-navy-200 transition-colors"
            >
              Preset: 8 AM - 10 PM (All Days)
            </button>
          </div>
        </div>

        <div className="divide-y divide-navy-100">
          {schedule.map((day, idx) => (
            <div
              key={day.day_name}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 w-40">
                <input
                  type="checkbox"
                  id={`day-${idx}`}
                  checked={day.is_open}
                  onChange={(e) => handleScheduleChange(idx, "is_open", e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-400"
                />
                <label
                  htmlFor={`day-${idx}`}
                  className={`text-sm font-bold ${
                    day.is_open ? "text-navy-950" : "text-navy-400 line-through"
                  }`}
                >
                  {day.day_name}
                </label>
              </div>

              {day.is_open ? (
                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-navy-500">Opens:</span>
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) => handleScheduleChange(idx, "open_time", e.target.value)}
                      className="px-3 py-1.5 bg-navy-50 border border-navy-200 rounded-xl text-navy-950 font-bold"
                    />
                  </div>
                  <span className="text-navy-400">to</span>
                  <div className="flex items-center gap-2">
                    <span className="text-navy-500">Closes:</span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) => handleScheduleChange(idx, "close_time", e.target.value)}
                      className="px-3 py-1.5 bg-navy-50 border border-navy-200 rounded-xl text-navy-950 font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs text-navy-400 italic">
                  Closed on this day
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Holidays & Emergency Closures */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-6">
        <h2 className="font-display text-lg font-black uppercase text-navy-950 border-b border-navy-100 pb-3">
          Special Holiday Closures
        </h2>

        {/* Add Holiday Form */}
        <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            required
            value={newHolidayDate}
            onChange={(e) => setNewHolidayDate(e.target.value)}
            className="px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono focus:outline-none focus:border-gold-500"
          />
          <input
            type="text"
            placeholder="Reason (e.g. Diwali / National Holiday)"
            value={newHolidayReason}
            onChange={(e) => setNewHolidayReason(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-navy-950 text-gold-400 text-xs font-mono font-bold hover:bg-navy-900 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Closure</span>
          </button>
        </form>

        {/* Holidays List */}
        {holidays.length === 0 ? (
          <p className="text-xs text-navy-400 italic">No special holiday closures registered.</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h) => (
              <div
                key={h.id || h.holiday_date}
                className="p-3 rounded-2xl bg-navy-50/50 border border-navy-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-navy-950">{h.holiday_date}</span>
                  <span className="text-navy-600">• {h.reason}</span>
                </div>
                <button
                  onClick={() => handleDeleteHoliday(h.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
