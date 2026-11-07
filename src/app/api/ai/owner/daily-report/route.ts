import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { generateDailyBusinessReport } from "@/lib/ai/ownerAiEngine";

export const dynamic = "force-dynamic";

async function verifyOwnerBusiness(req: NextRequest, db: any) {
  const authCookie =
    req.cookies.get("visroslot_session")?.value ||
    req.cookies.get("slotora_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!authCookie) return { authorized: false, error: "UNAUTHORIZED", status: 401 };

  const userId = authCookie;
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const userEmail = (userData?.email || "").toLowerCase().trim();
  const isPlatformOwner = userEmail === OWNER_EMAIL;

  let busSnap = await db.collection("businesses").where("owner_id", "==", userId).limit(1).get();
  if (busSnap.empty && userEmail) {
    busSnap = await db.collection("businesses").where("owner_email", "==", userEmail).limit(1).get();
  }
  if (busSnap.empty && isPlatformOwner) {
    busSnap = await db.collection("businesses").limit(1).get();
  }
  if (busSnap.empty) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };

  const bDoc = busSnap.docs[0];
  return { authorized: true, businessId: bDoc.id, business: bDoc.data(), userId, userEmail };
}

// GET: Retrieve today's daily business intelligence report
export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const reportId = `daily_${businessId}_${dateStr}`;

    const reportDoc = await db.collection("daily_reports").doc(reportId).get();
    if (reportDoc.exists) {
      return NextResponse.json({ success: true, report: reportDoc.data(), cached: true });
    }

    // Generate fresh report for today
    const freshReport = await generateDailyBusinessReport(businessId);
    return NextResponse.json({ success: true, report: freshReport, cached: false });
  } catch (err: any) {
    console.error("[Daily Report GET Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// POST: Force generate fresh report
export async function POST(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const freshReport = await generateDailyBusinessReport(businessId);

    return NextResponse.json({
      success: true,
      message: "Daily business report regenerated with live Firestore data.",
      report: freshReport,
    });
  } catch (err: any) {
    console.error("[Daily Report POST Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
