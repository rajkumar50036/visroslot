import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getPlatformBaseUrl } from "@/lib/config/domain";

export interface AppointmentNotificationData {
  appointmentId: string;
  bookingReference: string;
  businessId: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  servicePrice: number;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  staffName?: string | null;
  managementToken?: string | null;
  cancellationReason?: string;
  previousDate?: string;
  previousTime?: string;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

function formatDisplayTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * Builds the branded VISROSLOT appointment email template.
 */
function buildAppointmentEmailHtml(
  type: "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "REMINDER" | "REVIEW_INVITATION",
  data: AppointmentNotificationData
): { subject: string; html: string } {
  const formattedDate = formatDisplayDate(data.appointmentDate);
  const formattedTime = `${formatDisplayTime(data.startTime)} - ${formatDisplayTime(data.endTime)}`;
  const staff = data.staffName || "Team Specialist";
  const baseUrl = getPlatformBaseUrl();
  const manageUrl = data.managementToken
    ? `${baseUrl}/book/manage/${data.managementToken}`
    : baseUrl;
  const reviewUrl = data.managementToken
    ? `${baseUrl}/review/${data.managementToken}`
    : baseUrl;

  let badgeText = "Confirmed";
  let badgeBg = "#ECFDF5";
  let badgeColor = "#065F46";
  let headline = `Your Appointment with ${data.businessName} is Confirmed`;
  let leadText = `Hello ${data.customerName}, your appointment has been confirmed. Below are your appointment details.`;
  let subject = `Appointment Confirmed: ${data.serviceName} at ${data.businessName}`;

  if (type === "RESCHEDULED") {
    badgeText = "Rescheduled";
    badgeBg = "#EFF6FF";
    badgeColor = "#1E40AF";
    headline = `Your Appointment has been Rescheduled`;
    leadText = `Hello ${data.customerName}, your appointment with ${data.businessName} has been rescheduled to a new time.`;
    subject = `Appointment Rescheduled: ${data.serviceName} at ${data.businessName}`;
  } else if (type === "CANCELLED") {
    badgeText = "Cancelled";
    badgeBg = "#FEF2F2";
    badgeColor = "#991B1B";
    headline = `Appointment Cancellation Notice`;
    leadText = `Hello ${data.customerName}, your appointment with ${data.businessName} has been cancelled.${
      data.cancellationReason ? ` Reason: ${data.cancellationReason}` : ""
    }`;
    subject = `Appointment Cancelled: ${data.serviceName} at ${data.businessName}`;
  } else if (type === "COMPLETED") {
    badgeText = "Completed";
    badgeBg = "#F0FDF4";
    badgeColor = "#166534";
    headline = `Thank you for visiting ${data.businessName}!`;
    leadText = `Hello ${data.customerName}, thank you for your appointment with us today. We hope you had a great experience! We'd love if you could leave a quick review.`;
    subject = `Thank you for your visit – ${data.businessName}`;
  } else if (type === "REVIEW_INVITATION") {
    badgeText = "Customer Review";
    badgeBg = "#FEF3C7";
    badgeColor = "#92400E";
    headline = `How was your experience at ${data.businessName}?`;
    leadText = `Hello ${data.customerName}, your opinion matters to us! Please take a quick moment to rate your completed appointment for ${data.serviceName}.`;
    subject = `Rate your experience at ${data.businessName} (1 - 5 Stars)`;
  } else if (type === "REMINDER") {
    badgeText = "Reminder";
    badgeBg = "#FFFBEB";
    badgeColor = "#92400E";
    headline = `Upcoming Appointment Reminder`;
    leadText = `Hello ${data.customerName}, this is a friendly reminder of your upcoming appointment with ${data.businessName}.`;
    subject = `Reminder: Upcoming Appointment at ${data.businessName}`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7F5F0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #101A2B; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F7F5F0; padding: 36px 0; }
    .main { background-color: #FFFFFF; margin: 0 auto; width: 100%; max-width: 580px; border-radius: 20px; overflow: hidden; border: 1px solid #E8E5DD; box-shadow: 0 4px 18px rgba(16, 26, 43, 0.05); }
    .header { background-color: #101A2B; padding: 30px 40px; text-align: center; }
    .logo-text { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin: 0; }
    .logo-gold { color: #C49A46; }
    .tagline { color: #D9B66E; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 5px; }
    .content { padding: 36px 40px; }
    .badge { display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .h1 { font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 800; color: #101A2B; margin: 0 0 12px 0; line-height: 1.3; }
    .intro { font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0; }
    .card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px; margin-bottom: 24px; }
    .card-title { font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #C49A46; margin: 0 0 14px 0; }
    .table { width: 100%; font-size: 13px; }
    .table td { padding: 7px 0; border-bottom: 1px solid #EDF2F7; }
    .table tr:last-child td { border-bottom: none; }
    .label { color: #64748B; font-weight: 500; width: 40%; }
    .val { color: #0F172A; font-weight: 700; text-align: right; }
    .val-accent { color: #C49A46; font-weight: 800; }
    .btn-container { text-align: center; margin: 28px 0 16px 0; }
    .btn { display: inline-block; background-color: #101A2B; color: #FFFFFF !important; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 14px 28px; border-radius: 12px; }
    .btn-gold { background-color: #C49A46; color: #0B1425 !important; }
    .footer { background-color: #101A2B; padding: 24px 40px; text-align: center; font-size: 11px; color: #94A3B8; }
    .footer-link { color: #C49A46; text-decoration: none; }
    .star-row { text-align: center; font-size: 24px; color: #C49A46; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <h1 class="logo-text">VISRO<span class="logo-gold">SLOT</span></h1>
          <div class="tagline">EVERY SLOT. SIMPLIFIED.</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="badge">${badgeText}</div>
          <h2 class="h1">${headline}</h2>
          <p class="intro">${leadText}</p>

          ${
            type === "COMPLETED" || type === "REVIEW_INVITATION"
              ? `<div class="star-row">&#9733; &#9733; &#9733; &#9733; &#9733;</div>`
              : ""
          }

          <div class="card">
            <div class="card-title">Appointment Summary</div>
            <table class="table">
              <tr>
                <td class="label">Reference</td>
                <td class="val font-mono">${data.bookingReference}</td>
              </tr>
              <tr>
                <td class="label">Business</td>
                <td class="val">${data.businessName}</td>
              </tr>
              <tr>
                <td class="label">Service</td>
                <td class="val">${data.serviceName}</td>
              </tr>
              <tr>
                <td class="label">Specialist</td>
                <td class="val">${staff}</td>
              </tr>
              <tr>
                <td class="label">Date</td>
                <td class="val">${formattedDate}</td>
              </tr>
              <tr>
                <td class="label">Time</td>
                <td class="val val-accent">${formattedTime}</td>
              </tr>
              <tr>
                <td class="label">Service Fee</td>
                <td class="val">₹${Number(data.servicePrice || 0).toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </div>

          ${
            type === "COMPLETED" || type === "REVIEW_INVITATION"
              ? `<div class="btn-container">
                   <a href="${reviewUrl}" target="_blank" class="btn btn-gold">
                     &#9733; Submit Your Review &rarr;
                   </a>
                 </div>
                 <div style="text-align: center; margin-top: 10px;">
                   <a href="${manageUrl}" target="_blank" style="font-size: 12px; color: #64748B; text-decoration: underline;">
                     View Booking Receipt & Details
                   </a>
                 </div>`
              : type !== "CANCELLED"
              ? `<div class="btn-container">
                   <a href="${manageUrl}" target="_blank" class="btn">
                     Manage Appointment &rarr;
                   </a>
                 </div>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px 0;">
            ${data.businessName} &bull; Powered by VISROSLOT
          </p>
          <p style="margin: 0; opacity: 0.8;">
            <a href="${baseUrl}" class="footer-link">VISROSLOT Platform</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  return { subject, html };
}

/**
 * Dispatches an appointment notification with server-side idempotency in Firestore.
 */
export async function sendAppointmentNotification(
  type: "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "REMINDER" | "REVIEW_INVITATION",
  data: AppointmentNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string; alreadySent?: boolean }> {
  if (!data.customerEmail) {
    return { success: false, error: "Customer email is required" };
  }

  const { db } = getFirebaseAdmin();
  const idempotencyKey = `appt_notif_${data.appointmentId}_${type.toLowerCase()}`;

  // 1. Idempotency Check in Firestore
  if (db) {
    try {
      const existing = await db.collection("email_notifications").doc(idempotencyKey).get();
      if (existing.exists && existing.data()?.deliveryStatus === "SENT") {
        console.log(`[Idempotency] ${type} notification already sent for appt ${data.appointmentId}. Skipping.`);
        return { success: true, alreadySent: true, messageId: existing.data()?.providerMessageId };
      }
    } catch (checkErr: any) {
      console.warn("[Idempotency Warning]:", checkErr.message);
    }
  }

  const { subject, html } = buildAppointmentEmailHtml(type, data);
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "VISROSLOT <appointments@resend.dev>";

  // 2. Fallback if Resend API key is not yet set in production
  if (!resendApiKey || resendApiKey.includes("placeholder")) {
    console.log(
      `[Appointment Notification] RESEND_API_KEY not configured. Recorded ${type} notification for ${data.customerEmail}.`
    );

    if (db) {
      try {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          customerEmail: data.customerEmail,
          notificationType: type,
          subject,
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
        to: [data.customerEmail],
        subject,
        html,
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("[Appointment Email Error from Resend]:", resData);
      if (db) {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          customerEmail: data.customerEmail,
          notificationType: type,
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
        appointmentId: data.appointmentId,
        businessId: data.businessId,
        customerEmail: data.customerEmail,
        notificationType: type,
        deliveryStatus: "SENT",
        providerMessageId,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`[Appointment Email Dispatched] Sent ${type} to ${data.customerEmail} (ID: ${providerMessageId})`);
    return { success: true, messageId: providerMessageId };
  } catch (err: any) {
    console.error("[Appointment Email Exception]:", err);
    if (db) {
      try {
        await db.collection("email_notifications").doc(idempotencyKey).set({
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          customerEmail: data.customerEmail,
          notificationType: type,
          deliveryStatus: "FAILED",
          error: err.message,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {}
    }
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an idempotent review invitation to the client upon appointment completion.
 */
export async function sendReviewInvitation(
  data: AppointmentNotificationData
): Promise<{ success: boolean; error?: string; alreadySent?: boolean }> {
  const { db } = getFirebaseAdmin();
  const inviteDocId = `rev_invite_${data.appointmentId}`;

  if (db) {
    try {
      const inviteSnap = await db.collection("review_invitations").doc(inviteDocId).get();
      if (inviteSnap.exists) {
        return { success: true, alreadySent: true };
      }

      const baseUrl = getPlatformBaseUrl();
      const reviewUrl = data.managementToken
        ? `${baseUrl}/review/${data.managementToken}`
        : baseUrl;

      const hasResend = Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder"));

      await db.collection("review_invitations").doc(inviteDocId).set({
        id: inviteDocId,
        appointment_id: data.appointmentId,
        business_id: data.businessId,
        customer_name: data.customerName,
        customer_email: data.customerEmail || null,
        customer_phone: data.customerPhone || null,
        service_name: data.serviceName,
        management_token: data.managementToken || null,
        review_url: reviewUrl,
        status: hasResend ? "SENT" : "PENDING_CONFIG",
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn("[Review Invitation Warning]:", err.message);
    }
  }

  // Also dispatch email notification if customer email exists
  if (data.customerEmail) {
    return sendAppointmentNotification("REVIEW_INVITATION", data);
  }

  return { success: true };
}
