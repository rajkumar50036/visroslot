import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Management token required" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const apptQuery = await db
      .collection("appointments")
      .where("management_token", "==", token)
      .limit(1)
      .get();

    if (apptQuery.empty) {
      return NextResponse.json({ error: "Appointment not found or expired" }, { status: 404 });
    }

    const apptDoc = apptQuery.docs[0];
    const apptData: any = { id: apptDoc.id, ...apptDoc.data() };

    // Fetch business details
    let businessName = "Service Provider";
    if (apptData.business_id) {
      const bDoc = await db.collection("businesses").doc(apptData.business_id).get();
      if (bDoc.exists) {
        businessName = bDoc.data()?.name || businessName;
      }
    }

    return NextResponse.json({
      success: true,
      appointment: apptData,
      businessName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load appointment" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, newDate, newStartTime, newEndTime } = body;

    if (!token) {
      return NextResponse.json({ error: "Management token required" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const apptQuery = await db
      .collection("appointments")
      .where("management_token", "==", token)
      .limit(1)
      .get();

    if (apptQuery.empty) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const apptDoc = apptQuery.docs[0];

    if (action === "cancel") {
      await apptDoc.ref.update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, message: "Appointment cancelled successfully." });
    }

    if (action === "reschedule") {
      if (!newDate || !newStartTime || !newEndTime) {
        return NextResponse.json({ error: "New date and times required" }, { status: 400 });
      }

      await apptDoc.ref.update({
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        status: "CONFIRMED",
        rescheduled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: "Appointment rescheduled successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
