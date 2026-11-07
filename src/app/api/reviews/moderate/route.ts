import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

async function verifySuperAdmin(req: NextRequest, db: any) {
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

  const isPlatformOwner =
    userEmail === OWNER_EMAIL ||
    userId === "vMZQTGlYSfM8adohQAZmSE3cNX02" ||
    (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN");

  if (!isPlatformOwner) {
    return { authorized: false, error: "FORBIDDEN", status: 403 };
  }

  return { authorized: true, userEmail, userId };
}

/**
 * Recomputes aggregate rating on business doc.
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
  } catch (err: any) {
    console.warn("Aggregate rating update warning:", err.message);
  }
}

// GET: List reported / pending moderation reviews
export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifySuperAdmin(req, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const reportedSnap = await db
      .collection("reviews")
      .where("status", "==", "REPORTED")
      .get();

    const reportedReviews = reportedSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      count: reportedReviews.length,
      reviews: reportedReviews,
    });
  } catch (err: any) {
    console.error("[Moderate GET Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// PATCH: Approve / Hide / Restore reviews
export async function PATCH(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifySuperAdmin(req, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.reviewId || !body.action) {
      return NextResponse.json(
        { error: "INVALID_BODY", message: "reviewId and action (publish | hide) required." },
        { status: 400 }
      );
    }

    const { reviewId, action, moderationNotes } = body;
    const reviewDoc = await db.collection("reviews").doc(reviewId).get();
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: "REVIEW_NOT_FOUND" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    if (!reviewData) {
      return NextResponse.json({ error: "REVIEW_DATA_EMPTY" }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    let newStatus: string;
    if (action === "publish") {
      newStatus = "PUBLISHED";
    } else if (action === "hide") {
      newStatus = "HIDDEN";
    } else {
      return NextResponse.json({ error: "INVALID_ACTION", message: "Action must be publish or hide." }, { status: 400 });
    }

    await reviewDoc.ref.update({
      status: newStatus,
      moderated_at: nowIso,
      moderated_by: authCheck.userEmail,
      moderation_notes: moderationNotes || null,
      updated_at: nowIso,
    });

    // Record audit trail in moderation_records
    await db.collection("moderation_records").add({
      review_id: reviewId,
      business_id: reviewData.business_id,
      previous_status: reviewData.status,
      new_status: newStatus,
      moderated_by: authCheck.userEmail,
      moderation_notes: moderationNotes || null,
      created_at: nowIso,
    });

    // Recalculate business average rating
    await updateBusinessRatingAggregate(db, reviewData.business_id);

    return NextResponse.json({
      success: true,
      message: `Review marked as ${newStatus}.`,
      reviewId,
      status: newStatus,
    });
  } catch (err: any) {
    console.error("[Moderate PATCH Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
