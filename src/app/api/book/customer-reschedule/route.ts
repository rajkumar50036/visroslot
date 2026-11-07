import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { sendAppointmentNotification } from "@/lib/notifications/appointmentNotifications";

export const dynamic = "force-dynamic";

function normalizePhone(p: string): string {
  const digits = (p || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Request payload required." }, { status: 400 });
    }

    const { appointmentId, managementToken, customerPhone, newDate, newStartTime, newEndTime } = body;

    if (!newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "New appointment date and start/end times are required." },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB_UNAVAILABLE", message: "Database service unavailable." }, { status: 503 });
    }

    // 1. Locate the appointment document
    let apptDoc: any = null;

    if (managementToken) {
      const q = await db.collection("appointments").where("management_token", "==", managementToken).limit(1).get();
      if (!q.empty) apptDoc = q.docs[0];
    }

    if (!apptDoc && appointmentId) {
      const doc = await db.collection("appointments").doc(appointmentId).get();
      if (doc.exists) {
        const data = doc.data();
        // Verify phone matches if token not provided
        const cleanPhone = normalizePhone(customerPhone || "");
        const apptPhone = normalizePhone(data?.customer_phone || data?.customer?.phone || "");
        if (cleanPhone && apptPhone === cleanPhone) {
          apptDoc = doc;
        }
      }
    }

    if (!apptDoc) {
      return NextResponse.json(
        { error: "APPOINTMENT_NOT_FOUND", message: "Appointment not found or customer verification failed." },
        { status: 404 }
      );
    }

    const apptData = apptDoc.data();
    const currentStatus = (apptData.status || "").toUpperCase();

    // 2. Validate Rescheduling Eligibility
    if (currentStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "ALREADY_CANCELLED", message: "Cancelled appointments cannot be rescheduled. Please book a new appointment." },
        { status: 400 }
      );
    }

    if (currentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "ALREADY_COMPLETED", message: "Completed appointments cannot be rescheduled. Please book a new appointment." },
        { status: 400 }
      );
    }

    const businessId = apptData.business_id;

    // 3. Double-Booking Prevention on the new slot
    const startTimeClean = newStartTime.length === 5 ? `${newStartTime}:00` : newStartTime;
    const endTimeClean = newEndTime.length === 5 ? `${newEndTime}:00` : newEndTime;

    let clashQuery = db
      .collection("appointments")
      .where("business_id", "==", businessId)
      .where("appointment_date", "==", newDate)
      .where("start_time", "==", startTimeClean);

    if (apptData.staff_id) {
      clashQuery = clashQuery.where("staff_id", "==", apptData.staff_id);
    }

    const clashSnap = await clashQuery.get();
    const activeClash = clashSnap.docs.find((d: any) => {
      if (d.id === apptDoc.id) return false; // Ignore the appointment itself
      const st = (d.data().status || "").toUpperCase();
      return st !== "CANCELLED" && st !== "NO_SHOW";
    });

    if (activeClash) {
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE", message: "This slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    // 4. Update the appointment atomically
    const previousDate = apptData.appointment_date;
    const previousTime = apptData.start_time;
    const nowIso = new Date().toISOString();

    await apptDoc.ref.update({
      appointment_date: newDate,
      start_time: startTimeClean,
      end_time: endTimeClean,
      rescheduled_at: nowIso,
      updated_at: nowIso,
      status: "CONFIRMED",
    });

    // 5. Send Rescheduled Notification
    try {
      const busDoc = await db.collection("businesses").doc(businessId).get();
      const busName = busDoc.data()?.name || "Service Provider";

      await sendAppointmentNotification("RESCHEDULED", {
        appointmentId: apptDoc.id,
        bookingReference: apptData.booking_reference || `VISRO-${apptDoc.id.slice(-6)}`,
        businessId,
        businessName: busName,
        customerName: apptData.customer_name || apptData.customer?.name || "Valued Customer",
        customerEmail: apptData.customer_email || apptData.customer?.email || "",
        customerPhone: apptData.customer_phone || apptData.customer?.phone,
        serviceName: apptData.service_name || "Specialist Service",
        servicePrice: Number(apptData.price || apptData.service_price || 0),
        appointmentDate: newDate,
        startTime: startTimeClean,
        endTime: endTimeClean,
        staffName: apptData.staff_name || null,
        managementToken: apptData.management_token,
        previousDate,
        previousTime,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch reschedule notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Appointment successfully rescheduled.",
      appointment: {
        id: apptDoc.id,
        booking_reference: apptData.booking_reference,
        new_date: newDate,
        new_start_time: startTimeClean,
        new_end_time: endTimeClean,
        status: "CONFIRMED",
      },
    });
  } catch (err: any) {
    console.error("[Customer Reschedule Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
