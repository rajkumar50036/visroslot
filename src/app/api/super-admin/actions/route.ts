import { NextResponse } from "next/server";
import { verifySuperAdminSession, logAdminAudit, SUPER_ADMIN_EMAIL } from "@/lib/auth/superAdmin";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const authResult = await verifySuperAdminSession(request);
  if (!authResult.isAuthorized || !authResult.uid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { db } = getFirebaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { action, targetId, data } = body;

    const adminUid = authResult.uid;
    const adminEmail = authResult.email || SUPER_ADMIN_EMAIL;

    switch (action) {
      case "TOGGLE_BUSINESS_STATUS": {
        const businessRef = db.collection("businesses").doc(targetId);
        const docSnap = await businessRef.get();
        if (!docSnap.exists) {
          return NextResponse.json({ error: "Business not found." }, { status: 404 });
        }
        const currentStatus = docSnap.data()?.subscription_status || "ACTIVE";
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

        await businessRef.update({
          subscription_status: newStatus,
          updated_at: new Date().toISOString(),
        });

        await logAdminAudit({
          admin_uid: adminUid,
          admin_email: adminEmail,
          action: "UPDATE_BUSINESS_STATUS",
          target_record: targetId,
          target_type: "business",
          outcome: "SUCCESS",
          metadata: { previous_status: currentStatus, new_status: newStatus },
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
        });

        return NextResponse.json({ success: true, newStatus });
      }

      case "EXTEND_SUBSCRIPTION": {
        const days = Number(data?.days) || 30;
        const subRef = db.collection("subscriptions").doc(targetId);
        const subSnap = await subRef.get();
        if (!subSnap.exists) {
          return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
        }
        const currentExp = subSnap.data()?.expires_at ? new Date(subSnap.data()?.expires_at) : new Date();
        const baseDate = currentExp > new Date() ? currentExp : new Date();
        const newExp = new Date(baseDate.getTime() + days * 86400000).toISOString();

        await subRef.update({
          expires_at: newExp,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        });

        // Also update corresponding business if linked
        const busId = subSnap.data()?.business_id;
        if (busId) {
          await db.collection("businesses").doc(busId).update({
            subscription_expires_at: newExp,
            subscription_status: "ACTIVE",
            updated_at: new Date().toISOString(),
          });
        }

        await logAdminAudit({
          admin_uid: adminUid,
          admin_email: adminEmail,
          action: "EXTEND_SUBSCRIPTION_DAYS",
          target_record: targetId,
          target_type: "subscription",
          outcome: "SUCCESS",
          metadata: { added_days: days, new_expiry: newExp },
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
        });

        return NextResponse.json({ success: true, newExpiry: newExp });
      }

      case "UNLOCK_PLAN":
      case "CHANGE_PLAN": {
        const busId = targetId || data?.businessId;
        const newPlan = data?.plan || "business";
        const isUnlimited = newPlan === "business" || data?.isUnlimited !== false;

        const businessRef = db.collection("businesses").doc(busId);
        const docSnap = await businessRef.get();
        if (!docSnap.exists) {
          return NextResponse.json({ error: "Business not found." }, { status: 404 });
        }

        await businessRef.update({
          plan: newPlan,
          is_unlimited: isUnlimited,
          booking_quota_reached: false,
          subscription_status: "ACTIVE",
          updated_at: new Date().toISOString(),
        });

        await logAdminAudit({
          admin_uid: adminUid,
          admin_email: adminEmail,
          action: "UNLOCK_OR_CHANGE_PLAN",
          target_record: busId,
          target_type: "business",
          outcome: "SUCCESS",
          metadata: { new_plan: newPlan, is_unlimited: isUnlimited },
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
        });

        return NextResponse.json({ success: true, plan: newPlan, isUnlimited });
      }

      default:
        return NextResponse.json({ error: "Unknown administrative action." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Admin action failed:", err);
    return NextResponse.json({ error: err.message || "Action failed." }, { status: 500 });
  }
}
