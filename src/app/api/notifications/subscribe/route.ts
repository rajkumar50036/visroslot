import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { VAPID_PUBLIC_KEY } from "@/lib/push/webPushServer";

export const dynamic = "force-dynamic";

/**
 * Returns the VAPID Public Key for client-side pushManager.subscribe()
 */
export async function GET() {
  return NextResponse.json({
    vapidPublicKey: VAPID_PUBLIC_KEY,
  });
}

/**
 * Stores a browser's Web Push Subscription in Firestore collection 'push_subscriptions'
 * so background notifications can wake up the device even when the website is closed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.subscription || !body.businessId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "subscription and businessId are required" },
        { status: 400 }
      );
    }

    const { subscription, businessId, userId } = body;
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "INVALID_SUBSCRIPTION", message: "Push subscription must include endpoint and cryptographic keys" },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "DB_UNAVAILABLE", message: "Database temporarily unavailable" },
        { status: 503 }
      );
    }

    // Upsert subscription by endpoint hash / identifier
    const endpointHash = Buffer.from(endpoint).toString("base64url").slice(0, 40);
    const subDocId = `sub_${businessId}_${endpointHash}`;

    await db.collection("push_subscriptions").doc(subDocId).set(
      {
        id: subDocId,
        business_id: businessId,
        user_id: userId || null,
        subscription,
        endpoint,
        user_agent: req.headers.get("user-agent") || "unknown",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Push subscription registered. Background alerts enabled even when website is closed.",
    });
  } catch (err: any) {
    console.error("[Push Subscription Error]:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err.message || "Failed to register push subscription" },
      { status: 500 }
    );
  }
}
