import { NextRequest, NextResponse } from "next/server";
import { VISRO_PLANS, calculateUpgradePrice } from "@/lib/subscription/quota";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import {
  getRazorpayServerConfig,
  getRazorpayPlanId,
  createRazorpaySubscription,
  callRazorpayApi,
} from "@/lib/subscription/razorpayServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      userId: bodyUserId,
      plan = "professional",
      cycle = "monthly",
      trial = false,
      directPayment = false,
    } = body;

    const isTrial = Boolean(trial);
    const trialStartAtEpoch = Math.floor(Date.now() / 1000);
    const trialEndAtEpoch = trialStartAtEpoch + 7 * 86400;
    const trialStartIso = new Date(trialStartAtEpoch * 1000).toISOString();
    const trialEndIso = new Date(trialEndAtEpoch * 1000).toISOString();

    // 1. Identify and authenticate user session
    const authCookie =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value ||
      bodyUserId;

    const { db } = getFirebaseAdmin();
    let authenticatedUserId = authCookie || null;

    let effectiveBusinessId = businessId;
    if (db && effectiveBusinessId && !effectiveBusinessId.startsWith("pending_")) {
      try {
        const busDoc = await db.collection("businesses").doc(effectiveBusinessId).get();
        if (busDoc.exists) {
          const busData = busDoc.data();
          authenticatedUserId = authenticatedUserId || busData?.owner_id || null;
        }
      } catch (busErr) {
        console.warn("Firestore business lookup non-fatal in create-order:", busErr);
      }
    }

    if (!authenticatedUserId && effectiveBusinessId && effectiveBusinessId.startsWith("pending_")) {
      authenticatedUserId = effectiveBusinessId.replace(/^pending_/, "");
    }

    if (!effectiveBusinessId && authenticatedUserId) {
      effectiveBusinessId = `pending_${authenticatedUserId}`;
    }

    if (!effectiveBusinessId) {
      return NextResponse.json(
        { error: "Authentication or business identification required before checkout" },
        { status: 400 }
      );
    }

    // 2. Validate selected plan and billing cycle
    const targetPlan: "professional" | "business" =
      plan === "business" || String(plan).includes("999")
        ? "business"
        : "professional";
    const isYearly = cycle === "yearly";
    const billingCycle: "monthly" | "yearly" = isYearly ? "yearly" : "monthly";

    // 3. DUPLICATE PAYMENT CHECK (CRITICAL SPECIFICATION):
    // If the customer already has a verified and active subscription, skip checkout!
    if (db && authenticatedUserId) {
      try {
        const userDoc = await db.collection("users").doc(authenticatedUserId).get();
        const userData = userDoc.data();

        // Platform Owner Lifetime Access
        if (
          userData?.is_owner === true &&
          userData?.lifetime_free === true
        ) {
          return NextResponse.json({
            success: true,
            alreadySubscribed: true,
            isFounder: true,
            plan: "business",
            message: "Platform owner has lifetime unlimited access without billing.",
          });
        }

        // Check existing subscription by user_id
        const userSubSnap = await db
          .collection("subscriptions")
          .where("user_id", "==", authenticatedUserId)
          .where("status", "in", ["active", "ACTIVE", "TRIALING", "trialing"])
          .limit(1)
          .get();

        let activeSubData = !userSubSnap.empty ? userSubSnap.docs[0].data() : null;

        // Check existing subscription by business_id
        if (!activeSubData && effectiveBusinessId && !effectiveBusinessId.startsWith("pending_")) {
          const busSubSnap = await db
            .collection("subscriptions")
            .where("business_id", "==", effectiveBusinessId)
            .where("status", "in", ["active", "ACTIVE", "TRIALING", "trialing"])
            .limit(1)
            .get();
          if (!busSubSnap.empty) {
            activeSubData = busSubSnap.docs[0].data();
          }
        }

        if (activeSubData && !isTrial) {
          const now = new Date();
          const expiresAt = activeSubData.expires_at || activeSubData.paid_through_date;
          const isNotExpired = !expiresAt || new Date(expiresAt) > now;

          if (isNotExpired) {
            console.log(
              `[Duplicate Payment Prevented] User ${authenticatedUserId} already has active subscription ${
                activeSubData.razorpay_subscription_id || activeSubData.payment_id
              }. Skipping checkout.`
            );
            return NextResponse.json({
              success: true,
              alreadySubscribed: true,
              subscription: activeSubData,
              plan: activeSubData.plan || targetPlan,
              status: activeSubData.status,
              message: "You already have an active subscription! Skipping checkout.",
            });
          }
        }
      } catch (dupCheckErr) {
        console.warn("Firestore subscription pre-check non-fatal in create-order:", dupCheckErr);
      }
    }

    // 3. Amount calculation: Charge plan price for commercial plans, or ₹0 for AutoPay 7-day trial mandate
    // CRITICAL USER DIRECTIVE: "for old user no trial plan is direct plan only"
    let isOldUser = false;
    let effectiveTrial = directPayment ? false : isTrial;

    if (db && authenticatedUserId) {
      try {
        const userDoc = await db.collection("users").doc(authenticatedUserId).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          const hasPriorTrial =
            Boolean(uData?.trial_used) ||
            Boolean(uData?.trial_started_at) ||
            Boolean(uData?.trial_expires_at) ||
            (uData?.is_trial === false && (uData?.payment_verified === true || uData?.paymentVerified === true));

          if (hasPriorTrial) {
            isOldUser = true;
            effectiveTrial = false; // Old users get direct plan payment without free trial
          }
        }
      } catch (chkErr) {
        console.warn("Trial check warning in create-order:", chkErr);
      }
    }

    const planRecurringPrice = isYearly
      ? VISRO_PLANS[targetPlan].yearlyPrice
      : VISRO_PLANS[targetPlan].monthlyPrice;

    // For trial: ₹0 plan charge today (only ₹2 refundable verification token taken via addons)
    // For old users / non-trial: direct full plan price (₹499/₹999/₹4990/₹9990)
    let amountInRupees = effectiveTrial ? 0 : planRecurringPrice;
    let isUpgrade = false;
    let creditApplied = 0;

    // Upgrade calculation if moving to Business Suite (and not on trial)
    if (!effectiveTrial && db && targetPlan === "business") {
      try {
        const currentSubSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", effectiveBusinessId)
          .where("status", "in", ["active", "ACTIVE"])
          .limit(1)
          .get();

        if (!currentSubSnap.empty) {
          const curData = currentSubSnap.docs[0].data();
          const prevPlan = curData.plan || curData.plan_id || "professional";
          const curCycle =
            curData.billing_period || curData.billing_cycle === "yearly"
              ? "yearly"
              : "monthly";

          const upgradeCalc = calculateUpgradePrice(
            prevPlan,
            "business",
            billingCycle,
            curCycle
          );

          if (upgradeCalc.isUpgrade) {
            isUpgrade = true;
            creditApplied = upgradeCalc.creditApplied;
            amountInRupees = upgradeCalc.finalAmountToPay;
          }
        }
      } catch (upgCheckErr) {
        console.warn("Firestore upgrade check non-fatal in create-order:", upgCheckErr);
      }
    }

    const config = getRazorpayServerConfig();
    const keyId = config.keyId;

    if (!config.keySecret || !config.keyId) {
      return NextResponse.json(
        {
          error: "Payment gateway credentials are not configured on the server. Please check Razorpay keys.",
        },
        { status: 500 }
      );
    }

    // 4. Retrieve trusted Plan ID from server configuration
    const trustedPlanId = getRazorpayPlanId(targetPlan, billingCycle);

    let razorpaySubscriptionId: string | null = null;
    let razorpayShortUrl: string | null = null;
    let razorpayOrderId: string | null = null;
    const amountInPaise = Math.round(amountInRupees * 100);

    // 5. If Plan ID and Secret exist, create real Razorpay Subscription for AutoPay trials
    // USER DIRECTIVE: Take 2 rupees (not 5 rupees) via addons, refunded immediately
    if (effectiveTrial && trustedPlanId && config.keySecret && !config.keySecret.includes("placeholder")) {
      try {
        const trialStartSec = Math.floor(Date.now() / 1000);
        // Automatically schedule recurring debit from customer bank account after 7 days
        const trialEndSec = trialStartSec + (7 * 24 * 60 * 60);

        const subResult = await createRazorpaySubscription({
          planId: trustedPlanId,
          totalCount: isYearly ? 10 : 60,
          customerNotify: 1,
          startAt: trialEndSec,
          addons: [
            {
              item: {
                name: "Refundable Mandate Verification Token",
                amount: 200, // 200 paise = ₹2.00 (charged for verification, immediately auto-refunded)
                currency: "INR",
              },
            },
          ],
          notes: {
            businessId: effectiveBusinessId,
            userId: authenticatedUserId || "",
            plan: targetPlan,
            cycle: billingCycle,
            amount: "2",
            tokenAmount: "2",
            isTrial: "true",
            trialEndAt: trialEndIso,
            isUpgrade: isUpgrade ? "true" : "false",
            creditApplied: String(creditApplied),
          },
        });

        if (subResult?.id) {
          razorpaySubscriptionId = subResult.id;
          razorpayShortUrl = subResult.short_url || null;
        }
      } catch (subErr: any) {
        console.error("Razorpay Subscription API error:", subErr.message);
        throw subErr;
      }
    }

    // 6. Create Razorpay Order for commercial paid checkouts (amount > 0, for old users / direct plans)
    if (amountInPaise > 0 && config.keySecret && !config.keySecret.includes("placeholder")) {
      try {
        const cleanRcpt = effectiveBusinessId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10);
        const orderResult = await callRazorpayApi("/orders", {
          method: "POST",
          body: {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${cleanRcpt}_${Date.now()}`,
            notes: {
              businessId: effectiveBusinessId,
              userId: authenticatedUserId || "",
              plan: targetPlan,
              cycle: billingCycle,
              subscriptionId: razorpaySubscriptionId || "",
              isTrial: "false",
              isOldUser: isOldUser ? "true" : "false",
              isUpgrade: isUpgrade ? "true" : "false",
              creditApplied: String(creditApplied),
            },
          },
        });

        if (orderResult?.id) {
          razorpayOrderId = orderResult.id;
        }
      } catch (orderErr: any) {
        console.warn("Razorpay Order API notice:", orderErr.message);
      }
    }

    // Fallback order ID if API call was skipped or for zero-rupee mandate tracking
    if (!razorpayOrderId) {
      razorpayOrderId = effectiveTrial
        ? `mandate_auth_2_${Date.now()}`
        : `order_visro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    return NextResponse.json({
      success: true,
      keyId,
      subscriptionId: razorpaySubscriptionId,
      shortUrl: razorpayShortUrl,
      orderId: razorpayOrderId,
      planId: trustedPlanId || null,
      amount: amountInPaise,
      amountInRupees,
      recurringAmount: planRecurringPrice,
      verificationTokenAmount: effectiveTrial ? 2 : 0,
      currency: "INR",
      plan: targetPlan,
      cycle: billingCycle,
      userId: authenticatedUserId,
      isUpgrade,
      creditApplied,
      isTrial: effectiveTrial,
      isOldUser,
      trialDays: effectiveTrial ? 7 : 0,
      trialStartAt: effectiveTrial ? trialStartIso : null,
      trialEndAt: effectiveTrial ? trialEndIso : null,
      trialAppointmentLimit: 10,
      planConfig: VISRO_PLANS[targetPlan],
      isRecurringMandate: Boolean(razorpaySubscriptionId),
      mandateDisclosure: effectiveTrial
        ? `You are authorizing recurring AutoPay with ₹2 refundable bank verification for your 7-day free trial of VISROSLOT. The ₹2 verification is immediately refunded to your original bank account. Subscription charges of ₹${planRecurringPrice}/${billingCycle} debit starting on Day 8.`
        : `Direct Plan Activation: Immediate payment of ₹${amountInRupees} for ${targetPlan} plan (${billingCycle}).`,
    });
  } catch (err: any) {
    console.error("Subscription checkout initialization error:", err);
    return NextResponse.json(
      {
        error: "Failed to initialize subscription checkout",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
