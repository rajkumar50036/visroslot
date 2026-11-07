import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD or DD-MM-YYYY
  const staffId = searchParams.get("staffId");
  const requestedDuration = searchParams.get("serviceDuration");

  if (!businessId || !dateStr) {
    return NextResponse.json(
      { error: "Missing required query parameters: businessId, date" },
      { status: 400 }
    );
  }

  // Parse target date and day of week safely for both YYYY-MM-DD and DD-MM-YYYY
  const parts = dateStr.split("-").map(Number);
  let year: number, month: number, day: number;
  if (parts[0] > 1000) {
    // YYYY-MM-DD
    [year, month, day] = parts;
  } else {
    // DD-MM-YYYY
    [day, month, year] = parts;
  }
  const normalizedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday...

  const { db, isConfigured } = getFirebaseAdmin();
  if (!db || !isConfigured) {
    const res = generateLocalFallbackSlots(normalizedDate, 30);
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return res;
  }

  // If a demo ID is received, route to the real founder business
  const targetBusinessId = businessId.startsWith("demo") ? "2715CnLUsE7SU6ylo9EU" : businessId;

  try {
    const dateMatches = Array.from(new Set([normalizedDate, dateStr]));

    // Parallel fetch: Business, Service, Holidays, Hours, Breaks, Staff, and Appointments all in ONE concurrent round-trip!
    const [busDoc, srvDoc, holidaySnap, hoursSnap, breaksSnap, staffSnap, apptsSnap] = await Promise.all([
      db.collection("businesses").doc(targetBusinessId).get(),
      serviceId ? db.collection("services").doc(serviceId).get() : Promise.resolve(null as any),
      db
        .collection("business_holidays")
        .where("business_id", "==", targetBusinessId)
        .where("holiday_date", "in", [normalizedDate, dateStr])
        .limit(1)
        .get()
        .catch(() => ({ empty: true, docs: [] } as any)),
      db
        .collection("business_hours")
        .where("business_id", "==", targetBusinessId)
        .where("day_of_week", "==", dayOfWeek)
        .limit(1)
        .get()
        .catch(() => ({ empty: true, docs: [] } as any)),
      db
        .collection("business_breaks")
        .where("business_id", "==", targetBusinessId)
        .where("day_of_week", "==", dayOfWeek)
        .get()
        .catch(() => ({ docs: [] } as any)),
      db
        .collection("staff")
        .where("business_id", "==", targetBusinessId)
        .where("is_active", "!=", false)
        .get()
        .catch(() => ({ docs: [] } as any)),
      db
        .collection("appointments")
        .where("business_id", "==", targetBusinessId)
        .where("appointment_date", "in", dateMatches)
        .where("status", "in", ["CONFIRMED", "PENDING"])
        .get()
        .catch(() => ({ docs: [] } as any)),
    ]);

    if (!busDoc || !busDoc.exists) {
      return NextResponse.json({ error: "Business not found or inactive" }, { status: 404 });
    }
    const business = busDoc.data()!;
    if (business.is_active === false) {
      return NextResponse.json({ error: "Business is inactive" }, { status: 404 });
    }

    let duration = 30;
    if (srvDoc && srvDoc.exists) {
      const service = srvDoc.data()!;
      if (service.is_active === false) {
        return NextResponse.json({ error: "Service is inactive" }, { status: 404 });
      }
      duration = service.duration_minutes || 30;
    } else if (requestedDuration) {
      duration = parseInt(requestedDuration, 10) || 30;
    }

    const interval = business.slot_interval_minutes || 30;
    const buffer = business.buffer_minutes || 0;

    // 3. Check for Holiday
    if (!holidaySnap.empty) {
      return NextResponse.json({
        available: false,
        reason: `Business is closed for holiday: ${holidaySnap.docs[0].data().reason || "Public Holiday"}`,
        slots: [],
      });
    }

    // 4. Fetch Operating Hours for dayOfWeek (fallback to 09:00 - 19:00 if not configured)
    let openTimeStr = "09:00:00";
    let closeTimeStr = "19:00:00";

    if (!hoursSnap.empty) {
      const operatingHours = hoursSnap.docs[0].data();
      if (operatingHours.is_open === false) {
        return NextResponse.json({
          available: false,
          reason: "Business is closed on this day of the week.",
          slots: [],
        });
      }
      openTimeStr = operatingHours.open_time || "09:00:00";
      closeTimeStr = operatingHours.close_time || "19:00:00";
    }

    // Convert time strings to minutes from midnight
    const timeToMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const minToTime = (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    };

    const format12Hour = (min: number) => {
      let h = Math.floor(min / 60);
      const m = min % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const openMin = timeToMin(openTimeStr);
    const closeMin = timeToMin(closeTimeStr);

    const breakRanges = breaksSnap.docs.map((d: any) => {
      const data = d.data();
      return {
        start: timeToMin(data.start_time),
        end: timeToMin(data.end_time),
      };
    });

    const activeStaffList = staffSnap.docs.map((d: any) => ({
      id: d.id,
      name: d.data().name || "Specialist",
      role: d.data().role_title || "Staff Member",
    }));

    // Filter appointments according to selected staff member or business capacity
    const relevantAppts = apptsSnap.docs.map((d: any) => {
      const data = d.data();
      return {
        staffId: data.staff_id,
        start: timeToMin(data.start_time),
        end: timeToMin(data.end_time),
      };
    });

    const isSpecificStaff = Boolean(staffId && staffId !== "any" && staffId !== "all");

    // 7. Check if target date is today (accounting for IST UTC+5:30)
    const now = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffsetMs);
    const todayY = istNow.getFullYear();
    const todayM = String(istNow.getMonth() + 1).padStart(2, "0");
    const todayD = String(istNow.getDate()).padStart(2, "0");
    const todayIstStr = `${todayY}-${todayM}-${todayD}`;
    const serverTodayStr = now.toISOString().split("T")[0];

    const isToday =
      normalizedDate === todayIstStr ||
      normalizedDate === serverTodayStr ||
      dateStr === todayIstStr ||
      dateStr === serverTodayStr;
    const currentMinutesFromMidnight = istNow.getHours() * 60 + istNow.getMinutes();

    // 8. Generate Candidate Slots
    const availableSlots = [];
    for (let cur = openMin; cur + duration <= closeMin; cur += interval) {
      const slotStart = cur;
      const slotEnd = cur + duration;

      // RULE: If target date is today and slot start has passed, mark unavailable
      if (isToday && slotStart <= currentMinutesFromMidnight) {
        continue;
      }

      // Check break collisions
      const inBreak = breakRanges.some((b: any) => slotStart < b.end && slotEnd > b.start);
      if (inBreak) continue;

      // Check appointment collisions
      if (isSpecificStaff) {
        // Must check if this specific staff member is busy
        const staffBusy = relevantAppts.some((appt: any) => {
          if (appt.staffId && appt.staffId !== staffId) return false;
          const bufferedStart = appt.start - buffer;
          const bufferedEnd = appt.end + buffer;
          return slotStart < bufferedEnd && slotEnd > bufferedStart;
        });
        if (staffBusy) continue;
      } else {
        // Any staff: Slot is unavailable ONLY if all active staff members are busy
        const totalCapacity = Math.max(activeStaffList.length, 1);
        const overlappingAppointments = relevantAppts.filter((appt: any) => {
          const bufferedStart = appt.start - buffer;
          const bufferedEnd = appt.end + buffer;
          return slotStart < bufferedEnd && slotEnd > bufferedStart;
        });

        // Count unique busy staff
        const busyStaffIds = new Set(overlappingAppointments.map((a: any) => a.staffId).filter(Boolean));
        if (busyStaffIds.size >= totalCapacity || overlappingAppointments.length >= totalCapacity) {
          continue;
        }
      }

      availableSlots.push({
        startTime: minToTime(slotStart),
        endTime: minToTime(slotEnd),
        formattedTime: format12Hour(slotStart),
        available: true,
      });
    }

    return NextResponse.json(
      {
        available: true,
        businessId,
        date: dateStr,
        serviceDuration: duration,
        slots: availableSlots,
        staff: activeStaffList,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=5, s-maxage=20, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate available slots" },
      { status: 500 }
    );
  }
}

function generateLocalFallbackSlots(dateStr: string, durationMinutes: number) {
  // Realistic fallback schedule generator for offline development
  const standardTimes = [
    { start: "09:00:00", formatted: "9:00 AM" },
    { start: "09:30:00", formatted: "9:30 AM" },
    { start: "10:15:00", formatted: "10:15 AM" },
    { start: "11:00:00", formatted: "11:00 AM" },
    { start: "11:45:00", formatted: "11:45 AM" },
    { start: "14:00:00", formatted: "2:00 PM" },
    { start: "14:45:00", formatted: "2:45 PM" },
    { start: "15:30:00", formatted: "3:30 PM" },
    { start: "16:15:00", formatted: "4:15 PM" },
    { start: "17:00:00", formatted: "5:00 PM" },
    { start: "17:45:00", formatted: "5:45 PM" },
    { start: "18:30:00", formatted: "6:30 PM" },
  ];

  const now = new Date();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffsetMs);
  const todayY = istNow.getFullYear();
  const todayM = String(istNow.getMonth() + 1).padStart(2, "0");
  const todayD = String(istNow.getDate()).padStart(2, "0");
  const todayIstStr = `${todayY}-${todayM}-${todayD}`;
  const serverTodayStr = now.toISOString().split("T")[0];

  const isToday = dateStr === todayIstStr || dateStr === serverTodayStr;
  const currentMinutesFromMidnight = istNow.getHours() * 60 + istNow.getMinutes();

  const slots = standardTimes
    .filter((st) => {
      // RULE: In a day if the slot start time (e.g. 9 AM) is over, do not show available slot!
      if (!isToday) return true;
      const [h, m] = st.start.split(":").map(Number);
      return h * 60 + m > currentMinutesFromMidnight;
    })
    .map((st) => {
      const [h, m] = st.start.split(":").map(Number);
      const endMin = h * 60 + m + durationMinutes;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      return {
        startTime: st.start,
        endTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`,
        formattedTime: st.formatted,
        available: true,
      };
    });

  return NextResponse.json({
    available: true,
    date: dateStr,
    serviceDuration: durationMinutes,
    slots,
  });
}
