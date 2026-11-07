import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import {
  refundRazorpayPayment,
  sweepPendingTrialTokenRefunds,
  callRazorpayApi,
} from "@/lib/subscription/razorpayServer";

/**
 * VISROSLOT AutoPay Mandate ₹2 Verification Token Refund API
 * Handles automatic, immediate reversal of the temporary ₹2 verification
 * deduction back to the user's original bank account, UPI ID, or card.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { paymentId, orderId, subscriptionId, businessId, sweepAll = false } = body;

    const { db } = getFirebaseAdmin();

    // Option 1: Sweep all pending unrefunded ₹2 trial verification tokens
    if (sweepAll) {
      const sweepResults = await sweepPendingTrialTokenRefunds();
      return NextResponse.json({
        success: true,
        action: "SWEEP_TRIAL_REFUNDS",
        refundedCount: sweepResults.length,
        results: sweepResults,
        message: `Successfully processed ${sweepResults.length} pending ₹2 verification refunds.`,
      });
    }

    // Option 2: Refund a specific payment, order, or business verification
    let targetPaymentId = paymentId;

    if (!targetPaymentId && businessId && db) {
      const autoDoc = await db.collection("autopay_verifications").doc(`autopay_${businessId}`).get();
      if (autoDoc.exists) {
        const autoData = autoDoc.data();
        targetPaymentId = autoData?.verification_payment_ref || autoData?.authorization_ref;
      }
    }

    targetPaymentId = targetPaymentId || orderId || subscriptionId;

    if (!targetPaymentId) {
      return NextResponse.json(
        {
          error: "Missing required reference (paymentId, orderId, subscriptionId, or businessId) for refund.",
        },
        { status: 400 }
      );
    }

    // Security check: Never refund commercial plan payments (₹499/₹999) under this endpoint
    if (String(targetPaymentId).startsWith("pay_")) {
      try {
        const pDetails = await callRazorpayApi(`/payments/${targetPaymentId}`);
        if (pDetails && pDetails.amount > 200) {
          return NextResponse.json(
            {
              error: "SECURITY_VIOLATION: Commercial subscription payments cannot be refunded through the ₹2 AutoPay verification workflow.",
            },
            { status: 403 }
          );
        }
      } catch (checkErr: any) {
        console.warn("Payment amount check warning:", checkErr.message);
      }
    }

    const refundRes = await refundRazorpayPayment({
      paymentId: targetPaymentId,
      amountInPaise: 200,
      notes: {
        reason: "VISROSLOT 7-Day Free Trial AutoPay Mandate Verification ₹2 Token Refund to Original Bank Account",
        businessId: businessId || "",
      },
    });

    if (!refundRes) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to initiate Razorpay refund. Payment may not be captured yet or invalid payment reference.",
        },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();

    // Update autopay_verifications in database if businessId is available
    if (businessId && db) {
      await db.collection("autopay_verifications").doc(`autopay_${businessId}`).set(
        {
          refund_status: "REFUND_PROCESSED",
          refund_date: nowIso,
          automatic_refund_ref: refundRes.id,
          verification_deduction_amount: 2,
          refund_amount: 2,
          notes: "₹2 verification token refunded back to original source bank account.",
          updated_at: nowIso,
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "₹2 AutoPay verification token has been successfully refunded to the original bank account.",
      refundId: refundRes.id,
      refundStatus: refundRes.status || "processed",
      paymentId: targetPaymentId,
      amount: "₹2.00",
      speed: refundRes.speed_processed || refundRes.speed_requested || "normal",
    });
  } catch (err: any) {
    console.error("Token refund endpoint error:", err);
    return NextResponse.json(
      {
        error: "Failed to process AutoPay verification token refund",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const paymentId = searchParams.get("paymentId");

    const { db } = getFirebaseAdmin();

    if (businessId && db) {
      const autoDoc = await db.collection("autopay_verifications").doc(`autopay_${businessId}`).get();
      if (autoDoc.exists) {
        return NextResponse.json({
          success: true,
          autopayVerification: autoDoc.data(),
        });
      }
    }

    if (paymentId) {
      const pDetails = await callRazorpayApi(`/payments/${paymentId}`);
      return NextResponse.json({
        success: true,
        payment: {
          id: pDetails.id,
          status: pDetails.status,
          amount: pDetails.amount / 100,
          amountRefunded: (pDetails.amount_refunded || 0) / 100,
          refundStatus: pDetails.refund_status,
          method: pDetails.method,
          bank: pDetails.bank || null,
          vpa: pDetails.vpa || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      service: "VISROSLOT AutoPay Mandate ₹2 Verification Token Refund Service",
      status: "OPERATIONAL",
      policy: "Nominal ₹2 temporary verification deduction is automatically and immediately refunded back to the originating bank account or UPI source.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to query refund status", details: err.message },
      { status: 500 }
    );
  }
}
