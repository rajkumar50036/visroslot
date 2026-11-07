import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { CustomerAppointmentSummary } from "@/types/database";

export const dynamic = "force-dynamic";

function normalizePhone(p: string): string {
  const digits = (p || "").replace(/\D/g, "");
  // Return last 10 digits if longer
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.businessId || !body.phone) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "businessId and customer phone number are required." },
        { status: 400 }
      );
    }

    const { businessId, phone, email, bookingReference, verificationCode, action } = body;
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "INVALID_PHONE", message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB_UNAVAILABLE", message: "Database service unavailable." }, { status: 503 });
    }

    // Optional: Request a 6-digit verification code
    if (action === "request-code") {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await db.collection("customer_verification_codes").doc(`${businessId}_${cleanPhone}`).set({
        business_id: businessId,
        phone: cleanPhone,
        code,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Verification code generated.",
        demoCodeNotice: process.env.NODE_ENV !== "production" ? `(Demo OTP: ${code})` : undefined,
      });
    }

    // Optional: Verify 6-digit verification code if provided
    if (verificationCode) {
      const codeDoc = await db.collection("customer_verification_codes").doc(`${businessId}_${cleanPhone}`).get();
      if (!codeDoc.exists) {
        return NextResponse.json({ error: "INVALID_CODE", message: "No verification code requested." }, { status: 400 });
      }
      const codeData = codeDoc.data();
      if (codeData?.code !== String(verificationCode).trim()) {
        return NextResponse.json({ error: "INVALID_CODE", message: "Incorrect verification code." }, { status: 400 });
      }
      if (new Date(codeData?.expires_at) < new Date()) {
        return NextResponse.json({ error: "EXPIRED_CODE", message: "Verification code has expired." }, { status: 400 });
      }
    }

    // 1. Fetch Business Profile for Policies
    const busDoc = await db.collection("businesses").doc(businessId).get();
    const busData = busDoc.data() || {};
    const minAdvanceHours = Number(busData.min_advance_hours) || 2;

    // 2. Query Appointments for this business and phone
    // Query by business_id to enforce multi-tenant isolation
    const apptsQuery = await db
      .collection("appointments")
      .where("business_id", "==", businessId)
      .get();

    const now = new Date();
    const allMatching: CustomerAppointmentSummary[] = [];

    apptsQuery.forEach((doc: any) => {
      const data = doc.data();
      const apptPhone = normalizePhone(data.customer_phone || data.customer?.phone || "");
      const apptEmail = (data.customer_email || data.customer?.email || "").toLowerCase().trim();
      const apptRef = (data.booking_reference || "").toUpperCase().trim();

      const phoneMatches = apptPhone === cleanPhone;
      const refMatches = bookingReference ? apptRef === bookingReference.toUpperCase().trim() : false;
      const emailMatches = email ? apptEmail === email.toLowerCase().trim() : false;

      // Allow match if phone matches OR booking reference matches
      if (phoneMatches || refMatches || emailMatches) {
        const apptDateStr = data.appointment_date;
        const startTimeStr = data.start_time || "09:00:00";
        let isPast = false;

        try {
          const apptDateTime = new Date(`${apptDateStr}T${startTimeStr.slice(0, 5)}:00`);
          isPast = apptDateTime < now;
        } catch {
          isPast = false;
        }

        const status = (data.status || "CONFIRMED").toUpperCase();
        const canCancel = (status === "CONFIRMED" || status === "PENDING") && !isPast;
        const canReschedule = (status === "CONFIRMED" || status === "PENDING") && !isPast;

        allMatching.push({
          id: doc.id,
          booking_reference: data.booking_reference || `VISRO-${doc.id.slice(-6)}`,
          management_token: data.management_token || doc.id,
          business_id: businessId,
          service_id: data.service_id || "",
          service_name: data.service_name || "Specialist Service",
          service_price: Number(data.price || data.service_price || 0),
          duration_minutes: Number(data.duration_minutes || 30),
          staff_id: data.staff_id || null,
          staff_name: data.staff_name || null,
          appointment_date: data.appointment_date,
          start_time: data.start_time,
          end_time: data.end_time,
          status,
          customer_name: data.customer_name || data.customer?.name || "Customer",
          customer_phone: data.customer_phone || data.customer?.phone || cleanPhone,
          customer_email: data.customer_email || data.customer?.email,
          is_reviewed: Boolean(data.is_reviewed),
          can_reschedule: canReschedule,
          can_cancel: canCancel,
          created_at: data.created_at || now.toISOString(),
        });
      }
    });

    // Sort descending by appointment date and time
    allMatching.sort((a, b) => `${b.appointment_date} ${b.start_time}`.localeCompare(`${a.appointment_date} ${a.start_time}`));

    const upcoming = allMatching.filter(a => (a.status === "CONFIRMED" || a.status === "PENDING") && a.can_cancel);
    const completed = allMatching.filter(a => a.status === "COMPLETED" || (!a.can_cancel && a.status === "CONFIRMED"));
    const cancelled = allMatching.filter(a => a.status === "CANCELLED");

    return NextResponse.json({
      success: true,
      totalCount: allMatching.length,
      upcoming,
      completed,
      cancelled,
      businessName: busData.name || "VisroSlot Partner",
      cancellationPolicy: busData.cancellation_policy || `Cancellations permitted up to ${minAdvanceHours} hours in advance.`,
      reschedulingPolicy: busData.rescheduling_policy || `Rescheduling permitted up to ${minAdvanceHours} hours in advance.`,
    });
  } catch (err: any) {
    console.error("[Customer Lookup Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
