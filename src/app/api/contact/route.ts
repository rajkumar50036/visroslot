import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      businessName,
      instagram,
      interestedPlan,
      message,
    } = body;

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Name and at least one contact channel (email or phone) are required." },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1);

    const leadRecord = {
      lead_source: "website_enquiry",
      business_name: businessName || "",
      contact_person: name.trim(),
      phone: phone ? phone.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      instagram_profile: instagram ? instagram.trim() : "",
      interested_plan: interestedPlan || "professional",
      message: message ? message.trim() : "",
      lead_status: "new", // "new" | "contacted" | "qualified" | "closed_won" | "lost"
      follow_up_date: followUpDate.toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await db.collection("leads").add(leadRecord);

    return NextResponse.json({
      success: true,
      leadId: docRef.id,
      message: "Lead created successfully in VisroSlot CRM.",
    });
  } catch (error: any) {
    console.error("Error creating contact lead:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
