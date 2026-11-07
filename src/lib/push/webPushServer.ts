import webpush from "web-push";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  "BI2EH1gv5YKOzvrbjzD3FQUYykSskonRNzCYdjC37nBspzoT7ZNeIWhGDQuUyLPE0aLyVtbNj3w8zDCl-AOukAg";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "RhBsvzibN_5MUiT_OXNa22eKtfpWvBvQOzou2CX-ZOU";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@visroslot.com";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e: any) {
  console.warn("WebPush VAPID setup warning:", e.message);
}

export interface BookingPushPayload {
  title: string;
  body: string;
  appointmentId?: string;
  url?: string;
  customerName?: string;
  serviceName?: string;
}

/**
 * Sends real-time Web Push notification to all devices registered for this business.
 * Works even when the website is closed and the phone screen is turned off.
 */
export async function sendBookingPushNotification(
  businessId: string,
  payload: BookingPushPayload
): Promise<number> {
  if (!businessId) return 0;

  const { db } = getFirebaseAdmin();
  if (!db) {
    console.warn("Database unavailable for push notification dispatch.");
    return 0;
  }

  try {
    const subsSnap = await db
      .collection("push_subscriptions")
      .where("business_id", "==", businessId)
      .get();

    if (subsSnap.empty) {
      return 0;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || "🔔 New Booking Confirmed!",
      body: payload.body || "A new customer has booked an appointment.",
      icon: "/assets/visroslot-logo.png",
      badge: "/assets/visroslot-logo.png",
      sound: "/sounds/booking-chime.wav",
      vibrate: [500, 200, 500, 200, 500, 200, 1000],
      url: payload.url || "/app/overview",
      appointmentId: payload.appointmentId || null,
      tag: `booking-${payload.appointmentId || Date.now()}`,
    });

    let successCount = 0;
    const deleteBatch = db.batch();
    let hasDeletes = false;

    await Promise.all(
      subsSnap.docs.map(async (docSnap) => {
        const subData = docSnap.data();
        const pushSubscription = subData.subscription;

        if (!pushSubscription || !pushSubscription.endpoint) {
          deleteBatch.delete(docSnap.ref);
          hasDeletes = true;
          return;
        }

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload, {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: "high", // High priority to wake up Android/iOS lock screens
          });
          successCount++;
        } catch (sendErr: any) {
          // If status is 404 (Not Found) or 410 (Gone), device unsubscribed
          if (sendErr.statusCode === 404 || sendErr.statusCode === 410) {
            deleteBatch.delete(docSnap.ref);
            hasDeletes = true;
          } else {
            console.warn(`Failed to send push to device ${docSnap.id}:`, sendErr.message);
          }
        }
      })
    );

    if (hasDeletes) {
      await deleteBatch.commit().catch(() => {});
    }

    return successCount;
  } catch (err: any) {
    console.warn("Error dispatching booking push notification:", err.message);
    return 0;
  }
}
