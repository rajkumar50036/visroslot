import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const ReviewSubmissionSchema = z.object({
  token: z.string().min(1, "Review security token is required"),
  rating: z.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  feedback: z.string().max(1000, "Written feedback must be under 1000 characters").optional().default(""),
});

/**
 * Recomputes and updates the average rating and count on the business document.
 */
async function updateBusinessRatingAggregate(db: any, businessId: string) {
  try {
    const reviewsSnap = await db
      .collection("reviews")
      .where("business_id", "==", businessId)
      .where("status", "==", "PUBLISHED")
      .get();

    const count = reviewsSnap.size;
    let sum = 0;
    const breakdown: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

    reviewsSnap.forEach((doc: any) => {
      const r = Number(doc.data().rating) || 0;
      if (r >= 1 && r <= 5) {
        sum += r;
        breakdown[String(r)] = (breakdown[String(r)] || 0) + 1;
      }
    });

    const averageRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    await db.collection("businesses").doc(businessId).update({
      average_rating: averageRating,
      total_reviews: count,
      rating_breakdown: breakdown,
      updated_at: new Date().toISOString(),
    });

    return { averageRating, count, breakdown };
  } catch (err: any) {
    console.warn("[Aggregate Rating Update Warning]:", err.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "INVALID_JSON", message: "Request body required." }, { status: 400 });
    }

    const parseResult = ReviewSubmissionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parseResult.error.errors[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    const { token, rating, feedback } = parseResult.data;

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB_UNAVAILABLE", message: "Database connection unavailable." }, { status: 500 });
    }

    // 1. Look up appointment by security management token
    const apptSnap = await db
      .collection("appointments")
      .where("management_token", "==", token)
      .limit(1)
      .get();

    if (apptSnap.empty) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Appointment record not found or token has expired." },
        { status: 404 }
      );
    }

    const apptDoc = apptSnap.docs[0];
    const appt = apptDoc.data();
    if (!appt) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Appointment record is empty." },
        { status: 404 }
      );
    }
    const apptId = apptDoc.id;

    // 2. Strict Eligibility Check: ONLY COMPLETED appointments are eligible
    const status = (appt.status || "").toUpperCase();
    if (status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "NOT_COMPLETED",
          message: "Reviews can only be submitted after your appointment is completed. Current status: " + status,
        },
        { status: 403 }
      );
    }

    // 3. Single-Review Constraint: Check if appointment was already reviewed
    const reviewDocId = `rev_${apptId}`;
    const existingReview = await db.collection("reviews").doc(reviewDocId).get();

    if (existingReview.exists || appt.is_reviewed) {
      return NextResponse.json(
        {
          error: "ALREADY_REVIEWED",
          message: "A review has already been submitted for this appointment. Only one review per appointment is permitted.",
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    // 4. Construct Verified Review Document
    const reviewData = {
      id: reviewDocId,
      business_id: appt.business_id,
      appointment_id: apptId,
      customer_id: appt.customer_id || null,
      customer_name: appt.customer_name || "Verified Client",
      customer_email: appt.customer_email || null,
      customer_phone: appt.customer_phone || null,
      service_id: appt.service_id || null,
      service_name: appt.service_name || "Consultation",
      staff_id: appt.staff_id || null,
      staff_name: appt.staff_name || null,
      appointment_date: appt.appointment_date || null,
      rating,
      feedback: feedback.trim() || null,
      status: "PUBLISHED", // Published immediately unless flagged
      verified_booking: true,
      created_at: nowIso,
      updated_at: nowIso,
      owner_response: null,
      report_reason: null,
      reported_at: null,
      reported_by: null,
    };

    // 5. Atomic Batch Write: Create Review & Flag Appointment as Reviewed
    const batch = db.batch();
    batch.set(db.collection("reviews").doc(reviewDocId), reviewData);
    batch.update(apptDoc.ref, {
      is_reviewed: true,
      review_id: reviewDocId,
      reviewed_at: nowIso,
      updated_at: nowIso,
    });
    await batch.commit();

    // 6. Asynchronously update business aggregate rating counters
    updateBusinessRatingAggregate(db, appt.business_id);

    return NextResponse.json({
      success: true,
      message: "Thank you! Your verified review has been published.",
      reviewId: reviewDocId,
      rating,
      verifiedBooking: true,
    });
  } catch (err: any) {
    console.error("[Submit Review Error]:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err.message || "Failed to submit review." },
      { status: 500 }
    );
  }
}
