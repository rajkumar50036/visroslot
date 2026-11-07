import crypto from "crypto";

/**
 * VISROSLOT Razorpay Server Service
 * Strict server-side environment variables and Razorpay Subscription API helpers.
 * Never expose Key Secret or Webhook Secret to the browser.
 */

export interface RazorpayPlanConfig {
  keyId: string;
  keySecret?: string;
  webhookSecret?: string;
  plans: {
    professional: {
      monthly: string | null;
      yearly: string | null;
    };
    business: {
      monthly: string | null;
      yearly: string | null;
    };
  };
}

/**
 * Retrieve validated Razorpay configuration from server environment variables.
 */
export function getRazorpayServerConfig(): RazorpayPlanConfig {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";

  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  return {
    keyId,
    keySecret,
    webhookSecret,
    plans: {
      professional: {
        monthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "plan_Twc9lFpxSRFc23",
        yearly: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || "plan_Twc9vMU8YEJwiz",
      },
      business: {
        monthly: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID || "plan_TwcA6JbcglDJ9F",
        yearly: process.env.RAZORPAY_BUSINESS_YEARLY_PLAN_ID || "plan_TwcAFFJynRRG8t",
      },
    },
  };
}

/**
 * Get trusted Plan ID for a plan and billing cycle.
 */
export function getRazorpayPlanId(
  plan: "professional" | "business",
  cycle: "monthly" | "yearly"
): string | null {
  const config = getRazorpayServerConfig();
  return config.plans[plan]?.[cycle] || null;
}

/**
 * Verify Razorpay Subscription Signature (for client checkout returns).
 * Formula: HMAC-SHA256(payment_id + "|" + subscription_id, key_secret) === signature
 */
export function verifySubscriptionSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  const config = getRazorpayServerConfig();
  if (!config.keySecret || config.keySecret.includes("placeholder")) {
    // If running in development without live secret, log warning
    console.warn("RAZORPAY_KEY_SECRET is not configured for signature verification.");
    return false;
  }

  const payload = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Verify Razorpay Standard Order Signature (for one-time orders / upfront payments).
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
export function verifyOrderSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const config = getRazorpayServerConfig();
  if (!config.keySecret || config.keySecret.includes("placeholder")) {
    console.warn("RAZORPAY_KEY_SECRET is not configured for signature verification.");
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Verify Razorpay Webhook Signature.
 * Formula: HMAC-SHA256(raw_body, webhook_secret) === signature
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const config = getRazorpayServerConfig();
  if (!config.webhookSecret || config.webhookSecret.includes("placeholder")) {
    console.warn("RAZORPAY_WEBHOOK_SECRET is not configured for webhook verification.");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Call Razorpay REST API with Basic Auth.
 */
export async function callRazorpayApi(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH";
    body?: any;
  } = {}
) {
  const config = getRazorpayServerConfig();
  if (!config.keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET environment variable is missing.");
  }

  const authHeader =
    "Basic " + Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  const url = `https://api.razorpay.com/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const errorMsg = data?.error?.description || data?.error?.message || text || "Razorpay API error";
    throw new Error(`Razorpay API Error (${res.status}): ${errorMsg}`);
  }

  return data;
}

/**
 * Create a recurring subscription on Razorpay.
 */
export async function createRazorpaySubscription(params: {
  planId: string;
  totalCount?: number;
  quantity?: number;
  customerNotify?: 0 | 1;
  startAt?: number;
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency?: string;
    };
  }>;
  notes?: Record<string, string>;
}) {
  const body: any = {
    plan_id: params.planId,
    total_count: params.totalCount || 60, // 5 years monthly or 60 cycles
    quantity: params.quantity || 1,
    customer_notify: params.customerNotify !== undefined ? params.customerNotify : 1,
    notes: params.notes || {},
  };

  if (params.startAt) {
    body.start_at = params.startAt;
  }

  if (params.addons && params.addons.length > 0) {
    body.addons = params.addons;
  }

  return await callRazorpayApi("/subscriptions", {
    method: "POST",
    body,
  });
}

/**
 * Cancel a subscription on Razorpay.
 * cancelAtCycleEnd = true stops future renewals without removing already-paid access.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
) {
  return await callRazorpayApi(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    },
  });
}

/**
 * Fetch a subscription record directly from Razorpay.
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  return await callRazorpayApi(`/subscriptions/${subscriptionId}`, {
    method: "GET",
  });
}

/**
 * Refund a payment on Razorpay.
 * Used for instant automatic refund of mandate verification tokens (e.g. ₹2 token refund).
 * Automatically resolves payment ID if order ID or subscription ID is passed.
 */
export async function refundRazorpayPayment(params: {
  paymentId: string;
  amountInPaise?: number;
  notes?: Record<string, string>;
}) {
  let targetPaymentId = params.paymentId;

  try {
    // If an order ID was passed instead of a payment ID, resolve the captured payment
    if (targetPaymentId.startsWith("order_")) {
      let orderPayments = await callRazorpayApi(`/orders/${targetPaymentId}/payments`);
      let captured = orderPayments?.items?.find((p: any) => p.status === "captured" && p.amount_refunded < p.amount) ||
                     orderPayments?.items?.[0];

      // If not found immediately, retry once after 1 second delay
      if (!captured?.id) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        orderPayments = await callRazorpayApi(`/orders/${targetPaymentId}/payments`);
        captured = orderPayments?.items?.find((p: any) => p.status === "captured" && p.amount_refunded < p.amount) ||
                   orderPayments?.items?.[0];
      }

      if (captured?.id) {
        targetPaymentId = captured.id;
      }
    } else if (targetPaymentId.startsWith("sub_")) {
      // If a subscription ID was passed, resolve its payment
      let subPayments = await callRazorpayApi(`/subscriptions/${targetPaymentId}/payments`);
      let captured = subPayments?.items?.find((p: any) => p.status === "captured" && p.amount_refunded < p.amount) ||
                     subPayments?.items?.[0];

      if (!captured?.id) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        subPayments = await callRazorpayApi(`/subscriptions/${targetPaymentId}/payments`);
        captured = subPayments?.items?.find((p: any) => p.status === "captured" && p.amount_refunded < p.amount) ||
                   subPayments?.items?.[0];
      }

      if (captured?.id) {
        targetPaymentId = captured.id;
      }
    }

    if (!targetPaymentId || !targetPaymentId.startsWith("pay_")) {
      console.warn(`[Razorpay Refund] Could not resolve payment ID from: ${params.paymentId}`);
      return null;
    }

    // Inspect payment status on Razorpay
    let paymentDetails: any = null;
    try {
      paymentDetails = await callRazorpayApi(`/payments/${targetPaymentId}`);
    } catch (e: any) {
      console.warn(`[Razorpay Refund] Could not fetch payment ${targetPaymentId}:`, e.message);
    }

    if (paymentDetails) {
      // Already fully refunded
      if (paymentDetails.amount_refunded >= paymentDetails.amount && paymentDetails.amount > 0) {
        console.log(`[Razorpay Refund] Payment ${targetPaymentId} is already refunded.`);
        return {
          id: `ref_already_${targetPaymentId}`,
          status: "processed",
          alreadyRefunded: true,
          payment_id: targetPaymentId,
          amount: paymentDetails.amount_refunded,
        };
      }

      // If authorized but not captured, capture it first so Razorpay allows refunding to bank
      if (paymentDetails.status === "authorized") {
        try {
          console.log(`[Razorpay Refund] Payment ${targetPaymentId} is in authorized state. Capturing ₹2 before refund...`);
          await callRazorpayApi(`/payments/${targetPaymentId}/capture`, {
            method: "POST",
            body: {
              amount: params.amountInPaise || paymentDetails.amount || 200,
              currency: "INR",
            },
          });
        } catch (capErr: any) {
          console.warn(`[Razorpay Refund Capture Notice]:`, capErr.message);
        }
      }
    }

    const body: any = {
      notes: params.notes || {
        reason: "VISROSLOT 7-day free trial mandate verification token automatic refund",
      },
    };

    if (params.amountInPaise) {
      body.amount = params.amountInPaise;
    }

    // Attempt 1: Try with speed: "optimum" for instant bank refund routing
    try {
      const refundRes = await callRazorpayApi(`/payments/${targetPaymentId}/refund`, {
        method: "POST",
        body: {
          ...body,
          speed: "optimum",
        },
      });

      console.log(`[Razorpay Refund Success (Optimum Speed)] Refunded payment ${targetPaymentId}:`, refundRes?.id);
      return refundRes;
    } catch (optimumErr: any) {
      console.warn(`Optimum speed refund notice (${optimumErr.message}). Retrying with standard refund...`);
      
      // Attempt 2: Fallback to normal standard refund directly to original bank account / card
      const normalRefundRes = await callRazorpayApi(`/payments/${targetPaymentId}/refund`, {
        method: "POST",
        body,
      });

      console.log(`[Razorpay Refund Success (Normal Speed)] Refunded payment ${targetPaymentId}:`, normalRefundRes?.id);
      return normalRefundRes;
    }
  } catch (err: any) {
    console.warn(`Razorpay refund notice for payment ${params.paymentId} (${targetPaymentId}):`, err.message);
    return null;
  }
}

/**
 * Sweeps and refunds any captured ₹2 trial mandate verification tokens that have not been refunded yet.
 */
export async function sweepPendingTrialTokenRefunds() {
  try {
    const paymentsList = await callRazorpayApi("/payments?count=25");
    const items = paymentsList?.items || [];
    const unrefundedTrialPayments = items.filter(
      (p: any) =>
        (p.status === "captured" || p.status === "authorized") &&
        p.amount === 200 &&
        (!p.amount_refunded || p.amount_refunded === 0)
    );

    const results = [];
    for (const p of unrefundedTrialPayments) {
      try {
        const ref = await refundRazorpayPayment({
          paymentId: p.id,
          amountInPaise: 200,
          notes: {
            reason: "VISROSLOT automatic sweep refund for 7-day trial verification token",
          },
        });
        results.push({ paymentId: p.id, refundId: ref?.id, status: ref?.status });
      } catch (err: any) {
        console.warn(`Failed to sweep refund ${p.id}:`, err.message);
      }
    }
    return results;
  } catch (err: any) {
    console.warn("Failed to sweep trial token refunds:", err.message);
    return [];
  }
}
