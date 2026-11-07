import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getPlatformBaseUrl, getPlatformDisplayHost } from "@/lib/config/domain";

export interface PaymentEmailParams {
  customerEmail: string;
  customerName?: string;
  businessName?: string;
  planName: string;
  billingCycle: string;
  amount: string | number;
  razorpayPaymentId: string;
  razorpaySubscriptionId?: string;
  paymentDate?: string;
  subscriptionStatus?: string;
  nextBillingDate?: string;
  customerUid?: string;
  isRenewal?: boolean;
}

/**
 * Builds the branded VISROSLOT responsive HTML email template.
 * Colors: Deep Navy (#101A2B), Royal Gold (#C49A46), Warm Gold (#D9B66E), White (#FFFFFF).
 */
export function buildPaymentEmailHtml(params: PaymentEmailParams): string {
  const isRenewal = Boolean(params.isRenewal);
  const subjectTitle = isRenewal
    ? "Subscription Renewed Successfully"
    : "Payment Successful – Welcome to VISROSLOT!";
  const greetingName = params.customerName || "Business Owner";
  const formattedAmount =
    typeof params.amount === "number"
      ? `₹${params.amount.toLocaleString("en-IN")}`
      : params.amount.startsWith("₹")
      ? params.amount
      : `₹${params.amount}`;
  const formattedDate =
    params.paymentDate ||
    new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const baseUrl = getPlatformBaseUrl();
  const displayHost = getPlatformDisplayHost();
  const ctaUrl = `${baseUrl}/onboarding`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subjectTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7F5F0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #252525; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F7F5F0; padding: 40px 0; }
    .main { background-color: #FFFFFF; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 20px; overflow: hidden; border: 1px solid #E8E5DD; box-shadow: 0 4px 20px rgba(16, 26, 43, 0.05); }
    .header { background-color: #101A2B; padding: 36px 40px; text-align: center; }
    .logo-text { font-family: 'Manrope', sans-serif; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 0; }
    .logo-gold { color: #C49A46; }
    .tagline { color: #D9B66E; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 40px; }
    .badge { display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; }
    .h1 { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800; color: #101A2B; margin: 0 0 14px 0; line-height: 1.3; }
    .intro { font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 28px 0; }
    .receipt-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 24px; margin-bottom: 28px; }
    .receipt-title { font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #C49A46; margin: 0 0 16px 0; }
    .receipt-table { width: 100%; font-size: 13px; }
    .receipt-row td { padding: 8px 0; border-bottom: 1px solid #EDF2F7; }
    .receipt-row:last-child td { border-bottom: none; }
    .label { color: #64748B; font-weight: 500; width: 45%; }
    .value { color: #0F172A; font-weight: 700; text-align: right; }
    .value-amount { color: #101A2B; font-size: 18px; font-weight: 900; }
    .next-box { background-color: #FFFDF9; border: 1px solid #F6EBD9; border-radius: 14px; padding: 22px; margin-bottom: 32px; }
    .next-title { font-size: 14px; font-weight: 800; color: #101A2B; margin: 0 0 8px 0; }
    .next-text { font-size: 13px; line-height: 1.5; color: #64748B; margin: 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #C49A46; color: #FFFFFF !important; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(196, 154, 70, 0.3); }
    .footer { background-color: #101A2B; padding: 28px 40px; text-align: center; font-size: 12px; color: #94A3B8; }
    .footer-link { color: #C49A46; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <!-- HEADER -->
      <tr>
        <td class="header" style="text-align: center; padding: 28px 24px;">
          <img src="${baseUrl}/assets/visroslot-logo.png" alt="VISROSLOT" width="64" height="64" style="border-radius: 50%; display: block; margin: 0 auto 12px; border: 2px solid #C49A46;" />
          <h1 class="logo-text" style="margin: 0; font-family: 'Manrope', sans-serif; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF;">VISRO<span class="logo-gold" style="color: #F97316;">SLOT</span></h1>
          <div class="tagline" style="font-family: monospace; font-size: 10px; color: #C49A46; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">EVERY SLOT. SIMPLIFIED.</div>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td class="content">
          <div class="badge">Payment Verified</div>
          <h2 class="h1">
            ${isRenewal ? "Your Subscription Has Renewed!" : "Welcome to VISROSLOT!"}
          </h2>
          <p class="intro">
            Dear ${greetingName},<br />
            Thank you for choosing VISROSLOT! Your subscription payment has been successfully verified and confirmed.
          </p>

          <!-- PAYMENT DETAILS BOX -->
          <div class="receipt-box">
            <div class="receipt-title">Payment Receipt & Details</div>
            <table class="receipt-table">
              <tr class="receipt-row">
                <td class="label">Customer Name</td>
                <td class="value">${greetingName}</td>
              </tr>
              ${
                params.businessName
                  ? `<tr class="receipt-row"><td class="label">Business Name</td><td class="value">${params.businessName}</td></tr>`
                  : ""
              }
              <tr class="receipt-row">
                <td class="label">Subscription Plan</td>
                <td class="value">${params.planName}</td>
              </tr>
              <tr class="receipt-row">
                <td class="label">Billing Cycle</td>
                <td class="value" style="text-transform: capitalize;">${params.billingCycle}</td>
              </tr>
              <tr class="receipt-row">
                <td class="label">Amount Paid</td>
                <td class="value value-amount">${formattedAmount}</td>
              </tr>
              <tr class="receipt-row">
                <td class="label">Payment ID</td>
                <td class="value" style="font-family: monospace; font-size: 11px;">${params.razorpayPaymentId}</td>
              </tr>
              ${
                params.razorpaySubscriptionId
                  ? `<tr class="receipt-row"><td class="label">Subscription ID</td><td class="value" style="font-family: monospace; font-size: 11px;">${params.razorpaySubscriptionId}</td></tr>`
                  : ""
              }
              <tr class="receipt-row">
                <td class="label">Payment Date</td>
                <td class="value">${formattedDate}</td>
              </tr>
              <tr class="receipt-row">
                <td class="label">Subscription Status</td>
                <td class="value" style="color: #059669; font-weight: 800;">${params.subscriptionStatus || "ACTIVE"}</td>
              </tr>
              ${
                params.nextBillingDate
                  ? `<tr class="receipt-row"><td class="label">Next Billing Date</td><td class="value">${params.nextBillingDate}</td></tr>`
                  : ""
              }
            </table>
          </div>

          <!-- WHAT'S NEXT -->
          <div class="next-box">
            <div class="next-title">What's Next?</div>
            <p class="next-text">
              Your payment is confirmed! You can now continue setting up your business profile, add services and staff, and start accepting online customer appointments.
            </p>
          </div>

          <!-- PRIMARY ACTION BUTTON -->
          <div class="btn-container">
            <a href="${ctaUrl}" target="_blank" class="btn">
              Continue to VISROSLOT &rarr;
            </a>
          </div>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td class="footer">
          <p style="margin: 0 0 8px 0;">
            Thank you for being part of VISROSLOT.<br />
            <strong>EVERY SLOT. SIMPLIFIED.</strong>
          </p>
          <p style="margin: 0; font-size: 11px; opacity: 0.8;">
            VISROSLOT SaaS Platform &bull;
            <a href="${baseUrl}" class="footer-link">${displayHost}</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Sends a transactional payment confirmation email with server-side idempotency.
 * Safe failure: email delivery failure never impacts subscription activation.
 */
export async function sendPaymentConfirmationEmail(
  params: PaymentEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string; alreadySent?: boolean }> {
  const { db } = getFirebaseAdmin();
  const paymentId = params.razorpayPaymentId;
  const emailType = params.isRenewal ? "RENEWAL_CONFIRMATION" : "INITIAL_PAYMENT";
  const idempotencyKey = `email_${paymentId}_${emailType}`;

  // 1. Idempotency Check in Firestore
  if (db && paymentId) {
    try {
      const existingLog = await db.collection("email_notifications").doc(idempotencyKey).get();
      if (existingLog.exists && existingLog.data()?.deliveryStatus === "SENT") {
        console.log(`[Email Idempotency] Email already sent for payment ${paymentId}. Skipping.`);
        return { success: true, alreadySent: true, messageId: existingLog.data()?.providerMessageId };
      }
    } catch (checkErr: any) {
      console.warn("[Email Idempotency Check Warning]:", checkErr.message);
    }
  }

  const subject = params.isRenewal
    ? "Subscription Renewed Successfully – VISROSLOT"
    : "Payment Successful – Welcome to VISROSLOT!";
  const html = buildPaymentEmailHtml(params);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "VISROSLOT <onboarding@resend.dev>";

  // 2. Fallback if Resend API key is not yet set in production
  if (!resendApiKey || resendApiKey.includes("placeholder")) {
    console.log(
      `[Transactional Email System] RESEND_API_KEY not configured. Transaction verified for ${params.customerEmail} (${paymentId}).`
    );

    if (db) {
      try {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          paymentId,
          customerUid: params.customerUid || null,
          customerEmail: params.customerEmail,
          emailType,
          deliveryStatus: "PENDING_CONFIG",
          reason: "RESEND_API_KEY environment variable required for live SMTP dispatch",
          createdAt: new Date().toISOString(),
        });
      } catch (logErr) {}
    }

    return {
      success: true,
      error: "RESEND_API_KEY not configured. Notification recorded in database.",
    };
  }

  // 3. Dispatch via Resend REST API
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.customerEmail],
        subject,
        html,
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("[Email Dispatch Error from Resend]:", resData);
      if (db) {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          paymentId,
          customerUid: params.customerUid || null,
          customerEmail: params.customerEmail,
          emailType,
          deliveryStatus: "FAILED",
          error: resData?.message || "Provider error",
          createdAt: new Date().toISOString(),
        });
      }
      return { success: false, error: resData?.message || "Email dispatch failed" };
    }

    const providerMessageId = resData.id;

    if (db) {
      await db.collection("email_notifications").doc(idempotencyKey).set({
        paymentId,
        customerUid: params.customerUid || null,
        customerEmail: params.customerEmail,
        emailType,
        deliveryStatus: "SENT",
        providerMessageId,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`[Email Dispatched] Confirmation sent to ${params.customerEmail} (ID: ${providerMessageId})`);
    return { success: true, messageId: providerMessageId };
  } catch (err: any) {
    console.error("[Email Exception]:", err);
    if (db) {
      try {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          paymentId,
          customerUid: params.customerUid || null,
          customerEmail: params.customerEmail,
          emailType,
          deliveryStatus: "FAILED",
          error: err.message,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {}
    }
    return { success: false, error: err.message };
  }
}
