import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

const UpdateActionSchema = z.object({
  action: z.enum(["approve", "reject", "edit"]),
  editedPayload: z.record(z.any()).optional(),
  rejectionReason: z.string().optional(),
});

async function verifyActionOwnership(req: NextRequest, actionId: string, db: any) {
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

  const actionDoc = await db.collection("ai_actions").doc(actionId).get();
  if (!actionDoc.exists) return { authorized: false, error: "ACTION_NOT_FOUND", status: 404 };

  const actionData = actionDoc.data();
  if (!actionData) return { authorized: false, error: "ACTION_NOT_FOUND", status: 404 };
  const businessId = actionData.business_id;

  const busDoc = await db.collection("businesses").doc(businessId).get();
  if (!busDoc.exists) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };

  const bData = busDoc.data();
  if (!bData) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };
  const isOwner =
    isPlatformOwner ||
    bData.owner_id === userId ||
    (bData.owner_email && bData.owner_email.toLowerCase() === userEmail);

  if (!isOwner) return { authorized: false, error: "FORBIDDEN", status: 403 };

  return { authorized: true, actionDoc, actionData, businessId, userId, userEmail };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => null);

    const parseResult = UpdateActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parseResult.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { action, editedPayload, rejectionReason } = parseResult.data;

    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyActionOwnership(req, id, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { actionDoc, actionData, businessId, userId } = authCheck;
    const nowIso = new Date().toISOString();

    // 1. Edit Proposed Action Details
    if (action === "edit") {
      if (!editedPayload) {
        return NextResponse.json({ error: "PAYLOAD_REQUIRED", message: "Edited payload is required." }, { status: 400 });
      }

      await actionDoc.ref.update({
        action_payload: { ...actionData.action_payload, ...editedPayload },
        updated_at: nowIso,
      });

      return NextResponse.json({ success: true, message: "Action details updated." });
    }

    // 2. Reject Proposed Action
    if (action === "reject") {
      await actionDoc.ref.update({
        status: "REJECTED",
        rejection_reason: rejectionReason || "Rejected by business owner",
        reviewed_by: userId,
        reviewed_at: nowIso,
        updated_at: nowIso,
      });

      // Log in audit trail
      await db.collection("ai_action_logs").add({
        action_id: id,
        business_id: businessId,
        action_type: actionData.type,
        status: "REJECTED",
        user_id: userId,
        details: rejectionReason || "Action rejected by owner",
        created_at: nowIso,
      });

      return NextResponse.json({ success: true, status: "REJECTED", message: "Action rejected." });
    }

    // 3. Approve & Execute Safe Supported Action
    if (action === "approve") {
      // Security Check: Only allow safe supported action types
      const PERMITTED_ACTIONS = [
        "CUSTOMER_FOLLOWUP_DRAFT",
        "REBOOKING_CAMPAIGN_DRAFT",
        "PROMOTION_DRAFT",
        "STAFF_SCHEDULE_SUGGESTION",
        "DAILY_SUMMARY_PREPARE",
      ];

      if (!PERMITTED_ACTIONS.includes(actionData.type)) {
        return NextResponse.json(
          { error: "UNSUPPORTED_OPERATION", message: "This action type cannot be executed by Owner AI." },
          { status: 403 }
        );
      }

      // Execute action: marks approved and executed
      const executionResult = `Approved by business owner. Proposed draft ready for manual dispatch via verified channels.`;

      await actionDoc.ref.update({
        status: "EXECUTED",
        reviewed_by: userId,
        reviewed_at: nowIso,
        executed_at: nowIso,
        execution_result: executionResult,
        updated_at: nowIso,
      });

      // Log in audit trail
      await db.collection("ai_action_logs").add({
        action_id: id,
        business_id: businessId,
        action_type: actionData.type,
        status: "EXECUTED",
        user_id: userId,
        details: executionResult,
        created_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        status: "EXECUTED",
        message: "Action approved and executed successfully.",
        executionResult,
      });
    }

    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err: any) {
    console.error("[Action Update Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
