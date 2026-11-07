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

    const { appointmentId, managementToken, customerPhone, reason } = body;

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

    // 2. Validate Cancellation Eligibility
    if (currentStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "ALREADY_CANCELLED", message: "This appointment has already been cancelled." },
        { status: 400 }
      );
    }

    if (currentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "ALREADY_COMPLETED", message: "Completed appointments cannot be cancelled." },
        { status: 400 }
      );
    }

    const businessId = apptData.business_id;

    // 3. Check Advance Cancellation Window Policy
    const busDoc = await db.collection("businesses").doc(businessId).get();
    const busData = busDoc.data() || {};
    const minAdvanceHours = Number(busData.cancellation_buffer_hours || busData.min_advance_hours || 2);

    try {
      const apptDateTime = new Date(`${apptData.appointment_date}T${(apptData.start_time || "09:00:00").slice(0, 5)}:00`);
      const now = new Date();
      const diffMs = apptDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
        return NextResponse.json(
          { error: "PAST_APPOINTMENT", message: "Cannot cancel an appointment after its scheduled start time." },
          { status: 400 }
        );
      }
    } catch (dateErr) {
      console.warn("Date parse error for cancellation check:", dateErr);
    }

    // 4. Update Status to CANCELLED
    const nowIso = new Date().toISOString();
    const cancellationReason = reason?.trim() || "Cancelled by customer through Customer AI";

    await apptDoc.ref.update({
      status: "CANCELLED",
      cancelled_at: nowIso,
      cancellation_reason: cancellationReason,
      updated_at: nowIso,
    });

    // 5. Send Cancellation Notification
    try {
      const busName = busData.name || "Service Provider";

      await sendAppointmentNotification("CANCELLED", {
        appointmentId: apptDoc.id,
        bookingReference: apptData.booking_reference || `VISRO-${apptDoc.id.slice(-6)}`,
        businessId,
        businessName: busName,
        customerName: apptData.customer_name || apptData.customer?.name || "Valued Customer",
        customerEmail: apptData.customer_email || apptData.customer?.email || "",
        customerPhone: apptData.customer_phone || apptData.customer?.phone,
        serviceName: apptData.service_name || "Specialist Service",
        servicePrice: Number(apptData.price || apptData.service_price || 0),
        appointmentDate: apptData.appointment_date,
        startTime: apptData.start_time,
        endTime: apptData.end_time,
        staffName: apptData.staff_name || null,
        managementToken: apptData.management_token,
        cancellationReason,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch cancellation notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Appointment successfully cancelled.",
      refundNotice: "Cancellation successful. No automatic refunds are issued; refunds are processed according to the business policy.",
      bookingReference: apptData.booking_reference,
    });
  } catch (err: any) {
    console.error("[Customer Cancel Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
