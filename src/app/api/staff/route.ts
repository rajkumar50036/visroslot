import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { checkBusinessStaffLimit } from "@/lib/subscription/quota";

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
  const isPlatformOwner = userEmail === OWNER_EMAIL || userId === "vMZQTGlYSfM8adohQAZmSE3cNX02";

  let busSnap = await db.collection("businesses").where("owner_id", "==", userId).limit(1).get();
  if (busSnap.empty && userEmail) {
    busSnap = await db.collection("businesses").where("owner_email", "==", userEmail).limit(1).get();
  }
  if (busSnap.empty && isPlatformOwner) {
    busSnap = await db.collection("businesses").limit(1).get();
  }
  if (busSnap.empty) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };

  const bDoc = busSnap.docs[0];
  return { authorized: true, businessId: bDoc.id, business: bDoc.data(), userId, userEmail, isPlatformOwner };
}

// GET: Retrieve staff roster for authorized business
export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const staffSnap = await db.collection("staff").where("business_id", "==", businessId).get();
    const staff = staffSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    staff.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    console.error("[Staff GET Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// POST: Add new staff member with strict backend capacity enforcement
export async function POST(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId, userId } = authCheck;
    const body = await req.json().catch(() => null);

    if (!body || !body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "NAME_REQUIRED", message: "Staff member name is required." }, { status: 400 });
    }

    // Strict Backend Staff Capacity Enforcement
    const staffLimit = await checkBusinessStaffLimit(db, businessId);
    if (!staffLimit.canAddStaff) {
      return NextResponse.json(
        {
          error: "STAFF_LIMIT_REACHED",
          message: staffLimit.message,
          currentStaffCount: staffLimit.currentStaffCount,
          maxStaff: staffLimit.maxStaff,
          plan: staffLimit.plan,
        },
        { status: 422 }
      );
    }

    const nowIso = new Date().toISOString();
    const newStaffData = {
      business_id: businessId,
      name: body.name.trim(),
      email: (body.email || "").trim().toLowerCase(),
      phone: (body.phone || "").trim(),
      role: (body.role || "Specialist").trim(),
      is_active: body.is_active !== false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const docRef = await db.collection("staff").add(newStaffData);

    // Audit log
    await db.collection("admin_audit_logs").add({
      admin_uid: userId,
      action: "STAFF_CREATED",
      target_record: docRef.id,
      target_type: "business",
      outcome: "SUCCESS",
      metadata: { staffName: newStaffData.name, businessId },
      created_at: nowIso,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Staff member successfully added.",
      staff: { id: docRef.id, ...newStaffData },
    });
  } catch (err: any) {
    console.error("[Staff POST Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
