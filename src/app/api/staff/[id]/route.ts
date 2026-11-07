import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

async function verifyStaffOwnership(req: NextRequest, staffId: string, db: any) {
  const authCookie =
    req.cookies.get("visroslot_session")?.value ||
    req.cookies.get("slotora_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!authCookie) return { authorized: false, error: "UNAUTHORIZED", status: 401 };

  const userId = authCookie;
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const userEmail = (userData?.email || "").toLowerCase().trim();
  const isPlatformOwner = userEmail === OWNER_EMAIL || userId === "vMZQTGlYSfM8adohQAZmSE3cNX02";

  const staffDoc = await db.collection("staff").doc(staffId).get();
  if (!staffDoc.exists) return { authorized: false, error: "STAFF_NOT_FOUND", status: 404 };

  const staffData = staffDoc.data();
  const businessId = staffData?.business_id;

  const busDoc = await db.collection("businesses").doc(businessId).get();
  if (!busDoc.exists) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };

  const bData = busDoc.data();
  const isOwner =
    isPlatformOwner ||
    bData?.owner_id === userId ||
    (bData?.owner_email && bData.owner_email.toLowerCase() === userEmail);

  if (!isOwner) return { authorized: false, error: "FORBIDDEN", status: 403 };

  return { authorized: true, staffDoc, staffData, businessId, userId };
}

// PATCH: Update staff member
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const authCheck = await verifyStaffOwnership(req, id, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { staffDoc, userId } = authCheck;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });

    const nowIso = new Date().toISOString();
    const updatePayload: any = { updated_at: nowIso };

    if (body.name && typeof body.name === "string") updatePayload.name = body.name.trim();
    if (body.email !== undefined) updatePayload.email = (body.email || "").trim().toLowerCase();
    if (body.phone !== undefined) updatePayload.phone = (body.phone || "").trim();
    if (body.role !== undefined) updatePayload.role = (body.role || "Specialist").trim();
    if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);

    await staffDoc.ref.update(updatePayload);

    await db.collection("admin_audit_logs").add({
      admin_uid: userId,
      action: "STAFF_UPDATED",
      target_record: id,
      target_type: "business",
      outcome: "SUCCESS",
      metadata: updatePayload,
      created_at: nowIso,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Staff record updated successfully." });
  } catch (err: any) {
    console.error("[Staff PATCH Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// DELETE: Remove staff member
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const authCheck = await verifyStaffOwnership(req, id, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { staffDoc, userId, staffData } = authCheck;
    await staffDoc.ref.delete();

    await db.collection("admin_audit_logs").add({
      admin_uid: userId,
      action: "STAFF_DELETED",
      target_record: id,
      target_type: "business",
      outcome: "SUCCESS",
      metadata: { deletedStaffName: staffData?.name },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Staff record deleted successfully." });
  } catch (err: any) {
    console.error("[Staff DELETE Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
