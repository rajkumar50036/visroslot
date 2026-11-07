import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { CustomerPreferences } from "@/types/database";

export const dynamic = "force-dynamic";

function normalizePhone(p: string): string {
  const digits = (p || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// GET: Retrieve customer preferences for this business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const phone = searchParams.get("phone");

    if (!businessId || !phone) {
      return NextResponse.json({ error: "businessId and phone required" }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const prefDoc = await db.collection("customer_ai_preferences").doc(`pref_${businessId}_${cleanPhone}`).get();

    if (!prefDoc.exists) {
      return NextResponse.json({ success: true, preferences: null });
    }

    return NextResponse.json({
      success: true,
      preferences: prefDoc.data() as CustomerPreferences,
    });
  } catch (err: any) {
    console.error("[Customer Preferences GET Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// POST: Save or update customer preferences with explicit consent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.businessId || !body.phone) {
      return NextResponse.json({ error: "businessId and phone required" }, { status: 400 });
    }

    const {
      businessId,
      phone,
      consentGiven,
      preferredServiceId,
      preferredServiceName,
      preferredStaffId,
      preferredStaffName,
      preferredTimeOfDay,
    } = body;

    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    const prefId = `pref_${businessId}_${cleanPhone}`;
    const nowIso = new Date().toISOString();

    if (consentGiven === false) {
      // If customer revoked consent, delete preference record
      await db.collection("customer_ai_preferences").doc(prefId).delete();
      return NextResponse.json({ success: true, message: "Preferences cleared and consent revoked." });
    }

    const prefData: CustomerPreferences = {
      id: prefId,
      business_id: businessId,
      customer_phone: cleanPhone,
      preferred_service_id: preferredServiceId || null,
      preferred_service_name: preferredServiceName || null,
      preferred_staff_id: preferredStaffId || null,
      preferred_staff_name: preferredStaffName || null,
      preferred_time_of_day: preferredTimeOfDay || "ANY",
      consent_given: true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.collection("customer_ai_preferences").doc(prefId).set(prefData, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Customer booking preferences saved with consent.",
      preferences: prefData,
    });
  } catch (err: any) {
    console.error("[Customer Preferences POST Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// DELETE: Forget / delete customer preferences
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const phone = searchParams.get("phone");

    if (!businessId || !phone) {
      return NextResponse.json({ error: "businessId and phone required" }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

    await db.collection("customer_ai_preferences").doc(`pref_${businessId}_${cleanPhone}`).delete();

    return NextResponse.json({ success: true, message: "Saved preferences successfully deleted." });
  } catch (err: any) {
    console.error("[Customer Preferences DELETE Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
