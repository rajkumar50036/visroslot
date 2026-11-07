import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { BusinessAIMemory, ConfirmedInstruction } from "@/types/database";

export const dynamic = "force-dynamic";

async function verifyOwnerBusiness(req: NextRequest, db: any) {
  const authCookie =
    req.cookies.get("visroslot_session")?.value ||
    req.cookies.get("slotora_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!authCookie) return { authorized: false, error: "UNAUTHORIZED", status: 401 };

  const userId = authCookie;
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const userEmail = (userData?.email || "").toLowerCase().trim();
  const isPlatformOwner = userEmail === OWNER_EMAIL;

  let busSnap = await db.collection("businesses").where("owner_id", "==", userId).limit(1).get();
  if (busSnap.empty && userEmail) {
    busSnap = await db.collection("businesses").where("owner_email", "==", userEmail).limit(1).get();
  }
  if (busSnap.empty && isPlatformOwner) {
    busSnap = await db.collection("businesses").limit(1).get();
  }
  if (busSnap.empty) return { authorized: false, error: "BUSINESS_NOT_FOUND", status: 404 };

  const bDoc = busSnap.docs[0];
  return { authorized: true, businessId: bDoc.id, business: bDoc.data(), userId, userEmail };
}

// GET: Retrieve business AI memory
export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId, business } = authCheck;
    const memDoc = await db.collection("business_ai_memory").doc(`mem_${businessId}`).get();

    if (!memDoc.exists) {
      // Default initial memory based on business profile
      const initialMemory: BusinessAIMemory = {
        id: `mem_${businessId}`,
        business_id: businessId,
        business_name: business.name || "My Business",
        business_category: business.category || "Professional Services",
        monthly_revenue_target: 50000,
        customer_growth_target: 20,
        challenges: ["Filling open slots during off-peak hours"],
        priorities: ["Increasing repeat customer retention"],
        marketing_style: "growth",
        promotion_preferences: "Modest 10-15% discount for first-time or rebooking clients",
        communication_tone: "professional",
        target_customers: "Local appointment-seeking clients",
        confirmed_instructions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.collection("business_ai_memory").doc(`mem_${businessId}`).set(initialMemory);
      return NextResponse.json({ success: true, memory: initialMemory });
    }

    return NextResponse.json({ success: true, memory: memDoc.data() });
  } catch (err: any) {
    console.error("[Get AI Memory Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// PUT: Update business AI memory & confirmed instructions
export async function PUT(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const body = await req.json().catch(() => ({}));
    const nowIso = new Date().toISOString();

    const memDocRef = db.collection("business_ai_memory").doc(`mem_${businessId}`);
    const existing = await memDocRef.get();
    const existingData: Record<string, any> = existing.data() || {};

    // Merge updated preferences
    const updatedMemory: any = {
      ...existingData,
      id: `mem_${businessId}`,
      business_id: businessId,
      monthly_revenue_target: Number(body.monthly_revenue_target) || existingData.monthly_revenue_target || 50000,
      customer_growth_target: Number(body.customer_growth_target) || existingData.customer_growth_target || 20,
      marketing_style: body.marketing_style || existingData.marketing_style || "growth",
      communication_tone: body.communication_tone || existingData.communication_tone || "professional",
      promotion_preferences: body.promotion_preferences || existingData.promotion_preferences || "",
      target_customers: body.target_customers || existingData.target_customers || "",
      challenges: Array.isArray(body.challenges) ? body.challenges : existingData.challenges || [],
      priorities: Array.isArray(body.priorities) ? body.priorities : existingData.priorities || [],
      updated_at: nowIso,
    };

    // If new confirmed instruction was provided
    if (body.new_instruction && typeof body.new_instruction === "string" && body.new_instruction.trim()) {
      const newInst: ConfirmedInstruction = {
        id: `inst_${Date.now()}`,
        instruction: body.new_instruction.trim(),
        source: body.instruction_source || "settings",
        created_at: nowIso,
        updated_at: nowIso,
      };
      const list = Array.isArray(updatedMemory.confirmed_instructions)
        ? [...updatedMemory.confirmed_instructions, newInst]
        : [newInst];
      updatedMemory.confirmed_instructions = list;
    } else if (Array.isArray(body.confirmed_instructions)) {
      updatedMemory.confirmed_instructions = body.confirmed_instructions;
    }

    await memDocRef.set(updatedMemory, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Business AI memory updated successfully.",
      memory: updatedMemory,
    });
  } catch (err: any) {
    console.error("[Update AI Memory Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}

// DELETE: Remove specific confirmed instruction
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructionId = searchParams.get("instructionId");

    if (!instructionId) {
      return NextResponse.json({ error: "INSTRUCTION_ID_REQUIRED" }, { status: 400 });
    }

    const { db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 500 });

    const authCheck = await verifyOwnerBusiness(req, db);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { businessId } = authCheck;
    const memDocRef = db.collection("business_ai_memory").doc(`mem_${businessId}`);
    const memSnap = await memDocRef.get();

    if (!memSnap.exists) {
      return NextResponse.json({ error: "MEMORY_NOT_FOUND" }, { status: 404 });
    }

    const data = memSnap.data();
    const list: ConfirmedInstruction[] = Array.isArray(data?.confirmed_instructions)
      ? data.confirmed_instructions.filter((i: any) => i.id !== instructionId)
      : [];

    await memDocRef.update({
      confirmed_instructions: list,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Instruction removed from AI memory." });
  } catch (err: any) {
    console.error("[Delete Instruction Error]:", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
