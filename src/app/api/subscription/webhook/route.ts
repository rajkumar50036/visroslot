import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import {
  getRazorpayServerConfig,
  fetchRazorpaySubscription,
  refundRazorpayPayment,
  sweepPendingTrialTokenRefunds,
} from "@/lib/subscription/razorpayServer";
import { sendPaymentConfirmationEmail } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const config = getRazorpayServerConfig();
    const webhookSecret = config.webhookSecret;

    // 1. Webhook Signature Verification
    if (webhookSecret && !webhookSecret.includes("placeholder")) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing x-razorpay-signature header" },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { error: "Invalid webhook cryptographic signature" },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // 2. Idempotency Check: Prevent duplicate processing of the same webhook event
    const eventRef = db.collection("webhook_events").doc(eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      return NextResponse.json({
        received: true,
        idempotentReplay: true,
        message: `Webhook event ${eventId} already processed.`,
      });
    }

    // Record event as processed immediately in both collections for full backward compatibility
    const eventPayload = {
      event_id: eventId,
      event_type: event,
      received_at: new Date().toISOString(),
      processed: true,
    };
    await Promise.all([
      eventRef.set(eventPayload),
      db.collection("processed_webhook_events").doc(eventId).set(eventPayload),
    ]);

    const now = new Date();
    const nowIso = now.toISOString();

    // -------------------------------------------------------------
    // EVENT: subscription.authenticated (AutoPay Mandate Authorized)
    // -------------------------------------------------------------
    if (event === "subscription.authenticated") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      const notes = sub?.notes || {};
      const businessId = notes.businessId;
      const plan = notes.plan || "professional";
      const cycle = notes.cycle || "monthly";
      const isTrial = notes.isTrial === "true" || !sub?.paid_count;

      const isBusinessPlan = plan === "business" || String(plan).includes("999");
      const targetPlan = isBusinessPlan ? "business" : "professional";

      let trialEndIso = notes.trialEndAt;
      if (!trialEndIso) {
        const trialEndDate = new Date(now.getTime() + 7 * 86400 * 1000);
        trialEndIso = trialEndDate.toISOString();
      }

      if (businessId) {
        const subSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .limit(1)
          .get();

        const subUpdateData: any = {
          uid: notes.userId || null,
          user_id: notes.userId || null,
          businessId: businessId,
          business_id: businessId,
          plan: targetPlan,
          billingFrequency: cycle,
          billing_period: cycle,
          billing_cycle: cycle,
          status: isTrial ? "TRIALING" : "active",
          subscriptionStatus: isTrial ? "TRIALING" : "ACTIVE",
          mandateStatus: "AUTHORIZED",
          razorpaySubscriptionId: subId,
          razorpay_subscription_id: subId,
          autoPayAuthorizationStatus: "AUTHORIZED",
          trialStart: isTrial ? nowIso : null,
          trialEnd: isTrial ? trialEndIso : null,
          firstPaymentScheduledAt: isTrial ? trialEndIso : null,
          paidThrough: trialEndIso,
          nextRenewalAt: trialEndIso,
          cancellationStatus: "NONE",
          accessEndsAt: trialEndIso,
          renewal_date: trialEndIso,
          paid_through_date: trialEndIso,
          is_unlimited: isTrial ? false : isBusinessPlan,
          payment_verification_status: "verified",
          updated_at: nowIso,
          updatedAt: nowIso,
        };

        if (isTrial) {
          subUpdateData.trialStartAt = nowIso;
          subUpdateData.trialEndAt = trialEndIso;
          subUpdateData.trialAppointmentLimit = 10;
          if (!subSnap.empty && subSnap.docs[0].data().trialAppointmentsUsed !== undefined) {
            subUpdateData.trialAppointmentsUsed = subSnap.docs[0].data().trialAppointmentsUsed;
          } else {
            subUpdateData.trialAppointmentsUsed = 0;
          }
        }

        if (!subSnap.empty) {
          await subSnap.docs[0].ref.update(subUpdateData);
        } else {
          await db.collection("subscriptions").add({
            ...subUpdateData,
            created_at: nowIso,
          });
        }

        await db.collection("businesses").doc(businessId).update({
          plan: targetPlan,
          subscription_status: isTrial ? "TRIALING" : "active",
          subscription_expires_at: trialEndIso,
          trial_ends_at: isTrial ? trialEndIso : null,
          booking_quota_reached: false,
          is_unlimited: isTrial ? false : isBusinessPlan,
          updated_at: nowIso,
        });
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.activated
    // -------------------------------------------------------------
    else if (event === "subscription.activated") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      const notes = sub?.notes || {};
      const businessId = notes.businessId;
      const plan = notes.plan || "professional";
      const cycle = notes.cycle || "monthly";
      const isYearly = cycle === "yearly";

      const isBusinessPlan = plan === "business" || String(plan).includes("999");
      const targetPlan = isBusinessPlan ? "business" : "professional";

      let paidThroughDate = new Date(now);
      if (sub?.current_end) {
        paidThroughDate = new Date(sub.current_end * 1000);
      } else {
        paidThroughDate.setDate(paidThroughDate.getDate() + (isYearly ? 365 : 30));
      }
      const paidThroughIso = paidThroughDate.toISOString();

      if (businessId) {
        // Upsert subscription
        const subSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .limit(1)
          .get();

        const subUpdateData = {
          business_id: businessId,
          user_id: notes.userId || null,
          plan: targetPlan,
          billing_period: cycle,
          billing_cycle: cycle,
          status: "active",
          razorpay_subscription_id: subId,
          start_date: sub?.start_at ? new Date(sub.start_at * 1000).toISOString() : nowIso,
          renewal_date: paidThroughIso,
          paid_through_date: paidThroughIso,
          activated_at: nowIso,
          expires_at: paidThroughIso,
          is_unlimited: isBusinessPlan,
          payment_verification_status: "verified",
          updated_at: nowIso,
        };

        if (!subSnap.empty) {
          await subSnap.docs[0].ref.update(subUpdateData);
        } else {
          await db.collection("subscriptions").add({
            ...subUpdateData,
            created_at: nowIso,
          });
        }

        // Enable business dashboard & booking page
        await db.collection("businesses").doc(businessId).update({
          plan: targetPlan,
          subscription_status: "active",
          subscription_expires_at: paidThroughIso,
          booking_quota_reached: false,
          is_unlimited: isBusinessPlan,
          updated_at: nowIso,
        });
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.charged
    // -------------------------------------------------------------
    else if (event === "subscription.charged") {
      const sub = payload.payload?.subscription?.entity;
      const payment = payload.payload?.payment?.entity;
      const subId = sub?.id;
      const paymentId = payment?.id;
      const notes = sub?.notes || payment?.notes || {};
      const businessId = notes.businessId;
      const plan = notes.plan || "professional";
      const cycle = notes.cycle || "monthly";
      const amountInRupees = payment?.amount ? payment.amount / 100 : 0;

      const isBusinessPlan = plan === "business" || String(plan).includes("999");
      const targetPlan = isBusinessPlan ? "business" : "professional";

      let nextPaidThrough = new Date(now);
      if (sub?.current_end) {
        nextPaidThrough = new Date(sub.current_end * 1000);
      } else {
        nextPaidThrough.setDate(nextPaidThrough.getDate() + (cycle === "yearly" ? 365 : 30));
      }
      const nextPaidThroughIso = nextPaidThrough.toISOString();

      if (businessId && paymentId) {
        // Record payment in payments collection
        const paySnap = await db
          .collection("payments")
          .where("payment_id", "==", paymentId)
          .limit(1)
          .get();

        if (paySnap.empty) {
          await db.collection("payments").add({
            business_id: businessId,
            user_id: notes.userId || null,
            subscription_id: subId,
            payment_id: paymentId,
            amount: amountInRupees,
            currency: payment?.currency || "INR",
            plan: targetPlan,
            billing_period: cycle,
            billing_cycle: cycle,
            status: "CAPTURED",
            verification_status: "verified",
            verification_method: "WEBHOOK",
            created_at: nowIso,
          });
        }

        // Extend subscription access
        const subSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .limit(1)
          .get();

        if (!subSnap.empty) {
          await subSnap.docs[0].ref.update({
            status: "active",
            subscriptionStatus: "ACTIVE",
            mandateStatus: "AUTHORIZED",
            is_trial: false,
            paidThrough: nextPaidThroughIso,
            nextRenewalAt: nextPaidThroughIso,
            accessEndsAt: nextPaidThroughIso,
            renewal_date: nextPaidThroughIso,
            paid_through_date: nextPaidThroughIso,
            expires_at: nextPaidThroughIso,
            payment_id: paymentId,
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }

        // Ensure business access remains active
        const busDoc = await db.collection("businesses").doc(businessId).get();
        const busData = busDoc.data();

        await db.collection("businesses").doc(businessId).update({
          plan: targetPlan,
          subscription_status: "active",
          subscriptionStatus: "ACTIVE",
          publicBookingStatus: "ACTIVE",
          publicBookingPauseReason: null,
          subscription_expires_at: nextPaidThroughIso,
          booking_quota_reached: false,
          is_unlimited: isBusinessPlan,
          updated_at: nowIso,
          updatedAt: nowIso,
        });

        if (notes.userId) {
          await db.collection("users").doc(notes.userId).set({
            accountStatus: "ACTIVE",
            subscription_status: "ACTIVE",
            subscriptionStatus: "ACTIVE",
            updatedAt: nowIso,
          }, { merge: true });
        }

        // Send recurring renewal confirmation email (Non-blocking)
        let renewEmail = busData?.owner_email || busData?.email || payment?.email;
        if (notes.userId && !renewEmail) {
          const uSnap = await db.collection("users").doc(notes.userId).get();
          renewEmail = uSnap.data()?.email;
        }

        if (renewEmail) {
          sendPaymentConfirmationEmail({
            customerEmail: renewEmail,
            customerName: busData?.name || "Business Owner",
            businessName: busData?.name || "VISROSLOT Business",
            planName:
              targetPlan === "business"
                ? "Business Suite (Unlimited Appointments)"
                : "Professional Plan (300 Bookings / Month)",
            billingCycle: cycle,
            amount: amountInRupees,
            razorpayPaymentId: paymentId,
            razorpaySubscriptionId: subId,
            paymentDate: nowIso,
            subscriptionStatus: "ACTIVE",
            nextBillingDate: nextPaidThroughIso,
            customerUid: notes.userId || undefined,
            isRenewal: true,
          }).catch((err) => {
            console.warn("[Webhook Renewal Email Warning]:", err.message);
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.pending
    // -------------------------------------------------------------
    else if (event === "subscription.pending") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      const businessId = sub?.notes?.businessId;

      if (businessId && subId) {
        const subSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .limit(1)
          .get();

        if (!subSnap.empty) {
          await subSnap.docs[0].ref.update({
            status: "pending",
            updated_at: nowIso,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.halted / subscription.paused
    // -------------------------------------------------------------
    else if (event === "subscription.halted" || event === "subscription.paused") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      let businessId = sub?.notes?.businessId;

      if (subId) {
        let subDocRef: any = null;
        if (businessId) {
          const subSnap = await db.collection("subscriptions").where("business_id", "==", businessId).limit(1).get();
          if (!subSnap.empty) subDocRef = subSnap.docs[0].ref;
        }
        if (!subDocRef) {
          const subSnapAlt = await db.collection("subscriptions").where("razorpay_subscription_id", "==", subId).limit(1).get();
          if (!subSnapAlt.empty) {
            subDocRef = subSnapAlt.docs[0].ref;
            businessId = businessId || subSnapAlt.docs[0].data().business_id || subSnapAlt.docs[0].data().businessId;
          }
        }

        if (subDocRef) {
          await subDocRef.update({
            status: "halted",
            subscriptionStatus: "HALTED",
            mandateStatus: "HALTED",
            auto_debit_enabled: false,
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }

        if (businessId) {
          await db.collection("businesses").doc(businessId).update({
            subscription_status: "halted",
            publicBookingStatus: "PAUSED",
            publicBookingPauseReason: "RENEWAL_HALTED",
            auto_debit_enabled: false,
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.cancelled (Triggered when user cancels AutoPay from UPI App or Dashboard)
    // -------------------------------------------------------------
    else if (event === "subscription.cancelled") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      let businessId = sub?.notes?.businessId;

      if (subId) {
        let subDocRef: any = null;
        let sData: any = null;

        if (businessId) {
          const subSnap = await db.collection("subscriptions").where("business_id", "==", businessId).limit(1).get();
          if (!subSnap.empty) {
            subDocRef = subSnap.docs[0].ref;
            sData = subSnap.docs[0].data();
          }
        }

        if (!subDocRef) {
          // Look up directly by Razorpay Subscription ID (e.g. if cancelled from PhonePe/GPay without notes)
          const subSnapAlt = await db.collection("subscriptions").where("razorpay_subscription_id", "==", subId).limit(1).get();
          if (!subSnapAlt.empty) {
            subDocRef = subSnapAlt.docs[0].ref;
            sData = subSnapAlt.docs[0].data();
            businessId = businessId || sData.business_id || sData.businessId;
          }
        }

        let paidThroughIso = nowIso;
        if (sub?.current_end) {
          paidThroughIso = new Date(sub.current_end * 1000).toISOString();
        }

        let accessEndsAt = paidThroughIso;
        if (sData) {
          const isTrial = sData.subscriptionStatus === "TRIALING" || sData.status === "TRIALING" || sData.is_trial;
          accessEndsAt = isTrial
            ? (sData.trialEnd || sData.trialEndAt || paidThroughIso)
            : (sData.paidThrough || sData.paid_through_date || paidThroughIso);
        }

        if (subDocRef) {
          await subDocRef.update({
            status: "cancelled",
            subscriptionStatus: "CANCELLED",
            mandateStatus: "REVOKED_VIA_UPI_APP",
            cancellationStatus: "CANCELLED",
            cancellation_channel: "UPI_APP",
            auto_debit_enabled: false,
            cancelled_at: nowIso,
            cancel_at_cycle_end: true,
            accessEndsAt,
            paidThrough: accessEndsAt,
            paid_through_date: accessEndsAt,
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }

        if (businessId) {
          const hasAccessExpired = new Date(accessEndsAt) <= now;
          await db.collection("businesses").doc(businessId).update({
            cancellationStatus: "CANCELLED",
            mandateStatus: "REVOKED_VIA_UPI_APP",
            auto_debit_enabled: false,
            publicBookingStatus: hasAccessExpired ? "PAUSED" : "ACTIVE",
            publicBookingPauseReason: hasAccessExpired ? "SUBSCRIPTION_CANCELLED" : null,
            subscription_status: hasAccessExpired ? "expired" : "cancelled",
            updated_at: nowIso,
            updatedAt: nowIso,
          });

          await db.collection("autopay_verifications").doc(`autopay_${businessId}`).set({
            mandate_status: "REVOKED_VIA_UPI_APP",
            cancellation_channel: "UPI_APP",
            auto_debit_enabled: false,
            revocation_date: nowIso,
            updated_at: nowIso,
          }, { merge: true });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: subscription.completed
    // -------------------------------------------------------------
    else if (event === "subscription.completed") {
      const sub = payload.payload?.subscription?.entity;
      const subId = sub?.id;
      const businessId = sub?.notes?.businessId;

      if (businessId && subId) {
        const subSnap = await db
          .collection("subscriptions")
          .where("business_id", "==", businessId)
          .limit(1)
          .get();

        if (!subSnap.empty) {
          await subSnap.docs[0].ref.update({
            status: "completed",
            subscriptionStatus: "EXPIRED",
            updated_at: nowIso,
          });
        }
        await db.collection("businesses").doc(businessId).update({
          subscription_status: "expired",
          publicBookingStatus: "PAUSED",
          publicBookingPauseReason: "SUBSCRIPTION_COMPLETED",
          updated_at: nowIso,
          updatedAt: nowIso,
        });
      }
    }

    // -------------------------------------------------------------
    // EVENT: payment.authorized (eMandate or Order Authorization)
    // -------------------------------------------------------------
    else if (event === "payment.authorized") {
      const payment = payload.payload?.payment?.entity;
      const paymentId = payment?.id;
      const notes = payment?.notes || {};
      const businessId = notes.businessId;

      if (businessId && paymentId) {
        const paySnap = await db
          .collection("payments")
          .where("payment_id", "==", paymentId)
          .limit(1)
          .get();

        if (paySnap.empty) {
          await db.collection("payments").add({
            business_id: businessId,
            user_id: notes.userId || null,
            subscription_id: notes.subscriptionId || payment?.subscription_id || null,
            payment_id: paymentId,
            amount: payment?.amount ? payment.amount / 100 : 0,
            currency: payment?.currency || "INR",
            status: "AUTHORIZED",
            verification_status: "verified",
            verification_method: "WEBHOOK",
            created_at: nowIso,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: payment.captured
    // -------------------------------------------------------------
    else if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      const paymentId = payment?.id;
      const notes = payment?.notes || {};
      const businessId = notes.businessId;
      const amountInPaise = payment?.amount || 0;
      const amountInRupees = amountInPaise / 100;

      // Strict Exclusion: Commercial subscription payments (>= ₹499) must NEVER be refunded via verification workflow
      const isActualSubscriptionPayment =
        amountInRupees >= 499 ||
        notes.record_type === "SUBSCRIPTION_PAYMENT" ||
        (notes.plan && !notes.isTrial && (notes.plan === "professional" || notes.plan === "business"));

      // Identify temporary AutoPay verification deduction (₹2 token) exclusively
      const isTrialTokenPayment =
        !isActualSubscriptionPayment &&
        (amountInPaise === 200 || notes.isTrial === "true" || notes.mandateTokenAmount === "2");

      let tokenRefundData: any = null;
      if (isTrialTokenPayment && paymentId) {
        try {
          tokenRefundData = await refundRazorpayPayment({
            paymentId,
            amountInPaise: 200,
            notes: {
              reason: "VISROSLOT 7-Day Free Trial AutoPay Token Instant Refund (Webhook)",
              businessId: businessId || "",
              userId: notes.userId || "",
            },
          });
          console.log(`[Webhook Auto-Refund] Successfully initiated ₹2 refund for ${paymentId}:`, tokenRefundData?.id);
        } catch (rfErr: any) {
          console.warn(`[Webhook Auto-Refund Warning] Could not refund token for ${paymentId}:`, rfErr.message);
        }
      }

      if (businessId && paymentId) {
        if (isTrialTokenPayment) {
          // Record AutoPay verification deduction in separate autopay_verifications collection
          await db.collection("autopay_verifications").doc(`autopay_${businessId}`).set({
            id: `autopay_${businessId}`,
            business_id: businessId,
            user_id: notes.userId || null,
            authorization_ref: payment?.subscription_id || notes.subscriptionId || paymentId,
            payment_method: payment?.method || "card",
            verification_deduction_amount: 2,
            verification_payment_ref: paymentId,
            automatic_refund_ref: tokenRefundData?.id || null,
            refund_status: tokenRefundData?.id ? "REFUND_PROCESSED" : "REFUND_PENDING",
            mandate_status: "AUTHORIZED",
            authorization_date: nowIso,
            refund_date: tokenRefundData?.id ? nowIso : null,
            created_at: nowIso,
            updated_at: nowIso,
          }, { merge: true });
        } else {
          // Record genuine subscription payment in payments collection
          const paySnap = await db
            .collection("payments")
            .where("payment_id", "==", paymentId)
            .limit(1)
            .get();

          if (paySnap.empty) {
            await db.collection("payments").add({
              business_id: businessId,
              user_id: notes.userId || null,
              subscription_id: notes.subscriptionId || payment?.subscription_id || null,
              payment_id: paymentId,
              amount: amountInRupees,
              currency: payment?.currency || "INR",
              status: "CAPTURED",
              record_type: "SUBSCRIPTION_PAYMENT",
              is_trial_authorization: false,
              verification_status: "verified",
              verification_method: "WEBHOOK",
              created_at: nowIso,
            });
          }

          // Unpause public booking link upon successful payment capture
          await db.collection("businesses").doc(businessId).update({
            publicBookingStatus: "ACTIVE",
            publicBookingPauseReason: null,
            subscription_status: "active",
            subscriptionStatus: "ACTIVE",
            booking_quota_reached: false,
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: refund.processed (AutoPay Verification Refund Confirmed)
    // -------------------------------------------------------------
    else if (event === "refund.processed") {
      const refund = payload.payload?.refund?.entity;
      const refundId = refund?.id;
      const paymentId = refund?.payment_id;

      if (paymentId) {
        const autoSnap = await db
          .collection("autopay_verifications")
          .where("verification_payment_ref", "==", paymentId)
          .limit(1)
          .get();

        if (!autoSnap.empty) {
          await autoSnap.docs[0].ref.update({
            automatic_refund_ref: refundId,
            refund_status: "REFUND_PROCESSED",
            refund_date: nowIso,
            updated_at: nowIso,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // EVENT: payment.failed
    // -------------------------------------------------------------
    else if (event === "payment.failed") {
      const payment = payload.payload?.payment?.entity;
      const paymentId = payment?.id;
      const notes = payment?.notes || {};
      const businessId = notes.businessId;

      if (businessId && paymentId) {
        await db.collection("payments").add({
          business_id: businessId,
          user_id: notes.userId || null,
          payment_id: paymentId,
          amount: payment?.amount ? payment.amount / 100 : 0,
          currency: payment?.currency || "INR",
          status: "FAILED",
          error_code: payment?.error_code || null,
          error_description: payment?.error_description || "Payment authorization failed",
          created_at: nowIso,
        });

        // If recurring renewal debit failed, immediately pause public booking link
        if (payment?.subscription_id || notes.subscriptionId || notes.record_type === "SUBSCRIPTION_PAYMENT") {
          await db.collection("businesses").doc(businessId).update({
            publicBookingStatus: "PAUSED",
            publicBookingPauseReason: "RENEWAL_PAYMENT_FAILED",
            subscription_status: "payment_failed",
            updated_at: nowIso,
            updatedAt: nowIso,
          });
        }
      }
    }

    // Optional server reconciliation with Razorpay API
    const subId = payload.payload?.subscription?.entity?.id;
    if (subId && config.keySecret && !config.keySecret.includes("placeholder")) {
      try {
        await fetchRazorpaySubscription(subId);
      } catch (recErr: any) {
        console.warn("Reconciliation fetch notice:", recErr.message);
      }
    }

    return NextResponse.json({
      received: true,
      event,
      eventId,
      status: "processed",
    });
  } catch (err: any) {
    console.error("Razorpay webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing error", details: err.message },
      { status: 500 }
    );
  }
}
