import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { getBusinessDataSnapshot } from "@/lib/ai/ownerAiEngine";
import { AIProposedAction } from "@/types/database";

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

// GET: Retrieve all proposed AI actions for this business
export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query: any = db.collection("ai_actions").where("business_id", "==", businessId);
    if (statusFilter && statusFilter !== "ALL") {
      query = query.where("status", "==", statusFilter);
    }

    const actionsSnap = await query.get();
    const actions: AIProposedAction[] = actionsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Sort by created_at descending
    actions.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    return NextResponse.json({
      success: true,
      count: actions.length,
      pendingCount: actions.filter((a) => a.status === "PENDING").length,
      actions,
    });
  } catch (err: any) {
    console.error("[Get AI Actions Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// POST: Generate new recommended actions based on current business analysis
export async function POST(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const snapshot = await getBusinessDataSnapshot(businessId);
    const nowIso = new Date().toISOString();

    const createdActions: AIProposedAction[] = [];

    // Action 1: Inactive Customer Follow-up Draft
    if (snapshot.customers.inactiveOver30Days.length > 0) {
      const actId = `act_${Date.now()}_followup`;
      const targetClients = snapshot.customers.inactiveOver30Days.slice(0, 5);
      const action: AIProposedAction = {
        id: actId,
        business_id: businessId,
        type: "CUSTOMER_FOLLOWUP_DRAFT",
        title: `Re-engage ${targetClients.length} Inactive Clients`,
        reason: `${targetClients.length} clients have not booked a service in over 30 days. Personal outreach increases repeat booking rates by 25%.`,
        supporting_data: {
          clientNames: targetClients.map((c) => c.name),
          daysSinceList: targetClients.map((c) => c.daysSince),
        },
        expected_outcome: "Estimated 20-30% rebooking rate among contacted clients (Estimate)",
        action_payload: {
          recipients: targetClients.map((c) => ({ name: c.name, phone: c.phone, lastService: c.service })),
          draftMessage: `Hi there! We haven't seen you in a while at ${snapshot.businessName}. We have prime slots open this week for your next appointment. Book online anytime: https://${req.headers.get("x-forwarded-host") || req.headers.get("host") || "visroslot.pages.dev"}/book/${snapshot.businessId}`,
        },
        status: "PENDING",
        created_at: nowIso,
        updated_at: nowIso,
      };

      await db.collection("ai_actions").doc(actId).set(action);
      createdActions.push(action);
    }

    // Action 2: Peak Hour Capacity Optimization
    if (snapshot.appointments.peakHours.length > 0) {
      const topHour = snapshot.appointments.peakHours[0].hour;
      const actId = `act_${Date.now()}_capacity`;
      const action: AIProposedAction = {
        id: actId,
        business_id: businessId,
        type: "STAFF_SCHEDULE_SUGGESTION",
        title: `Optimize Specialist Coverage for ${topHour} Peak Demand`,
        reason: `Highest booking volume occurs at ${topHour} (${snapshot.appointments.peakHours[0].count} historical bookings).`,
        supporting_data: {
          peakHour: topHour,
          peakCount: snapshot.appointments.peakHours[0].count,
          totalSpecialists: snapshot.staff.total,
        },
        expected_outcome: "Reduces client wait time and accommodates up to 2 additional appointments daily (Estimate)",
        action_payload: {
          recommendedAction: `Ensure all ${snapshot.staff.total} specialists have active availability during the ${topHour} window.`,
        },
        status: "PENDING",
        created_at: nowIso,
        updated_at: nowIso,
      };

      await db.collection("ai_actions").doc(actId).set(action);
      createdActions.push(action);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdActions.length} recommended action(s) for your approval.`,
      actions: createdActions,
    });
  } catch (err: any) {
    console.error("[Generate Actions Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
