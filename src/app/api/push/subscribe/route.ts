import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { VAPID_PUBLIC_KEY } from "@/lib/push/webPushServer";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, businessId, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const endpoint = subscription.endpoint;
    const nowIso = new Date().toISOString();
    const userAgent = req.headers.get("user-agent") || "";

    // Check if this endpoint already exists to avoid duplicate subscriptions
    const existingSnap = await db
      .collection("push_subscriptions")
      .where("endpoint", "==", endpoint)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Update existing record
      const docRef = existingSnap.docs[0].ref;
      await docRef.update({
        business_id: businessId || existingSnap.docs[0].data().business_id || null,
        user_id: userId || existingSnap.docs[0].data().user_id || null,
        subscription,
        user_agent: userAgent,
        updated_at: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: "Push subscription refreshed successfully",
        id: docRef.id,
      });
    }

    // Create new push subscription document
    const newDoc = await db.collection("push_subscriptions").add({
      endpoint,
      subscription,
      business_id: businessId || null,
      user_id: userId || null,
      user_agent: userAgent,
      created_at: nowIso,
      updated_at: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: "Push subscription registered successfully",
      id: newDoc.id,
    });
  } catch (err: any) {
    console.error("Push subscription registration error:", err);
    return NextResponse.json(
      { error: "Failed to register push subscription", details: err.message },
      { status: 500 }
    );
  }
}
