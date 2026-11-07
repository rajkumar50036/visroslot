import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { eligible: false, error: "TOKEN_REQUIRED", message: "Review security token is required." },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { eligible: false, error: "DB_UNAVAILABLE", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    // 1. Query appointment by security management token
    const apptSnap = await db
      .collection("appointments")
      .where("management_token", "==", token)
      .limit(1)
      .get();

    if (apptSnap.empty) {
      return NextResponse.json(
        { eligible: false, error: "NOT_FOUND", message: "Appointment record not found or token has expired." },
        { status: 404 }
      );
    }

    const apptDoc = apptSnap.docs[0];
    const appt = apptDoc.data();
    if (!appt) {
      return NextResponse.json(
        { eligible: false, error: "NOT_FOUND", message: "Appointment record is empty." },
        { status: 404 }
      );
    }
    const apptId = apptDoc.id;

    // 2. Fetch associated business name
    let businessName = "VISROSLOT Business";
    if (appt.business_id) {
      const busDoc = await db.collection("businesses").doc(appt.business_id).get();
      if (busDoc.exists) {
        businessName = busDoc.data()?.name || businessName;
      }
    }

    // 3. Status Eligibility Check: ONLY COMPLETED appointments are eligible for review
    const status = (appt.status || "").toUpperCase();
    if (status !== "COMPLETED") {
      let reasonMessage = "Reviews can only be submitted after your appointment is completed.";
      if (status === "CONFIRMED" || status === "PENDING") {
        reasonMessage = "Your appointment is currently scheduled. You will receive an invitation to review once your service is completed.";
      } else if (status === "CANCELLED") {
        reasonMessage = "This appointment was cancelled and is not eligible for review.";
      } else if (status === "NO_SHOW") {
        reasonMessage = "This appointment was marked as a no-show and is not eligible for review.";
      }

      return NextResponse.json({
        eligible: false,
        error: "NOT_COMPLETED",
        status,
        message: reasonMessage,
        appointment: {
          id: apptId,
          bookingReference: appt.booking_reference,
          serviceName: appt.service_name,
          appointmentDate: appt.appointment_date,
          businessName,
        },
      });
    }

    // 4. Single-Review Constraint Check: Has this appointment already been reviewed?
    const existingReviewSnap = await db
      .collection("reviews")
      .where("appointment_id", "==", apptId)
      .limit(1)
      .get();

    if (!existingReviewSnap.empty || appt.is_reviewed) {
      const existingReview = !existingReviewSnap.empty ? existingReviewSnap.docs[0].data() : null;
      return NextResponse.json({
        eligible: false,
        alreadyReviewed: true,
        error: "ALREADY_REVIEWED",
        message: "You have already submitted a review for this appointment. Thank you for your feedback!",
        review: existingReview
          ? {
              rating: existingReview.rating,
              feedback: existingReview.feedback,
              createdAt: existingReview.created_at,
              status: existingReview.status,
            }
          : null,
        appointment: {
          id: apptId,
          bookingReference: appt.booking_reference,
          serviceName: appt.service_name,
          appointmentDate: appt.appointment_date,
          businessName,
        },
      });
    }

    // 5. Eligible for new review
    return NextResponse.json({
      eligible: true,
      appointment: {
        id: apptId,
        bookingReference: appt.booking_reference,
        businessId: appt.business_id,
        businessName,
        serviceName: appt.service_name || "Consultation",
        staffName: appt.staff_name || null,
        customerName: appt.customer_name || "Valued Client",
        appointmentDate: appt.appointment_date,
        startTime: appt.start_time,
        endTime: appt.end_time,
      },
    });
  } catch (err: any) {
    console.error("[Review Verify Error]:", err);
    return NextResponse.json(
      { eligible: false, error: "SERVER_ERROR", message: err.message || "Failed to verify review eligibility." },
      { status: 500 }
    );
  }
}
