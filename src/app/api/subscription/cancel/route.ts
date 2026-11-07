import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { cancelRazorpaySubscription } from "@/lib/subscription/razorpayServer";

/**
 * VISROSLOT — Server-Side Subscription Cancellation
 * Cancels auto-renewal at cycle end via Razorpay API and marks Firestore.
 * Preserves paid access until paid_through_date.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, cancelImmediately = false, reason = "Customer requested cancellation" } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId parameter." }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    // Identify user session
    const authCookie =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value;

    // Verify business ownership
    const busDoc = await db.collection("businesses").doc(businessId).get();
    if (!busDoc.exists) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const busData = busDoc.data();
    if (authCookie && busData?.owner_id && busData.owner_id !== authCookie) {
      return NextResponse.json({ error: "Unauthorized to cancel subscription." }, { status: 403 });
    }

    // Locate active subscription
    const subSnap = await db
      .collection("subscriptions")
      .where("business_id", "==", businessId)
      .limit(1)
      .get();

    if (subSnap.empty) {
      return NextResponse.json({ error: "No active subscription found for this business." }, { status: 404 });
    }

    const subDoc = subSnap.docs[0];
    const subData = subDoc.data();
    const razorpaySubId = subData.razorpay_subscription_id || subData.subscription_id;

    let razorpayCancelled = false;
    if (razorpaySubId && razorpaySubId.startsWith("sub_")) {
      try {
        await cancelRazorpaySubscription(razorpaySubId, !cancelImmediately);
        razorpayCancelled = true;
      } catch (rzpErr: any) {
        console.warn("[Cancel Subscription] Razorpay API notice:", rzpErr.message);
      }
    }

    const nowIso = new Date().toISOString();
    const paidThrough = subData.paid_through_date || subData.expires_at || "cycle end";

    await subDoc.ref.update({
      status: cancelImmediately ? "cancelled" : "active",
      subscriptionStatus: cancelImmediately ? "CANCELLED" : "ACTIVE",
      cancellation_status: "CANCELLED",
      cancel_at_cycle_end: !cancelImmediately,
      cancellation_reason: reason,
      cancelled_at: nowIso,
      updated_at: nowIso,
    });

    if (cancelImmediately) {
      await db.collection("businesses").doc(businessId).update({
        subscription_status: "cancelled",
        subscriptionStatus: "CANCELLED",
        publicBookingStatus: "PAUSED",
        publicBookingPauseReason: "SUBSCRIPTION_CANCELLED",
        updated_at: nowIso,
      });
    }

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? "Subscription cancelled immediately."
        : `Auto-renewal cancelled successfully. Your paid access remains active until ${paidThrough}.`,
      razorpayCancelled,
      paidThroughDate: paidThrough,
      instructions: {
        note: "You can also manage or verify this recurring mandate directly inside your UPI App (PhonePe / Google Pay / Paytm).",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process cancellation." }, { status: 500 });
  }
}
