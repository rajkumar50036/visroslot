import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

async function verifyOwnerBusiness(req: NextRequest, db: any) {
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

  // Find business owned by user
  let busSnap = await db
    .collection("businesses")
    .where("owner_id", "==", userId)
    .limit(1)
    .get();

  if (busSnap.empty && userEmail) {
    busSnap = await db
      .collection("businesses")
      .where("owner_email", "==", userEmail)
      .limit(1)
      .get();
  }

  if (busSnap.empty && isPlatformOwner) {
    // Platform owner gets first business if no personal one
    busSnap = await db.collection("businesses").limit(1).get();
  }

  if (busSnap.empty) {
    return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  }

  const bDoc = busSnap.docs[0];
  return { authorized: true, businessId: bDoc.id, business: bDoc.data(), userId, userEmail, isPlatformOwner };
}

export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });
    }

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { businessId } = authCheck;

    // Fetch all reviews for this business
    const reviewsSnap = await db
      .collection("reviews")
      .where("business_id", "==", businessId)
      .get();

    const rawList = reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by created_at descending
    rawList.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));

    // Filters from query
    const { searchParams } = new URL(req.url);
    const ratingFilter = searchParams.get("rating");
    const statusFilter = searchParams.get("status");
    const searchQuery = (searchParams.get("search") || "").toLowerCase().trim();

    // Compute genuine metrics across all reviews for this business
    const totalReviews = rawList.length;
    let publishedCount = 0;
    let reportedCount = 0;
    let hiddenCount = 0;
    let respondedCount = 0;
    let publishedRatingSum = 0;

    const ratingBreakdown: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

    rawList.forEach((r: any) => {
      const st = r.status || "PUBLISHED";
      if (st === "REPORTED") reportedCount++;
      else if (st === "HIDDEN") hiddenCount++;
      else publishedCount++;

      if (r.owner_response?.response_text) {
        respondedCount++;
      }

      const rating = Number(r.rating) || 5;
      if (st === "PUBLISHED") {
        publishedRatingSum += rating;
        ratingBreakdown[String(rating)] = (ratingBreakdown[String(rating)] || 0) + 1;
      }
    });

    const averageRating = publishedCount > 0 ? Math.round((publishedRatingSum / publishedCount) * 10) / 10 : 0;
    const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

    // Apply filtering for the returned list
    let filteredList = rawList;

    if (ratingFilter && ratingFilter !== "ALL") {
      const rNum = Number(ratingFilter);
      filteredList = filteredList.filter((r: any) => Number(r.rating) === rNum);
    }

    if (statusFilter && statusFilter !== "ALL") {
      filteredList = filteredList.filter((r: any) => (r.status || "PUBLISHED").toUpperCase() === statusFilter.toUpperCase());
    }

    if (searchQuery) {
      filteredList = filteredList.filter((r: any) => {
        const nameMatch = (r.customer_name || "").toLowerCase().includes(searchQuery);
        const feedbackMatch = (r.feedback || "").toLowerCase().includes(searchQuery);
        const serviceMatch = (r.service_name || "").toLowerCase().includes(searchQuery);
        const staffMatch = (r.staff_name || "").toLowerCase().includes(searchQuery);
        return nameMatch || feedbackMatch || serviceMatch || staffMatch;
      });
    }

    return NextResponse.json({
      success: true,
      businessId,
      metrics: {
        totalReviews,
        publishedCount,
        reportedCount,
        hiddenCount,
        respondedCount,
        responseRate,
        averageRating,
        ratingBreakdown,
      },
      reviews: filteredList,
    });
  } catch (err: any) {
    console.error("[Owner Reviews Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
