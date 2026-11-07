import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { getBusinessDataSnapshot } from "@/lib/ai/ownerAiEngine";

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
    busSnap = await db.collection("businesses").limit(1).get();
  }

  if (busSnap.empty) {
    return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  }

  const bDoc = busSnap.docs[0];
  return { authorized: true, businessId: bDoc.id, business: bDoc.data(), userId, userEmail };
}

export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { businessId } = authCheck;
    const snapshot = await getBusinessDataSnapshot(businessId);

    // Formulate 4 practical business improvement suggestions grounded in real data
    const suggestions = [];

    if (snapshot.appointments.cancellationRate > 15) {
      suggestions.push({
        title: "Reduce Appointment Cancellations",
        description: `Current cancellation rate is ${snapshot.appointments.cancellationRate}%. Implement a 4-hour advance cancellation policy and configure automated reminders.`,
        priority: "HIGH",
        impact: "Could recover up to 10-15% of cancelled slot capacity",
      });
    }

    if (snapshot.customers.inactiveOver30Days.length > 0) {
      suggestions.push({
        title: "Re-engage Inactive Clients",
        description: `${snapshot.customers.inactiveOver30Days.length} customers haven't returned in 30+ days. Send a personalized rebooking invitation.`,
        priority: "MEDIUM",
        impact: "Estimated 20-30% repeat booking recovery rate",
      });
    }

    if (snapshot.appointments.peakHours.length > 0) {
      const topHour = snapshot.appointments.peakHours[0].hour;
      suggestions.push({
        title: "Optimize Peak Capacity",
        description: `Your peak booking demand occurs around ${topHour}. Ensure all staff are scheduled and consider slight off-peak slot incentives.`,
        priority: "MEDIUM",
        impact: "Smooths daily customer flow and reduces idle chair time",
      });
    }

    if (snapshot.reviews.totalReviews < 5) {
      suggestions.push({
        title: "Collect More Verified Reviews",
        description: `You have ${snapshot.reviews.totalReviews} public reviews. Ensuring every completed visit triggers a review link builds social proof.`,
        priority: "LOW",
        impact: "Higher conversion rate for first-time website visitors",
      });
    }

    return NextResponse.json({
      success: true,
      snapshot,
      suggestions,
    });
  } catch (err: any) {
    console.error("[Owner AI Insights Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
