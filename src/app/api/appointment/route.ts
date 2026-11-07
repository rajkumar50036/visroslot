import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { sendAppointmentNotification } from "@/lib/notifications/appointmentNotifications";

export const dynamic = "force-dynamic";

const ManualBookingSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  staffId: z.string().optional().nullable(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid start time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid end time format"),
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z.string().min(7, "Valid phone number is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerNotes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED"]).optional().default("CONFIRMED"),
});

function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString().slice(-4);
  return `VISRO-${timestampPart}-${randomCode}`;
}

async function verifyOwnerAccess(req: NextRequest, businessId: string, db: any) {
  const authCookie =
    req.cookies.get("visroslot_session")?.value ||
    req.cookies.get("slotora_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!authCookie) {
    return { authorized: false, error: "UNAUTHORIZED", status: 401 };
  }

  const userId = authCookie;
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const userEmail = (userData?.email || "").toLowerCase().trim();
  const isPlatformOwner = userEmail === OWNER_EMAIL;

  const busDoc = await db.collection("businesses").doc(businessId).get();
  if (!busDoc.exists) {
    return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  }

  const bData = busDoc.data();
  const isOwner =
    isPlatformOwner ||
    bData.owner_id === userId ||
    (bData.owner_email && bData.owner_email.toLowerCase() === userEmail);

  if (!isOwner) {
    return { authorized: false, error: "FORBIDDEN", status: 403 };
  }

  return { authorized: true, busDoc, bData, userId, userEmail };
}

// GET: Fetch appointments with search and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId parameter required" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const authCheck = await verifyOwnerAccess(req, businessId, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const statusParam = searchParams.get("status") || "ALL";
    const dateParam = searchParams.get("date");
    const staffIdParam = searchParams.get("staffId");
    const serviceIdParam = searchParams.get("serviceId");
    const searchParam = (searchParams.get("search") || "").toLowerCase().trim();

    let queryRef: any = db.collection("appointments").where("business_id", "==", businessId);

    if (statusParam && statusParam !== "ALL") {
      queryRef = queryRef.where("status", "==", statusParam.toUpperCase());
    }

    if (dateParam) {
      queryRef = queryRef.where("appointment_date", "==", dateParam);
    }

    if (staffIdParam && staffIdParam !== "ALL") {
      queryRef = queryRef.where("staff_id", "==", staffIdParam);
    }

    if (serviceIdParam && serviceIdParam !== "ALL") {
      queryRef = queryRef.where("service_id", "==", serviceIdParam);
    }

    const snap = await queryRef.get();
    let appointments = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Apply text search filtering in-memory
    if (searchParam) {
      appointments = appointments.filter((a: any) => {
        return (
          (a.customer_name || "").toLowerCase().includes(searchParam) ||
          (a.customer_phone || "").includes(searchParam) ||
          (a.customer_email || "").toLowerCase().includes(searchParam) ||
          (a.service_name || "").toLowerCase().includes(searchParam) ||
          (a.booking_reference || "").toLowerCase().includes(searchParam)
        );
      });
    }

    // Sort by date desc, time desc
    appointments.sort((a: any, b: any) => {
      const dDiff = (b.appointment_date || "").localeCompare(a.appointment_date || "");
      if (dDiff !== 0) return dDiff;
      return (b.start_time || "").localeCompare(a.start_time || "");
    });

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load appointments" }, { status: 500 });
  }
}

// POST: Create manual appointment (walk-in or phone call)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ManualBookingSchema.parse(body);

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const authCheck = await verifyOwnerAccess(req, validated.businessId, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { bData } = authCheck;
    const startTimeClean = validated.startTime.length === 5 ? `${validated.startTime}:00` : validated.startTime;
    const endTimeClean = validated.endTime.length === 5 ? `${validated.endTime}:00` : validated.endTime;
    const cleanPhone = validated.customerPhone.trim();
    const cleanEmail = (validated.customerEmail || "").toLowerCase().trim();
    const customerFullName = validated.customerName.trim();

    // 1. Fetch Service metadata
    let serviceName = "Custom Service";
    let servicePrice = 0;
    try {
      const srvDoc = await db.collection("services").doc(validated.serviceId).get();
      if (srvDoc.exists) {
        const sData = srvDoc.data();
        serviceName = sData?.name || serviceName;
        servicePrice = Number(sData?.price) || 0;
      }
    } catch {}

    // 2. Resolve Staff Member
    let staffId = validated.staffId || null;
    let staffName = "Unassigned Staff";
    if (staffId) {
      try {
        const staffDoc = await db.collection("staff").doc(staffId).get();
        if (staffDoc.exists) {
          staffName = staffDoc.data()?.name || staffName;
        }
      } catch {}
    } else {
      // Pick first active staff if available
      try {
        const staffSnap = await db
          .collection("staff")
          .where("business_id", "==", validated.businessId)
          .where("is_active", "!=", false)
          .limit(1)
          .get();
        if (!staffSnap.empty) {
          staffId = staffSnap.docs[0].id;
          staffName = staffSnap.docs[0].data()?.name || "Specialist";
        }
      } catch {}
    }

    // 3. Atomically check double-booking conflict and save
    const bookingReference = generateBookingReference();
    const managementToken = crypto.randomBytes(24).toString("hex");
    let newApptId = "";
    let customerId = "";

    await db.runTransaction(async (transaction: any) => {
      // Check for overlapping appointments on this date and staff member
      const conflictQuery = await db
        .collection("appointments")
        .where("business_id", "==", validated.businessId)
        .where("appointment_date", "==", validated.appointmentDate)
        .where("status", "in", ["CONFIRMED", "PENDING"])
        .get();

      const conflicts = conflictQuery.docs.filter((doc: any) => {
        const d = doc.data();
        const overlaps = startTimeClean < d.end_time && endTimeClean > d.start_time;
        if (!overlaps) return false;
        // If specific staff assigned, conflict only if same staff
        if (staffId && d.staff_id) {
          return d.staff_id === staffId;
        }
        return true;
      });

      if (conflicts.length > 0) {
        throw new Error("DOUBLE_BOOKING_CONFLICT");
      }

      // Check/create customer
      const custQuery = await db
        .collection("customers")
        .where("business_id", "==", validated.businessId)
        .where("phone", "==", cleanPhone)
        .limit(1)
        .get();

      const nowIso = new Date().toISOString();
      const visitTimestamp = `${validated.appointmentDate}T${startTimeClean}Z`;

      if (!custQuery.empty) {
        const custDoc = custQuery.docs[0];
        customerId = custDoc.id;
        const cData = custDoc.data();
        transaction.update(custDoc.ref, {
          full_name: customerFullName || cData.full_name,
          email: cleanEmail || cData.email,
          total_bookings: (Number(cData.total_bookings) || 0) + 1,
          last_visit_at: visitTimestamp,
          updated_at: nowIso,
        });
      } else {
        const newCustRef = db.collection("customers").doc();
        customerId = newCustRef.id;
        transaction.set(newCustRef, {
          id: customerId,
          business_id: validated.businessId,
          full_name: customerFullName,
          email: cleanEmail,
          phone: cleanPhone,
          notes: validated.customerNotes || null,
          total_bookings: 1,
          last_visit_at: visitTimestamp,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      // Create appointment document
      const apptRef = db.collection("appointments").doc();
      newApptId = apptRef.id;

      transaction.set(apptRef, {
        id: apptRef.id,
        business_id: validated.businessId,
        service_id: validated.serviceId,
        service_name: serviceName,
        service_price: servicePrice,
        price: servicePrice,
        staff_id: staffId,
        staff_name: staffName,
        customer_id: customerId,
        customer_name: customerFullName,
        customer_email: cleanEmail,
        customer_phone: cleanPhone,
        booking_reference: bookingReference,
        management_token: managementToken,
        appointment_date: validated.appointmentDate,
        start_time: startTimeClean,
        end_time: endTimeClean,
        status: validated.status || "CONFIRMED",
        customer_notes: validated.customerNotes || null,
        created_by: "OWNER_MANUAL",
        created_at: nowIso,
        updated_at: nowIso,
      });
    });

    // 4. Dispatch Email Confirmation if email provided
    if (cleanEmail) {
      sendAppointmentNotification("CONFIRMED", {
        appointmentId: newApptId,
        bookingReference,
        businessId: validated.businessId,
        businessName: bData.name || "VISROSLOT Business",
        customerName: customerFullName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        serviceName,
        servicePrice,
        appointmentDate: validated.appointmentDate,
        startTime: startTimeClean,
        endTime: endTimeClean,
        staffName,
        managementToken,
      }).catch((e) => console.warn("Manual booking email dispatch warning:", e.message));
    }

    return NextResponse.json({
      success: true,
      appointmentId: newApptId,
      bookingReference,
      managementToken,
      status: validated.status || "CONFIRMED",
      message: "Appointment created successfully.",
    });
  } catch (err: any) {
    if (err.message === "DOUBLE_BOOKING_CONFLICT") {
      return NextResponse.json(
        {
          error: "SLOT_UNAVAILABLE",
          message: "This staff member already has an appointment booked during this time interval.",
        },
        { status: 409 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "VALIDATION_FAILED", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create appointment" }, { status: 500 });
  }
}
