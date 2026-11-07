import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import {
  getRazorpayServerConfig,
  fetchRazorpaySubscription,
} from "@/lib/subscription/razorpayServer";

/**
 * Real-time Mandate Synchronization API
 * Allows business owners to verify or synchronize their UPI AutoPay mandate status
 * directly against Razorpay's live servers (e.g. after revoking in Google Pay, PhonePe, or Paytm).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, userId } = body;

    if (!businessId && !userId) {
      return NextResponse.json(
        { error: "Missing businessId or userId parameter" },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // 0. Quick check user profile in Firestore
    const targetUid = userId || (businessId?.startsWith("pending_") ? businessId.replace(/^pending_/, "") : null);
    if (targetUid) {
      try {
        const userDoc = await db.collection("users").doc(targetUid).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          if (uData?.payment_verified || uData?.paymentVerified) {
            return NextResponse.json({
              success: true,
              mandateStatus: "AUTHORIZED",
              subscriptionStatus: uData?.subscription_status || uData?.subscriptionStatus || "trialing",
              verified: true,
            });
          }
        }
      } catch (uErr) {
        console.warn("User lookup in sync-mandate non-fatal:", uErr);
      }
    }

    // 1. Fetch Subscription from Firestore
    let subSnap = await db
      .collection("subscriptions")
      .where("business_id", "==", businessId || "")
      .limit(1)
      .get();

    if (subSnap.empty && businessId) {
      subSnap = await db
        .collection("subscriptions")
        .where("businessId", "==", businessId)
        .limit(1)
        .get();
    }

    if (subSnap.empty && targetUid) {
      subSnap = await db
        .collection("subscriptions")
        .where("user_id", "==", targetUid)
        .limit(1)
        .get();
    }

    if (subSnap.empty) {
      return NextResponse.json(
        { error: "No subscription record found for this business" },
        { status: 404 }
      );
    }

    const subDoc = subSnap.docs[0];
    const subData = subDoc.data();
    const razorpaySubId =
      subData.razorpaySubscriptionId || subData.razorpay_subscription_id;

    if (!razorpaySubId || !razorpaySubId.startsWith("sub_")) {
      return NextResponse.json({
        success: true,
        mandateStatus: subData.mandateStatus || "NONE",
        subscriptionStatus: subData.subscriptionStatus || subData.status || "active",
        message: "No live Razorpay subscription ID linked.",
      });
    }

    // 2. Fetch live status from Razorpay Subscription API
    const config = getRazorpayServerConfig();
    if (!config.keySecret || config.keySecret.includes("placeholder")) {
      return NextResponse.json({
        success: true,
        mandateStatus: subData.mandateStatus || "AUTHORIZED",
        subscriptionStatus: subData.subscriptionStatus || "active",
        source: "local",
      });
    }

    const liveSub = await fetchRazorpaySubscription(razorpaySubId);
    const liveStatus = String(liveSub?.status || "").toLowerCase();
    const nowIso = new Date().toISOString();

    let mandateStatus = "AUTHORIZED";
    let subscriptionStatus = subData.subscriptionStatus || "active";
    let autoDebitEnabled = true;

    let publicBookingStatus = "ACTIVE";
    let publicBookingPauseReason: string | null = null;

    // Razorpay statuses: created, authenticated, active, pending, halted, cancelled, completed, expired
    if (liveStatus === "cancelled") {
      mandateStatus = "REVOKED_VIA_UPI_APP";
      subscriptionStatus = "CANCELLED";
      autoDebitEnabled = false;
      publicBookingStatus = "PAUSED";
      publicBookingPauseReason = "MANDATE_REVOKED_VIA_UPI_APP";
    } else if (liveStatus === "halted") {
      mandateStatus = "HALTED";
      subscriptionStatus = "HALTED";
      autoDebitEnabled = false;
      publicBookingStatus = "PAUSED";
      publicBookingPauseReason = "RENEWAL_HALTED";
    } else if (liveStatus === "completed" || liveStatus === "expired") {
      mandateStatus = "EXPIRED";
      subscriptionStatus = "EXPIRED";
      autoDebitEnabled = false;
      publicBookingStatus = "PAUSED";
      publicBookingPauseReason = "SUBSCRIPTION_EXPIRED";
    } else if (liveStatus === "active" || liveStatus === "authenticated") {
      mandateStatus = "AUTHORIZED";
      subscriptionStatus = subData.is_trial ? "TRIALING" : "ACTIVE";
      autoDebitEnabled = true;
      publicBookingStatus = "ACTIVE";
      publicBookingPauseReason = null;
    }

    // 3. Persist updated status if changed
    await subDoc.ref.update({
      mandateStatus,
      status: subscriptionStatus.toLowerCase(),
      subscriptionStatus,
      auto_debit_enabled: autoDebitEnabled,
      live_razorpay_status: liveStatus,
      last_synced_at: nowIso,
      updated_at: nowIso,
      updatedAt: nowIso,
    });

    await db.collection("businesses").doc(businessId).update({
      mandateStatus,
      auto_debit_enabled: autoDebitEnabled,
      subscription_status: subscriptionStatus.toLowerCase(),
      publicBookingStatus,
      publicBookingPauseReason,
      updated_at: nowIso,
      updatedAt: nowIso,
    });

    await db
      .collection("autopay_verifications")
      .doc(`autopay_${businessId}`)
      .set(
        {
          mandate_status: mandateStatus,
          live_razorpay_status: liveStatus,
          auto_debit_enabled: autoDebitEnabled,
          last_synced_at: nowIso,
          updated_at: nowIso,
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      businessId,
      razorpaySubscriptionId: razorpaySubId,
      liveStatus,
      mandateStatus,
      subscriptionStatus,
      autoDebitEnabled,
      message:
        liveStatus === "cancelled"
          ? "UPI AutoPay mandate has been revoked from your UPI app. No future debits will occur."
          : `Mandate is ${liveStatus.toUpperCase()} on Razorpay.`,
    });
  } catch (err: any) {
    console.error("Mandate sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync mandate with Razorpay", details: err.message },
      { status: 500 }
    );
  }
}
