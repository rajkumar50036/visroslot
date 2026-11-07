"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck 
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Business Timing Settings
  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferTime, setBufferTime] = useState(5);
  const [minAdvanceHours, setMinAdvanceHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);

  // Weekly Hours
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day_of_week: 0, day_name: "Sunday", is_open: false, open_time: "09:00", close_time: "18:00" },
    { day_of_week: 1, day_name: "Monday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 2, day_name: "Tuesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 3, day_name: "Wednesday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 4, day_name: "Thursday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 5, day_name: "Friday", is_open: true, open_time: "09:00", close_time: "19:00" },
    { day_of_week: 6, day_name: "Saturday", is_open: true, open_time: "09:00", close_time: "19:00" },
  ]);

  // Holidays List
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
        const uid = auth?.currentUser?.uid || (typeof document !== "undefined" && document.cookie.match(/slotora_session=([^;]+)/)?.[1]);
        if (uid) {
          const busSnap = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
          if (!busSnap.empty) {
            const bId = busSnap.docs[0].id;
            const bus = busSnap.docs[0].data();
            setBusinessId(bId);
            setSlotInterval(bus.slot_interval_minutes || 30);
            setBufferTime(bus.buffer_minutes || 0);
            setMinAdvanceHours(bus.min_advance_hours || 2);
            setMaxAdvanceDays(bus.max_advance_days || 30);

            // Fetch hours from Firestore
            const hoursSnap = await getDocs(query(collection(db, "business_hours"), where("business_id", "==", bId)));
            if (!hoursSnap.empty) {
              const hours = hoursSnap.docs.map((d) => d.data());
              const mapped = daysOfWeek.map((name, dow) => {
                const found = hours.find((h: any) => h.day_of_week === dow);
                return {
                  day_of_week: dow,
                  day_name: name,
                  is_open: found ? found.is_open : dow !== 0,
                  open_time: found ? found.open_time.slice(0, 5) : "09:00",
                  close_time: found ? found.close_time.slice(0, 5) : "19:00",
                };
              });
              setSchedule(mapped);
            }

            // Fetch holidays from Firestore
            const holsSnap = await getDocs(query(collection(db, "business_holidays"), where("business_id", "==", bId)));
            const hols = holsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as HolidayItem[];
            setHolidays(hols);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAvailability();
  }, []);

  const handleDayToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, is_open: !d.is_open } : d))
    );
  };

  const handleTimeChange = (index: number, field: "open_time" | "close_time", value: string) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate) return;
    const newHol: HolidayItem = {
      holiday_date: newHolidayDate,
      reason: newHolidayReason.trim() || "Closed for holiday",
    };

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db && businessId) {
      const holRef = doc(collection(db, "business_holidays"));
      await setDoc(holRef, {
        id: holRef.id,
        business_id: businessId,
        holiday_date: newHolidayDate,
        reason: newHolidayReason.trim() || "Closed for holiday",
        created_at: new Date().toISOString(),
      });
      newHol.id = holRef.id;
    }

    setHolidays((prev) => [...prev, newHol]);
    setNewHolidayDate("");
    setNewHolidayReason("");
  };

  const handleDeleteHoliday = async (item: HolidayItem, index: number) => {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db && item.id) {
      await deleteDoc(doc(db, "business_holidays", item.id));
    }
    setHolidays((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setFeedback(null);
    const { db, isConfigured } = getFirebaseClient();

    if (!isConfigured || !db || !businessId) {
      setSaving(false);
      setFeedback({ type: "success", message: "Schedule updated in local state." });
      return;
    }

    try {
      // 1. Update Business Settings in Firestore
      await updateDoc(doc(db, "businesses", businessId), {
        slot_interval_minutes: Number(slotInterval),
        buffer_minutes: Number(bufferTime),
        min_advance_hours: Number(minAdvanceHours),
        max_advance_days: Number(maxAdvanceDays),
        updated_at: new Date().toISOString(),
      });

      // 2. Save Weekly Hours in Firestore
      for (const d of schedule) {
        const hourDocId = `${businessId}_dow_${d.day_of_week}`;
        await setDoc(doc(db, "business_hours", hourDocId), {
          id: hourDocId,
          business_id: businessId,
          day_of_week: d.day_of_week,
          is_open: d.is_open,
          open_time: `${d.open_time}:00`,
          close_time: `${d.close_time}:00`,
          updated_at: new Date().toISOString(),
        });
      }

      setFeedback({ type: "success", message: "Working hours & booking rules saved to Firestore successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update schedule" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F0E6] text-[#171717] font-sans antialiased overflow-hidden">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#F5F0E6]">
        {/* Header */}
        <header className="h-16 px-8 border-b border-[#DCD8CF] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-display font-bold tracking-tight text-[#171717]">
                Working Hours & Scheduling Rules
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171717] text-[#C8E56A]">
                Operating Matrix
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#77736D]">
              Configure weekly availability, buffers, and holidays
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E75A32] hover:bg-[#D24823] active:scale-[0.98] shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save All Changes</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section 1: Weekly Schedule Table */}
          <div className="bg-white rounded-2xl border border-[#DCD8CF] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-display font-bold text-[#171717]">Weekly Operating Hours</h2>
            <p className="text-xs font-sans text-[#77736D]">
              Slots are only computed and offered during open hours.
            </p>

            <div className="divide-y divide-[#DCD8CF]/60">
              {schedule.map((item, idx) => (
                <div key={item.day_name} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="w-32 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`day-${item.day_of_week}`}
                      checked={item.is_open}
                      onChange={() => handleDayToggle(idx)}
                      className="rounded text-[#E75A32] focus:ring-[#E75A32] cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${item.day_of_week}`}
                      className={`font-mono font-bold uppercase tracking-wider cursor-pointer ${item.is_open ? "text-[#171717]" : "text-[#A39E93]"}`}
                    >
                      {item.day_name}
                    </label>
                  </div>

                  {item.is_open ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[#77736D]">Opens:</span>
                        <input
                          type="time"
                          value={item.open_time}
                          onChange={(e) => handleTimeChange(idx, "open_time", e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#DCD8CF] bg-white text-xs font-mono font-semibold focus:outline-none focus:border-[#E75A32]"
                        />
                      </div>
                      <span className="text-[#DCD8CF]">—</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[#77736D]">Closes:</span>
                        <input
                          type="time"
                          value={item.close_time}
                          onChange={(e) => handleTimeChange(idx, "close_time", e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#DCD8CF] bg-white text-xs font-mono font-semibold focus:outline-none focus:border-[#E75A32]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77736D] bg-[#FAF7F2] border border-[#DCD8CF] px-3 py-1 rounded-full">
                      Closed for bookings
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Booking Interval & Buffer Rules */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Appointment Policies & Slot Timing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slot Interval
                </label>
                <select
                  value={slotInterval}
                  onChange={(e) => setSlotInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value={15}>Every 15 mins</option>
                  <option value={30}>Every 30 mins (Default)</option>
                  <option value={45}>Every 45 mins</option>
                  <option value={60}>Every 60 mins</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Frequency of booking start times</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buffer Time
                </label>
                <select
                  value={bufferTime}
                  onChange={(e) => setBufferTime(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>0 mins (No buffer)</option>
                  <option value={5}>5 mins buffer</option>
                  <option value={10}>10 mins buffer</option>
                  <option value={15}>15 mins buffer</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Prep time added after appointments</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Notice
                </label>
                <select
                  value={minAdvanceHours}
                  onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 hour in advance</option>
                  <option value={2}>2 hours in advance</option>
                  <option value={4}>4 hours in advance</option>
                  <option value={24}>24 hours (1 day)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Prevents sudden last-minute bookings</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Advance
                </label>
                <select
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value={14}>14 days ahead</option>
                  <option value={30}>30 days ahead (1 month)</option>
                  <option value={60}>60 days ahead (2 months)</option>
                  <option value={90}>90 days ahead (3 months)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">How far clients can book</span>
              </div>
            </div>
          </div>

          {/* Section 3: Holidays & Specific Closures */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Holiday & Planned Closures</h2>
            <p className="text-xs text-slate-500">
              The scheduling engine will automatically block all booking slots on these dates.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Holiday reason (e.g. Diwali, Team Offsite)"
                value={newHolidayReason}
                onChange={(e) => setNewHolidayReason(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                disabled={!newHolidayDate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
            </div>

            {holidays.length > 0 && (
              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {holidays.map((hol, i) => (
                  <div key={hol.holiday_date} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{hol.holiday_date}</span>
                      <span className="text-slate-500">— {hol.reason}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(hol, i)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
