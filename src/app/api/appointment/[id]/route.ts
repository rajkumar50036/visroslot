import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import {
  sendAppointmentNotification,
  sendReviewInvitation,
} from "@/lib/notifications/appointmentNotifications";

export const dynamic = "force-dynamic";

async function verifyAppointmentAccess(req: NextRequest, appointmentId: string, db: any) {
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

  const apptDoc = await db.collection("appointments").doc(appointmentId).get();
  if (!apptDoc.exists) {
    return { authorized: false, error: "APPOINTMENT_NOT_FOUND", status: 404 };
  }

  const apptData = apptDoc.data();
  const busDoc = await db.collection("businesses").doc(apptData.business_id).get();
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

  return { authorized: true, apptDoc, apptData, busDoc, bData, userId, userEmail };
}

// GET: View full appointment details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const authCheck = await verifyAppointmentAccess(req, id, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { apptData, bData } = authCheck;

    // Fetch related staff & customer records if present
    let staffRecord = null;
    if (apptData.staff_id) {
      const sDoc = await db.collection("staff").doc(apptData.staff_id).get();
      if (sDoc.exists) staffRecord = { id: sDoc.id, ...sDoc.data() };
    }

    let customerRecord = null;
    if (apptData.customer_id) {
      const cDoc = await db.collection("customers").doc(apptData.customer_id).get();
      if (cDoc.exists) customerRecord = { id: cDoc.id, ...cDoc.data() };
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id,
        ...apptData,
        businessName: bData.name,
        staff: staffRecord,
        customer: customerRecord,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load appointment" }, { status: 500 });
  }
}

// PATCH: Update status, reschedule date/time, or edit notes
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const authCheck = await verifyAppointmentAccess(req, id, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { apptDoc, apptData, bData } = authCheck;
    const body = await req.json();
    const action = body.action || "status_update";
    const nowIso = new Date().toISOString();

    // 1. ACTION: STATUS UPDATE
    if (action === "status_update") {
      const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
      const newStatus = (body.status || "").toUpperCase();

      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Permitted: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      const updatePayload: any = {
        status: newStatus,
        updated_at: nowIso,
      };

      if (newStatus === "COMPLETED") {
        updatePayload.completed_at = nowIso;
        // Update customer last visit
        if (apptData.customer_id) {
          try {
            await db.collection("customers").doc(apptData.customer_id).update({
              last_visit_at: nowIso,
              updated_at: nowIso,
            });
          } catch {}
        }
      } else if (newStatus === "CANCELLED") {
        updatePayload.cancelled_at = nowIso;
        updatePayload.cancellation_reason = body.cancellationReason || "Cancelled by business owner";
      } else if (newStatus === "NO_SHOW") {
        updatePayload.no_show_at = nowIso;
      } else if (newStatus === "CONFIRMED") {
        updatePayload.confirmed_at = nowIso;
      }

      await apptDoc.ref.update(updatePayload);

      // Dispatch appropriate notification to customer
      if (apptData.customer_email) {
        const notifType =
          newStatus === "COMPLETED"
            ? "COMPLETED"
            : newStatus === "CANCELLED"
            ? "CANCELLED"
            : newStatus === "CONFIRMED"
            ? "CONFIRMED"
            : null;

        const notifPayload = {
          appointmentId: id,
          bookingReference: apptData.booking_reference,
          businessId: apptData.business_id,
          businessName: bData.name,
          customerName: apptData.customer_name || "Valued Client",
          customerEmail: apptData.customer_email,
          customerPhone: apptData.customer_phone,
          serviceName: apptData.service_name || "Appointment",
          servicePrice: Number(apptData.service_price || 0),
          appointmentDate: apptData.appointment_date,
          startTime: apptData.start_time,
          endTime: apptData.end_time,
          staffName: apptData.staff_name,
          managementToken: apptData.management_token,
          cancellationReason: updatePayload.cancellation_reason,
        };

        if (notifType) {
          sendAppointmentNotification(notifType as any, notifPayload).catch((e) =>
            console.warn("Status update notification warning:", e.message)
          );
        }

        // Automatic Review Invitation on Appointment Completion (Phase 6)
        if (newStatus === "COMPLETED") {
          sendReviewInvitation(notifPayload).catch((e) =>
            console.warn("Review invitation warning:", e.message)
          );
        }
      } else if (newStatus === "COMPLETED") {
        // Record in-app review invitation even if no email is provided
        sendReviewInvitation({
          appointmentId: id,
          bookingReference: apptData.booking_reference,
          businessId: apptData.business_id,
          businessName: bData.name,
          customerName: apptData.customer_name || "Valued Client",
          customerEmail: "",
          customerPhone: apptData.customer_phone,
          serviceName: apptData.service_name || "Appointment",
          servicePrice: Number(apptData.service_price || 0),
          appointmentDate: apptData.appointment_date,
          startTime: apptData.start_time,
          endTime: apptData.end_time,
          staffName: apptData.staff_name,
          managementToken: apptData.management_token,
        }).catch((e) => console.warn("Review invitation warning:", e.message));
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `Appointment status updated to ${newStatus}.`,
      });
    }

    // 2. ACTION: RESCHEDULE
    if (action === "reschedule") {
      const { newDate, newStartTime, newEndTime, staffId } = body;
      if (!newDate || !newStartTime || !newEndTime) {
        return NextResponse.json(
          { error: "newDate, newStartTime and newEndTime are required" },
          { status: 400 }
        );
      }

      const formattedStart = newStartTime.length === 5 ? `${newStartTime}:00` : newStartTime;
      const formattedEnd = newEndTime.length === 5 ? `${newEndTime}:00` : newEndTime;
      const targetStaffId = staffId !== undefined ? staffId : apptData.staff_id;

      // Conflict validation for target staff member
      const conflictSnap = await db
        .collection("appointments")
        .where("business_id", "==", apptData.business_id)
        .where("appointment_date", "==", newDate)
        .where("status", "in", ["CONFIRMED", "PENDING"])
        .get();

      const hasConflict = conflictSnap.docs.some((doc: any) => {
        if (doc.id === id) return false; // exclude self
        const d = doc.data();
        const overlaps = formattedStart < d.end_time && formattedEnd > d.start_time;
        if (!overlaps) return false;
        if (targetStaffId && d.staff_id) {
          return d.staff_id === targetStaffId;
        }
        return true;
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            error: "DOUBLE_BOOKING_CONFLICT",
            message: "This specialist already has an active appointment at that time. Please select another slot.",
          },
          { status: 409 }
        );
      }

      let targetStaffName = apptData.staff_name;
      if (staffId && staffId !== apptData.staff_id) {
        const staffDoc = await db.collection("staff").doc(staffId).get();
        if (staffDoc.exists) targetStaffName = staffDoc.data()?.name || targetStaffName;
      }

      const previousDate = apptData.appointment_date;
      const previousTime = apptData.start_time;

      await apptDoc.ref.update({
        appointment_date: newDate,
        start_time: formattedStart,
        end_time: formattedEnd,
        staff_id: targetStaffId,
        staff_name: targetStaffName,
        status: "CONFIRMED",
        rescheduled_at: nowIso,
        updated_at: nowIso,
      });

      // Dispatch reschedule email
      if (apptData.customer_email) {
        sendAppointmentNotification("RESCHEDULED", {
          appointmentId: id,
          bookingReference: apptData.booking_reference,
          businessId: apptData.business_id,
          businessName: bData.name,
          customerName: apptData.customer_name || "Valued Client",
          customerEmail: apptData.customer_email,
          customerPhone: apptData.customer_phone,
          serviceName: apptData.service_name || "Appointment",
          servicePrice: Number(apptData.service_price || 0),
          appointmentDate: newDate,
          startTime: formattedStart,
          endTime: formattedEnd,
          staffName: targetStaffName,
          managementToken: apptData.management_token,
          previousDate,
          previousTime,
        }).catch((e) => console.warn("Reschedule notification warning:", e.message));
      }

      return NextResponse.json({
        success: true,
        message: `Appointment rescheduled to ${newDate} at ${newStartTime} successfully.`,
      });
    }

    // 3. ACTION: EDIT DETAILS / NOTES
    if (action === "edit") {
      const allowedFields = ["customer_notes", "notes", "staff_id", "service_id"];
      const updatePayload: any = { updated_at: nowIso };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updatePayload[field] = body[field];
        }
      }

      if (body.staff_id && body.staff_id !== apptData.staff_id) {
        const sDoc = await db.collection("staff").doc(body.staff_id).get();
        if (sDoc.exists) {
          updatePayload.staff_name = sDoc.data()?.name || "Specialist";
        }
      }

      await apptDoc.ref.update(updatePayload);
      return NextResponse.json({ success: true, message: "Appointment details updated." });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update appointment" }, { status: 500 });
  }
}
