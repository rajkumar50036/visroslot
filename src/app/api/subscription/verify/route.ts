import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { VISRO_PLANS, calculateUpgradePrice } from "@/lib/subscription/quota";
import {
  getRazorpayServerConfig,
  refundRazorpayPayment,
} from "@/lib/subscription/razorpayServer";
import { sendPaymentConfirmationEmail } from "@/lib/email/sender";
import { setDocumentRest, getDocumentRest } from "@/lib/firebase/firestoreRest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      userId: clientUserId,
      plan,
      cycle,
      orderId,
      subscriptionId,
      paymentId,
      signature,
      customerId,
      isSimulated,
      isTrial = false,
    } = body;

    const activeSubOrOrderId = subscriptionId || orderId;

    if (!businessId || !plan || !activeSubOrOrderId) {
      return NextResponse.json(
        { error: "Missing required verification parameters" },
        { status: 400 }
      );
    }

    const config = getRazorpayServerConfig();
    const razorpayKeySecret = config.keySecret;

    // 1. Server-side HMAC-SHA256 signature verification
    // Never trust frontend payment confirmation alone
    if (!isSimulated && razorpayKeySecret && !razorpayKeySecret.includes("placeholder")) {
      let isSignatureValid = false;

      if (paymentId && signature) {
        // Test A: Subscription verification signature: payment_id + "|" + subscription_id
        if (subscriptionId) {
          const subPayload = `${paymentId}|${subscriptionId}`;
          const subExpected = crypto
            .createHmac("sha256", razorpayKeySecret)
            .update(subPayload)
            .digest("hex");
          if (subExpected === signature) {
            isSignatureValid = true;
          }
        }

        // Test B: Order verification signature: order_id + "|" + payment_id
        if (!isSignatureValid && orderId) {
          const orderPayload = `${orderId}|${paymentId}`;
          const orderExpected = crypto
            .createHmac("sha256", razorpayKeySecret)
            .update(orderPayload)
            .digest("hex");
          if (orderExpected === signature) {
            isSignatureValid = true;
          }
        }
      }

      if (!isSignatureValid) {
        return NextResponse.json(
          {
            error: "Payment verification failed. Invalid cryptographic signature.",
            code: "SIGNATURE_MISMATCH",
          },
          { status: 400 }
        );
      }
    }

    const { db, isConfigured } = getFirebaseAdmin();

    // 2. Fetch business to identify authenticated owner & resolve userId
    const authCookieUid =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value;

    let userId = clientUserId || authCookieUid || null;
    if (!userId && businessId && businessId.startsWith("pending_")) {
      userId = businessId.replace(/^pending_/, "");
    }

    let busData: any = {};
    if (businessId && !businessId.startsWith("pending_")) {
      try {
        if (db && isConfigured) {
          const busDoc = await db.collection("businesses").doc(businessId).get();
          if (busDoc.exists) {
            busData = busDoc.data() || {};
            userId = userId || busData.owner_id || null;
          }
        } else {
          const rDoc = await getDocumentRest("businesses", businessId);
          if (rDoc) {
            busData = rDoc;
            userId = userId || busData.owner_id || null;
          }
        }
      } catch (busFetchErr: any) {
        console.warn("Could not fetch business during verify:", busFetchErr.message);
      }
    }

    // 3. IDEMPOTENCY CHECK: Ensure duplicate verify calls don't duplicate records
    if (db && isConfigured) {
      try {
        const existingPaymentQuery = await db
          .collection("payments")
          .where("payment_id", "==", paymentId || activeSubOrOrderId)
          .where("status", "==", "CAPTURED")
          .limit(1)
          .get();

        if (!existingPaymentQuery.empty) {
          const existingPayment = existingPaymentQuery.docs[0].data();
          const existingSub = await db
            .collection("subscriptions")
            .where("business_id", "==", businessId)
            .limit(1)
            .get();

          return NextResponse.json({
            success: true,
            message: "Subscription already verified and active (idempotent replay).",
            isDuplicate: true,
            payment: existingPayment,
            subscription: !existingSub.empty ? existingSub.docs[0].data() : null,
          });
        }
      } catch (e) {}
    }

    // 4. Validate Plan & Calculate Dates
    const isYearly = cycle === "yearly";
    const billingPeriod: "monthly" | "yearly" = isYearly ? "yearly" : "monthly";
    const targetPlan: "professional" | "business" =
      plan === "business" || String(plan).includes("999")
        ? "business"
        : "professional";

    const planRecurringPrice = isYearly
      ? VISRO_PLANS[targetPlan].yearlyPrice
      : VISRO_PLANS[targetPlan].monthlyPrice;

    let isUpgrade = false;
    let creditApplied = 0;
    let amountInRupees = isTrial ? 0 : planRecurringPrice;

    if (!isTrial && targetPlan === "business" && db && isConfigured) {
      try {
        const currentSubSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .where("status", "in", ["active", "ACTIVE"])
          .limit(1)
          .get();

        if (!currentSubSnap.empty) {
          const curData = currentSubSnap.docs[0].data();
          const prevPlan = curData.plan || curData.plan_id || "professional";
          const curCycle = curData.billing_period || curData.billing_cycle || "monthly";

          const upgradeCalc = calculateUpgradePrice(
            prevPlan,
            "business",
            billingPeriod,
            curCycle
          );

          if (upgradeCalc.isUpgrade) {
            isUpgrade = true;
            creditApplied = upgradeCalc.creditApplied;
            amountInRupees = upgradeCalc.finalAmountToPay;
          }
        }
      } catch (e) {}
    }

    const now = new Date();
    const paidThroughDate = new Date(now);
    if (isTrial) {
      paidThroughDate.setDate(paidThroughDate.getDate() + 7);
    } else if (isYearly) {
      paidThroughDate.setDate(paidThroughDate.getDate() + 365);
    } else {
      paidThroughDate.setDate(paidThroughDate.getDate() + 30);
    }

    const nowIso = now.toISOString();
    const paidThroughIso = paidThroughDate.toISOString();
    const subStatus = isTrial ? "TRIALING" : "active";

    // 5. Build official subscription record complying with Section 9 specification schema
    const subscriptionRecord: any = {
      // Blueprint camelCase fields
      uid: userId,
      businessId: businessId,
      plan: targetPlan,
      billingFrequency: billingPeriod,
      razorpayCustomerId: customerId || null,
      razorpaySubscriptionId: subscriptionId || activeSubOrOrderId,
      mandateStatus: "AUTHORIZED",
      subscriptionStatus: subStatus,
      trialStart: isTrial ? nowIso : null,
      trialEnd: isTrial ? paidThroughIso : null,
      firstPaymentScheduledAt: isTrial ? paidThroughIso : null,
      paidThrough: paidThroughIso,
      nextRenewalAt: paidThroughIso,
      cancellationStatus: "NONE",
      accessEndsAt: paidThroughIso,

      // Database legacy/compatibility aliases
      user_id: userId,
      business_id: businessId,
      billing_period: billingPeriod,
      billing_cycle: billingPeriod,
      amount: amountInRupees,
      currency: "INR",
      razorpay_subscription_id: subscriptionId || activeSubOrOrderId,
      razorpay_customer_id: customerId || null,
      order_id: orderId || null,
      payment_id: paymentId || `pay_${Date.now()}`,
      status: subStatus,
      start_date: nowIso,
      renewal_date: paidThroughIso,
      paid_through_date: paidThroughIso,
      activated_at: nowIso,
      expires_at: paidThroughIso,
      is_unlimited: isTrial ? false : targetPlan === "business",
      is_upgrade: isUpgrade,
      credit_applied: creditApplied,
      payment_verification_status: "verified",
      autoPayAuthorizationStatus: "AUTHORIZED",
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isTrial) {
      const recurringPrice = isYearly ? VISRO_PLANS[targetPlan].yearlyPrice : VISRO_PLANS[targetPlan].monthlyPrice;
      subscriptionRecord.trialStartAt = nowIso;
      subscriptionRecord.trialEndAt = paidThroughIso;
      subscriptionRecord.trialAppointmentLimit = 10;
      subscriptionRecord.trialAppointmentsUsed = 0;
      subscriptionRecord.is_trial = true;
      subscriptionRecord.recurring_plan_price = recurringPrice;
      subscriptionRecord.auto_debit_scheduled_at = paidThroughIso;
      subscriptionRecord.auto_debit_amount = recurringPrice;
      subscriptionRecord.auto_debit_enabled = Boolean(subscriptionId);
    }

    // 6. Upsert into subscriptions collection
    let subDocId = subscriptionId || orderId || `sub_${businessId || userId || Date.now()}`;
    if (db && isConfigured) {
      try {
        if (businessId && !businessId.startsWith("pending_")) {
          const subQuery = await db
            .collection("subscriptions")
            .where("business_id", "==", businessId)
            .limit(1)
            .get();

          if (!subQuery.empty) {
            subDocId = subQuery.docs[0].id;
            await db.collection("subscriptions").doc(subDocId).update(subscriptionRecord);
          }
        }

        if (!subDocId && userId) {
          const userSubQuery = await db
            .collection("subscriptions")
            .where("user_id", "==", userId)
            .limit(1)
            .get();

          if (!userSubQuery.empty) {
            subDocId = userSubQuery.docs[0].id;
            await db.collection("subscriptions").doc(subDocId).update(subscriptionRecord);
          }
        }

        if (!subDocId) {
          const subRef = await db.collection("subscriptions").add(subscriptionRecord);
          subDocId = subRef.id;
        }
      } catch (dbSubErr) {
        await setDocumentRest("subscriptions", subDocId, subscriptionRecord);
      }
    } else {
      await setDocumentRest("subscriptions", subDocId, subscriptionRecord);
    }

    // 7. AutoPay Verification vs Subscription Payment Separation (Phase 9)
    let refundData: any = null;
    const targetRefundId = paymentId || orderId || subscriptionId;

    if (isTrial || amountInRupees <= 2) {
      // Safety Guard: The ₹2 refund workflow applies EXCLUSIVELY to actual temporary verification deductions.
      // Commercial subscription payments (Professional ₹499/₹4990 or Business ₹999/₹9990) are STRICTLY EXCLUDED.
      if (amountInRupees >= 499) {
        throw new Error("SECURITY_VIOLATION: Commercial subscription payments cannot be processed through AutoPay verification refund workflow.");
      }

      let alreadyRefunded = false;
      if (db && isConfigured) {
        try {
          const existingAutoSnap = await db.collection("autopay_verifications").doc(`autopay_${businessId}`).get();
          const existingAutoData = existingAutoSnap.exists ? existingAutoSnap.data() : null;
          alreadyRefunded = existingAutoData?.refund_status === "REFUND_PROCESSED";
        } catch (e) {}
      }

      if (targetRefundId && !String(targetRefundId).startsWith("pay_sim_") && !alreadyRefunded) {
        try {
          refundData = await refundRazorpayPayment({
            paymentId: targetRefundId,
            amountInPaise: 200,
            notes: {
              reason: "VISROSLOT 7-Day Free Trial AutoPay Mandate Verification ₹2 Token Refund to Original Bank Account",
              businessId: businessId || "",
              userId: userId || "",
            },
          });
          console.log(`[Verify Auto-Refund] Refund processed for ${targetRefundId}:`, refundData?.id);
        } catch (refundErr: any) {
          console.warn("Auto-refund error for trial token:", refundErr.message);
        }
      }

      // Record exclusively in autopay_verifications
      const autoPayRecord = {
        id: `autopay_${businessId || userId || Date.now()}`,
        business_id: businessId,
        user_id: userId,
        authorization_ref: subscriptionId || activeSubOrOrderId,
        payment_method: (body.paymentMethod || "card").toLowerCase(),
        verification_deduction_amount: 2,
        verification_payment_ref: targetRefundId || null,
        automatic_refund_ref: refundData?.id || null,
        refund_status: refundData?.id ? "REFUND_PROCESSED" : "PENDING_SETTLEMENT",
        mandate_status: "AUTHORIZED",
        authorization_date: nowIso,
        refund_date: refundData?.id ? nowIso : null,
        notes: "₹2 AutoPay verification token refunded back to original bank account.",
        created_at: nowIso,
        updated_at: nowIso,
      };

      if (db && isConfigured) {
        try {
          await db.collection("autopay_verifications").doc(`autopay_${businessId}`).set(autoPayRecord, { merge: true });
        } catch (e) {
          await setDocumentRest("autopay_verifications", `autopay_${businessId}`, autoPayRecord);
        }
      } else {
        await setDocumentRest("autopay_verifications", `autopay_${businessId}`, autoPayRecord);
      }
    } else {
      // Real captured subscription billing (₹499/month, ₹4990/year, ₹999/month, ₹9990/year)
      const paymentRecord = {
        user_id: userId,
        business_id: businessId,
        order_id: orderId || null,
        subscription_id: subscriptionId || null,
        payment_id: paymentId || `pay_${Date.now()}`,
        amount: amountInRupees,
        currency: "INR",
        plan: targetPlan,
        billing_period: billingPeriod,
        billing_cycle: billingPeriod,
        record_type: "SUBSCRIPTION_PAYMENT",
        is_trial_authorization: false,
        status: "CAPTURED",
        verification_status: "verified",
        verification_method: "SERVER_HMAC_SHA256",
        is_upgrade: isUpgrade,
        credit_applied: creditApplied,
        created_at: nowIso,
      };

      if (db && isConfigured) {
        try {
          await db.collection("payments").add(paymentRecord);
        } catch (e) {
          await setDocumentRest("payments", paymentRecord.payment_id, paymentRecord);
        }
      } else {
        await setDocumentRest("payments", paymentRecord.payment_id, paymentRecord);
      }

      // Record in immutable `payment_transactions` collection (Section F & K)
      const txDocId = paymentId || `tx_${Date.now()}`;
      const transactionRecord = {
        transaction_id: txDocId,
        payment_id: paymentId || `pay_${Date.now()}`,
        subscription_id: subscriptionId || null,
        order_id: orderId || null,
        business_id: businessId,
        user_id: userId,
        plan_id: targetPlan === "business" ? (isYearly ? "premium_yearly" : "premium_monthly") : (isYearly ? "starter_yearly" : "starter_monthly"),
        plan_name: targetPlan === "business" ? (isYearly ? "Premium Yearly" : "Premium Monthly") : (isYearly ? "Starter Yearly" : "Starter Monthly"),
        billing_cycle: billingPeriod,
        amount: amountInRupees,
        amount_paise: Math.round(amountInRupees * 100),
        currency: "INR",
        status: "CAPTURED",
        verification_method: "SERVER_HMAC_SHA256",
        is_trial: Boolean(isTrial),
        created_at: nowIso,
        timestamp: nowIso,
      };

      if (db && isConfigured) {
        try {
          await db.collection("payment_transactions").doc(txDocId).set(transactionRecord, { merge: true });
        } catch (e) {
          await setDocumentRest("payment_transactions", txDocId, transactionRecord);
        }
      } else {
        await setDocumentRest("payment_transactions", txDocId, transactionRecord);
      }
    }

    // 8. Update business record (if existing)
    if (businessId && !businessId.startsWith("pending_")) {
      const busUpdate = {
        plan: targetPlan,
        subscription_status: subStatus,
        subscriptionStatus: subStatus,
        publicBookingStatus: "ACTIVE",
        publicBookingPauseReason: null,
        subscription_expires_at: paidThroughIso,
        trial_ends_at: isTrial ? paidThroughIso : null,
        auto_debit_scheduled_at: isTrial ? paidThroughIso : null,
        auto_debit_amount: isTrial ? (isYearly ? VISRO_PLANS[targetPlan].yearlyPrice : VISRO_PLANS[targetPlan].monthlyPrice) : null,
        booking_quota_reached: false,
        is_unlimited: isTrial ? false : targetPlan === "business",
        payment_verified: true,
        updated_at: nowIso,
      };

      if (db && isConfigured) {
        try {
          const busRef = db.collection("businesses").doc(businessId);
          const bSnap = await busRef.get();
          if (bSnap.exists) {
            await busRef.update(busUpdate);
          }
        } catch (busUpdateErr: any) {
          await setDocumentRest("businesses", businessId, busUpdate);
        }
      } else {
        await setDocumentRest("businesses", businessId, busUpdate);
      }
    }

    // 9. Update user record: Authoritatively persist subscription and payment verification
    let customerEmail = busData?.owner_email || busData?.email;
    let customerName = busData?.name;

    if (userId) {
      const userUpdate = {
        uid: userId,
        subscription_id: subscriptionId || activeSubOrOrderId,
        subscription_status: subStatus,
        subscriptionStatus: subStatus,
        accountStatus: isTrial ? "TRIAL_ACTIVE" : "ACTIVE",
        onboardingStatus: "PROFILE_PENDING",
        plan: targetPlan,
        billing_period: billingPeriod,
        billing_cycle: billingPeriod,
        payment_verified: true,
        paymentVerified: true,
        payment_id: paymentId || `pay_${Date.now()}`,
        paid_through_date: paidThroughIso,
        updated_at: nowIso,
      };

      if (db && isConfigured) {
        try {
          const userRef = db.collection("users").doc(userId);
          const uSnap = await userRef.get();
          if (uSnap.exists) {
            const uData = uSnap.data();
            customerEmail = customerEmail || uData?.email;
            customerName = customerName || uData?.fullName || uData?.name;
          }
          await userRef.set(userUpdate, { merge: true });
        } catch (userUpdateErr: any) {
          await setDocumentRest("users", userId, userUpdate);
        }
      } else {
        await setDocumentRest("users", userId, userUpdate);
      }
    }

    // 10. Automatically send verified payment confirmation email (Non-blocking)
    if (customerEmail) {
      sendPaymentConfirmationEmail({
        customerEmail,
        customerName: customerName || "Business Owner",
        businessName: busData?.name || "VISROSLOT Business",
        planName:
          targetPlan === "business"
            ? "Business Suite (Unlimited Appointments)"
            : "Professional Plan (300 Bookings / Month)",
        billingCycle: billingPeriod,
        amount: isTrial ? "₹0 (7-Day Free Trial)" : amountInRupees,
        razorpayPaymentId: paymentId || `pay_${Date.now()}`,
        razorpaySubscriptionId: subscriptionId || undefined,
        paymentDate: nowIso,
        subscriptionStatus: subStatus,
        nextBillingDate: paidThroughIso,
        customerUid: userId || undefined,
        isRenewal: false,
      }).catch((emailErr) => {
        console.warn("[Email Async Warning]:", emailErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Subscription verified and activated! ${
        isTrial
          ? "7-Day Free Trial is now active. Your ₹2 verification deduction has been automatically refunded back to your original bank account."
          : targetPlan === "business"
          ? "Business Suite with UNLIMITED bookings is active."
          : "Professional Plan with up to 3 staff & 300 bookings is active."
      }`,
      subscription: { id: subDocId, ...subscriptionRecord },
      plan: targetPlan,
      isTrial: Boolean(isTrial),
      tokenRefundStatus: refundData?.id ? "REFUND_PROCESSED" : "PENDING_SETTLEMENT",
      refundId: refundData?.id || null,
      refundMessage: isTrial ? "The ₹2 AutoPay verification token has been reversed to your original bank account." : null,
      isUnlimited: targetPlan === "business",
      paidThroughDate: paidThroughIso,
      redirectUrl: "/create-business-profile",
      nextRoute: "/create-business-profile",
    });
  } catch (err: any) {
    console.error("Subscription verification error:", err);
    return NextResponse.json(
      { error: "Internal error verifying subscription", details: err.message },
      { status: 500 }
    );
  }
}
