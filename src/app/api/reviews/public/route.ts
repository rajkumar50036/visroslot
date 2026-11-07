import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId")?.trim();
    const slugParam = searchParams.get("slug")?.trim();

    if (!businessIdParam && !slugParam) {
      return NextResponse.json(
        { error: "PARAMS_REQUIRED", message: "businessId or slug query parameter is required." },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "DB_UNAVAILABLE", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    let businessId = businessIdParam;

    // Resolve business ID from slug if slug was provided
    if (!businessId && slugParam) {
      const busSnap = await db
        .collection("businesses")
        .where("slug", "==", slugParam)
        .limit(1)
        .get();

      if (busSnap.empty) {
        return NextResponse.json(
          { error: "BUSINESS_NOT_FOUND", message: "Business not found for provided slug." },
          { status: 404 }
        );
      }

      businessId = busSnap.docs[0].id;
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "BUSINESS_NOT_FOUND", message: "Business record could not be identified." },
        { status: 404 }
      );
    }

    // Query strictly PUBLISHED reviews for this business
    const reviewsSnap = await db
      .collection("reviews")
      .where("business_id", "==", businessId)
      .where("status", "==", "PUBLISHED")
      .get();

    const rawList = reviewsSnap.docs.map((d) => d.data());

    // Sort by created_at descending
    rawList.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    // Calculate genuine aggregate statistics from real records (zero fake stats)
    const totalReviews = rawList.length;
    let ratingSum = 0;
    const ratingBreakdown: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

    // Format reviews for public view, stripping sensitive private client contact info
    const publicReviews = rawList.map((r) => {
      const rating = Number(r.rating) || 5;
      ratingSum += rating;
      ratingBreakdown[String(rating)] = (ratingBreakdown[String(rating)] || 0) + 1;

      return {
        id: r.id,
        customerName: r.customer_name || "Verified Client",
        rating,
        feedback: r.feedback || null,
        serviceName: r.service_name || "Consultation",
        staffName: r.staff_name || null,
        appointmentDate: r.appointment_date || null,
        createdAt: r.created_at,
        verifiedBooking: Boolean(r.verified_booking !== false),
        ownerResponse: r.owner_response
          ? {
              responseText: r.owner_response.response_text,
              respondedAt: r.owner_response.responded_at,
            }
          : null,
      };
    });

    const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      businessId,
      averageRating,
      totalReviews,
      ratingBreakdown,
      reviews: publicReviews,
    });
  } catch (err: any) {
    console.error("[Public Reviews Error]:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err.message || "Failed to load public reviews." },
      { status: 500 }
    );
  }
}
