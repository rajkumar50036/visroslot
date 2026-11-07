import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  action: z.enum(["respond", "delete_response", "report"]),
  responseText: z.string().max(1000, "Response cannot exceed 1000 characters").optional(),
  reportReason: z.string().max(500, "Report reason cannot exceed 500 characters").optional(),
});

async function verifyReviewOwnership(req: NextRequest, reviewId: string, db: any) {
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

  const reviewDoc = await db.collection("reviews").doc(reviewId).get();
  if (!reviewDoc.exists) {
    return { authorized: false, error: "REVIEW_NOT_FOUND", status: 404 };
  }

  const reviewData = reviewDoc.data();
  if (!reviewData) {
    return { authorized: false, error: "REVIEW_NOT_FOUND", status: 404 };
  }
  const businessId = reviewData.business_id;

  const busDoc = await db.collection("businesses").doc(businessId).get();
  if (!busDoc.exists) {
    return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  }

  const bData = busDoc.data();
  if (!bData) {
    return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  }
  const isOwner =
    isPlatformOwner ||
    bData.owner_id === userId ||
    (bData.owner_email && bData.owner_email.toLowerCase() === userEmail);

  if (!isOwner) {
    return { authorized: false, error: "FORBIDDEN", status: 403 };
  }

  return { authorized: true, reviewDoc, reviewData, businessId, bData };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => null);

    const parseResult = ActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parseResult.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { action, responseText, reportReason } = parseResult.data;

    // Strict Security Rule: Reject any attempt to modify customer rating or customer feedback
    if ("rating" in (body || {}) || "feedback" in (body || {}) || "customer_name" in (body || {})) {
      return NextResponse.json(
        {
          error: "FORBIDDEN_MODIFICATION",
          message: "Business owners cannot modify customer ratings, names, or feedback.",
        },
        { status: 403 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });
    }

    const authCheck = await verifyReviewOwnership(req, id, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { reviewDoc, reviewData } = authCheck;
    const nowIso = new Date().toISOString();

    if (action === "respond") {
      if (!responseText || !responseText.trim()) {
        return NextResponse.json(
          { error: "RESPONSE_EMPTY", message: "Response text is required." },
          { status: 400 }
        );
      }

      const existingResponse = reviewData.owner_response;
      const ownerResponse = {
        response_text: responseText.trim(),
        responded_at: existingResponse?.responded_at || nowIso,
        updated_at: nowIso,
      };

      await reviewDoc.ref.update({
        owner_response: ownerResponse,
        updated_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: "Response saved successfully.",
        ownerResponse,
      });
    }

    if (action === "delete_response") {
      await reviewDoc.ref.update({
        owner_response: null,
        updated_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: "Response removed successfully.",
      });
    }

    if (action === "report") {
      if (!reportReason || !reportReason.trim()) {
        return NextResponse.json(
          { error: "REASON_REQUIRED", message: "Please provide a reason for reporting this review." },
          { status: 400 }
        );
      }

      await reviewDoc.ref.update({
        status: "REPORTED",
        report_reason: reportReason.trim(),
        reported_at: nowIso,
        reported_by: "owner",
        updated_at: nowIso,
      });

      // Also record an entry in review_reports collection for platform audit
      await db.collection("review_reports").add({
        review_id: id,
        business_id: reviewData.business_id,
        appointment_id: reviewData.appointment_id,
        customer_name: reviewData.customer_name,
        rating: reviewData.rating,
        feedback: reviewData.feedback,
        report_reason: reportReason.trim(),
        reported_by: "owner",
        status: "PENDING_MODERATION",
        created_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: "Review reported to platform moderation.",
        status: "REPORTED",
      });
    }

    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err: any) {
    console.error("[Owner Review Action Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
