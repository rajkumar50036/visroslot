import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import {
  getBusinessDataSnapshot,
  buildOwnerAiSystemPrompt,
  getAlgorithmicAdvisorResponse,
} from "@/lib/ai/ownerAiEngine";
import { callVisroSlotAI, AIMessage, VISRO_AI_MODELS } from "@/lib/ai/openrouter";

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

export async function POST(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { businessId, userId } = authCheck;
    const body = await req.json().catch(() => ({}));
    const message = (body.message || "").trim();
    const history: AIMessage[] = body.history || [];

    if (!message) {
      return NextResponse.json({ error: "MESSAGE_REQUIRED" }, { status: 400 });
    }

    // 1. Gather real business data & memory
    const snapshot = await getBusinessDataSnapshot(businessId);
    const systemPrompt = buildOwnerAiSystemPrompt(snapshot);

    // 2. Prepare conversation messages for OpenRouter
    const aiMessages: AIMessage[] = [
      ...history.slice(-6), // Keep recent context
      { role: "user", content: message },
    ];

    let replyContent = "";
    let usedModel = "rule-based-engine";
    let isLiveLlm = false;

    // 3. Attempt OpenRouter LLM Call
    try {
      const openRouterResult = await callVisroSlotAI({
        messages: aiMessages,
        systemPrompt,
        model: VISRO_AI_MODELS.DEFAULT_FAST,
        temperature: 0.3,
        maxTokens: 800,
      });

      replyContent = openRouterResult.content;
      usedModel = openRouterResult.model;
      isLiveLlm = true;
    } catch (llmErr: any) {
      console.warn("[OpenRouter Gateway Falling Back]:", llmErr.message);
      // Fall back to deterministic intelligence
      replyContent = getAlgorithmicAdvisorResponse(message, snapshot);
    }

    // 4. Check if message implies creating a proposed action for Approval Center
    let proposedActionCreated = null;
    const lowerMsg = message.toLowerCase();
    if (
      lowerMsg.includes("re-engage") ||
      lowerMsg.includes("inactive customer") ||
      lowerMsg.includes("follow up") ||
      lowerMsg.includes("suggest a promotion")
    ) {
      try {
        const actionId = `act_${Date.now()}`;
        const newAction = {
          id: actionId,
          business_id: businessId,
          type: lowerMsg.includes("promotion") ? "PROMOTION_DRAFT" : "CUSTOMER_FOLLOWUP_DRAFT",
          title: lowerMsg.includes("promotion")
            ? `Special Promotion: Mid-Week Booking Boost (${snapshot.businessName})`
            : `Re-engage ${Math.min(5, snapshot.customers.inactiveOver30Days.length)} Inactive Clients`,
          reason: lowerMsg.includes("promotion")
            ? "Filling mid-week open booking capacity based on peak hour analysis"
            : `Customer cohort analysis identified ${snapshot.customers.inactiveOver30Days.length} clients inactive over 30 days`,
          supporting_data: {
            inactiveCount: snapshot.customers.inactiveOver30Days.length,
            peakHours: snapshot.appointments.peakHours,
          },
          expected_outcome: lowerMsg.includes("promotion")
            ? "Estimated 15-25% increase in Tuesday-Thursday slot utilization (Estimate)"
            : "Estimated 20-30% rebooking rate among contacted clients (Estimate)",
          action_payload: {
            draftMessage: lowerMsg.includes("promotion")
              ? `Hello from ${snapshot.businessName}! Enjoy 15% off any appointment scheduled this Wednesday or Thursday. Book online: https://${req.headers.get("x-forwarded-host") || req.headers.get("host") || "visroslot.pages.dev"}/book/${snapshot.businessId}`
              : `Hello! We missed you at ${snapshot.businessName}. Your preferred service is available this week. Book your next visit here: https://${req.headers.get("x-forwarded-host") || req.headers.get("host") || "visroslot.pages.dev"}/book/${snapshot.businessId}`,
            recipientsCount: Math.min(5, snapshot.customers.inactiveOver30Days.length),
          },
          status: "PENDING",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.collection("ai_actions").doc(actionId).set(newAction);
        proposedActionCreated = newAction;
      } catch (actErr: any) {
        console.warn("Proposed action auto-creation warning:", actErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      reply: replyContent,
      model: usedModel,
      isLiveLlm,
      businessName: snapshot.businessName,
      proposedAction: proposedActionCreated,
    });
  } catch (err: any) {
    console.error("[Owner AI Chat Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
