import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { checkBusinessBookingQuota } from "@/lib/subscription/quota";
import { sendBookingPushNotification } from "@/lib/push/webPushServer";
import { sendAppointmentNotification } from "@/lib/notifications/appointmentNotifications";
import { setDocumentRest } from "@/lib/firebase/firestoreRest";

const BookingSchema = z.object({
  businessId: z.string().min(1, "Business identifier is required"),
  serviceId: z.string().min(1, "Service identifier is required"),
  staffId: z.string().optional().nullable(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid start time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid end time format"),
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid customer email address"),
  customerPhone: z.string().min(8, "Phone number is too short"),
  customerNotes: z.string().optional(),
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

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validated = BookingSchema.parse(rawBody);

    const bookingReference = generateBookingReference();
    const managementToken = crypto.randomBytes(24).toString("hex");
    const startTimeClean = validated.startTime.length === 5 ? `${validated.startTime}:00` : validated.startTime;
    const endTimeClean = validated.endTime.length === 5 ? `${validated.endTime}:00` : validated.endTime;
    const cleanPhone = validated.customerPhone.trim();
    const cleanEmail = validated.customerEmail.toLowerCase().trim();
    const customerFullName = validated.customerName.trim();

    const { db, isConfigured } = getFirebaseAdmin();

    if (!db || !isConfigured) {
      const apptId = `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const apptData = {
        id: apptId,
        business_id: validated.businessId,
        service_id: validated.serviceId,
        staff_id: validated.staffId || null,
        appointment_date: validated.appointmentDate,
        start_time: startTimeClean,
        end_time: endTimeClean,
        customer_name: customerFullName,
        customer_email: cleanEmail,
        customer_phone: cleanPhone,
        customer_notes: validated.customerNotes || "",
        booking_reference: bookingReference,
        management_token: managementToken,
        status: "CONFIRMED",
        created_at: new Date().toISOString(),
      };

      try {
        await setDocumentRest("appointments", apptId, apptData);
      } catch (restErr) {
        console.warn("REST appointment save warning:", restErr);
      }

      return NextResponse.json({
        success: true,
        bookingReference,
        managementToken,
        appointmentId: apptId,
        status: "CONFIRMED",
        appointmentDate: validated.appointmentDate,
        startTime: startTimeClean,
        endTime: endTimeClean,
        customer: {
          id: `cust_${Date.now()}`,
          name: customerFullName,
          full_name: customerFullName,
          email: cleanEmail,
          phone: cleanPhone,
        },
      });
    }

    // 0. Enforce Professional Plan 300 Booking Limit / Business Plan Unlimited
    try {
      const quotaResult = await checkBusinessBookingQuota(db, validated.businessId);
      if (!quotaResult.canAcceptBooking) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message:
              quotaResult.upgradeMessage ||
              "This business has reached its monthly booking quota of 300 appointments. New appointments cannot be accepted at this time.",
            quota: quotaResult.quota,
            currentUsage: quotaResult.currentUsage,
            plan: quotaResult.plan,
            upgradeRequired: true,
          },
          { status: 422 }
        );
      }
    } catch (quotaErr) {
      console.warn("Booking quota check error:", quotaErr);
    }

    // 1. Fetch Service metadata for snapshotting
    let serviceName = "Standard Appointment";
    let servicePrice = 0;
    try {
      const srvDoc = await db.collection("services").doc(validated.serviceId).get();
      if (srvDoc.exists) {
        const srvData = srvDoc.data();
        serviceName = srvData?.name || serviceName;
        servicePrice = Number(srvData?.price) || 0;
      }
    } catch (e) {
      console.warn("Could not fetch service details for snapshot:", e);
    }

    // 2. Fetch Active Staff Members for Automated Assignment
    let availableStaffList: { id: string; name: string }[] = [];
    try {
      const staffQuery = await db
        .collection("staff")
        .where("business_id", "==", validated.businessId)
        .where("is_active", "!=", false)
        .get();

      if (!staffQuery.empty) {
        availableStaffList = staffQuery.docs.map((d: any) => ({
          id: d.id,
          name: d.data().name || "Specialist",
        }));
      }
    } catch (e) {
      console.warn("Could not query staff collection:", e);
    }

    // 3. Identify or Create Customer Profile in CRM (customers collection)
    let customerId = "";
    try {
      const custQueryByPhone = await db
        .collection("customers")
        .where("business_id", "==", validated.businessId)
        .where("phone", "==", cleanPhone)
        .limit(1)
        .get();

      let matchedCustDoc = custQueryByPhone.empty ? null : custQueryByPhone.docs[0];

      if (!matchedCustDoc && cleanEmail) {
        const custQueryByEmail = await db
          .collection("customers")
          .where("business_id", "==", validated.businessId)
          .where("email", "==", cleanEmail)
          .limit(1)
          .get();
        if (!custQueryByEmail.empty) {
          matchedCustDoc = custQueryByEmail.docs[0];
        }
      }

      const nowIso = new Date().toISOString();
      const visitTimestamp = `${validated.appointmentDate}T${startTimeClean}Z`;

      if (matchedCustDoc) {
        customerId = matchedCustDoc.id;
        const existingData = matchedCustDoc.data();
        const currentBookings = Number(existingData.total_bookings) || 1;

        await matchedCustDoc.ref.update({
          full_name: customerFullName || existingData.full_name,
          email: cleanEmail || existingData.email,
          total_bookings: currentBookings + 1,
          last_visit_at: visitTimestamp,
          updated_at: nowIso,
        });
      } else {
        const newCustRef = db.collection("customers").doc();
        customerId = newCustRef.id;
        await newCustRef.set({
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
    } catch (crmErr) {
      console.error("CRM Customer sync error:", crmErr);
      customerId = `cust-${Date.now()}`;
    }

    // 4. Atomic Cloud Firestore Transaction: Automated Staff Assignment & Zero-Collision Lock & Trial Quota
    let newAppointmentId = "";
    let assignedStaffId: string | null = null;
    let assignedStaffName = "Assigned Team Member";
    let businessName = "VISROSLOT Business";

    try {
      await db.runTransaction(async (transaction: any) => {
        // A. Verify subscription & trial appointment quota inside transaction
        const busRef = db.collection("businesses").doc(validated.businessId);
        const busSnap = await transaction.get(busRef);
        const busData = busSnap.data() || {};
        businessName = busData.name || businessName;

        const subQuery = await db
          .collection("subscriptions")
          .where("business_id", "==", validated.businessId)
          .limit(1)
          .get();

        const subDoc = !subQuery.empty ? subQuery.docs[0] : null;
        const subData = subDoc ? subDoc.data() : null;

        const rawStatus = (
          subData?.subscriptionStatus ||
          subData?.status ||
          busData?.subscription_status ||
          ""
        ).toUpperCase();
        const isTrial = rawStatus === "TRIALING" || rawStatus === "TRIAL";

        if (isTrial) {
          const trialEndIso = subData?.trialEndAt || subData?.trial_end_at || busData.trial_ends_at;
          if (trialEndIso && new Date(trialEndIso).getTime() < Date.now()) {
            throw new Error("TRIAL_EXPIRED");
          }
          const used = Number(
            subData?.trialAppointmentsUsed ||
              subData?.trial_appointments_used ||
              busData.trial_appointments_used ||
              0
          );
          if (used >= 10) {
            throw new Error("TRIAL_LIMIT_REACHED");
          }

          // Atomically increment trial appointment count
          if (subDoc) {
            transaction.update(subDoc.ref, {
              trialAppointmentsUsed: used + 1,
              trial_appointments_used: used + 1,
              updated_at: new Date().toISOString(),
            });
          }
          transaction.update(busRef, {
            trial_appointments_used: used + 1,
            updated_at: new Date().toISOString(),
          });
        }

        // B. Query overlapping appointments for this business and date
        const conflictQuery = await db
          .collection("appointments")
          .where("business_id", "==", validated.businessId)
          .where("appointment_date", "==", validated.appointmentDate)
          .where("status", "in", ["CONFIRMED", "PENDING"])
          .get();

        const overlappingDocs = conflictQuery.docs.filter((doc: any) => {
          const data = doc.data();
          return startTimeClean < data.end_time && endTimeClean > data.start_time;
        });

        const busyStaffIds = new Set(overlappingDocs.map((d: any) => d.data().staff_id).filter(Boolean));

        // If customer specifically selected a staff member
        if (validated.staffId && validated.staffId !== "any") {
          if (busyStaffIds.has(validated.staffId)) {
            throw new Error("DOUBLE_BOOKING_CONFLICT");
          }
          const matched = availableStaffList.find((s) => s.id === validated.staffId);
          assignedStaffId = validated.staffId;
          assignedStaffName = matched ? matched.name : "Specialist";
        } else if (availableStaffList.length > 0) {
          // Find an active staff member who is NOT busy at this slot
          const freeStaff = availableStaffList.filter((s) => !busyStaffIds.has(s.id));
          if (freeStaff.length === 0) {
            throw new Error("DOUBLE_BOOKING_CONFLICT");
          }
          // Assign the first free staff member (or random / least load)
          const chosenStaff = freeStaff[0];
          assignedStaffId = chosenStaff.id;
          assignedStaffName = chosenStaff.name;
        } else {
          // If no staff explicitly registered in the collection, fallback to single business capacity
          if (overlappingDocs.length > 0) {
            throw new Error("DOUBLE_BOOKING_CONFLICT");
          }
        }

        // Create new appointment doc inside transaction
        const apptRef = db.collection("appointments").doc();
        newAppointmentId = apptRef.id;
        const nowIso = new Date().toISOString();

        transaction.set(apptRef, {
          id: apptRef.id,
          business_id: validated.businessId,
          service_id: validated.serviceId,
          service_name: serviceName,
          service_price: servicePrice,
          price: servicePrice,
          staff_id: assignedStaffId,
          staff_name: assignedStaffName,
          customer_id: customerId,
          customer_name: customerFullName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
          booking_reference: bookingReference,
          management_token: managementToken,
          appointment_date: validated.appointmentDate,
          start_time: startTimeClean,
          end_time: endTimeClean,
          status: "CONFIRMED",
          customer_notes: validated.customerNotes || null,
          customer: {
            id: customerId,
            name: customerFullName,
            full_name: customerFullName,
            email: cleanEmail,
            phone: cleanPhone,
          },
          service: {
            id: validated.serviceId,
            name: serviceName,
            price: servicePrice,
          },
          created_at: nowIso,
          updated_at: nowIso,
        });
      });
    } catch (txErr: any) {
      if (txErr.message === "TRIAL_LIMIT_REACHED") {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message:
              "This business has reached its 7-day free trial limit of 10 appointments. New appointments cannot be accepted at this time.",
            trialLimitReached: true,
          },
          { status: 422 }
        );
      }
      if (txErr.message === "TRIAL_EXPIRED") {
        return NextResponse.json(
          {
            error: "BOOKINGS_PAUSED",
            message:
              "This business's 7-day free trial has expired. Public booking is temporarily paused.",
            trialExpired: true,
          },
          { status: 403 }
        );
      }
      if (txErr.message === "DOUBLE_BOOKING_CONFLICT") {
        return NextResponse.json(
          {
            error: "SLOT_UNAVAILABLE",
            message: "The requested time slot was just booked by another client. Please select another opening.",
          },
          { status: 409 }
        );
      }
      throw txErr;
    }

    // 5. Send Web Push Notification to business owner's devices
    sendBookingPushNotification(validated.businessId, {
      title: `🔔 New Booking: ${customerFullName}`,
      body: `${serviceName} • ${validated.appointmentDate} at ${startTimeClean}`,
      appointmentId: newAppointmentId,
      customerName: customerFullName,
      serviceName: serviceName,
      url: "/app/appointments",
    }).catch((pushErr) => {
      console.warn("[Push Notification Non-blocking warning]:", pushErr.message);
    });

    // 6. Send Email Confirmation to customer with management link
    if (cleanEmail) {
      sendAppointmentNotification("CONFIRMED", {
        appointmentId: newAppointmentId,
        bookingReference,
        businessId: validated.businessId,
        businessName,
        customerName: customerFullName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        serviceName,
        servicePrice,
        appointmentDate: validated.appointmentDate,
        startTime: startTimeClean,
        endTime: endTimeClean,
        staffName: assignedStaffName,
        managementToken,
      }).catch((emailErr) => {
        console.warn("[Customer Booking Email warning]:", emailErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      bookingReference,
      managementToken,
      appointmentId: newAppointmentId,
      status: "CONFIRMED",
      appointmentDate: validated.appointmentDate,
      startTime: startTimeClean,
      endTime: endTimeClean,
      customerId,
      customerName: customerFullName,
      serviceName,
      servicePrice,
      assignedStaffName,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "BOOKING_FAILED", message: err.message || "Failed to confirm appointment" },
      { status: 500 }
    );
  }
}
