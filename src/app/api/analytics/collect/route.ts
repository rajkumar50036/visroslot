import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorId, eventName, path, referrer, device } = body;

    // Strict Privacy & Marketing filter:
    // Exclude internal admin and business dashboard traffic from public marketing counts!
    if (
      !path ||
      path.startsWith("/app") ||
      path.startsWith("/super-admin") ||
      path.startsWith("/api") ||
      path.startsWith("/_next")
    ) {
      return NextResponse.json({ ignored: true });
    }

    const { db } = getFirebaseAdmin();
    if (db) {
      // Record light analytics event in Firestore
      await db.collection("analytics_events").add({
        visitor_id: visitorId || "anon",
        event_name: eventName || "page_view",
        path: path.slice(0, 120),
        referrer: (referrer || "direct").slice(0, 200),
        device: device || "unknown",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-blocking for clients
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
