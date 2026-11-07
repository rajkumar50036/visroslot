import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { callVisroSlotAI, VISRO_AI_MODELS } from "@/lib/ai/openrouter";
import {
  getCustomerBusinessSnapshot,
  buildCustomerAiSystemPrompt,
  getAlgorithmicCustomerResponse,
  extractSuggestionChips,
} from "@/lib/ai/customerAiEngine";
import { CustomerPreferences } from "@/types/database";

export const dynamic = "force-dynamic";

// In-memory rate limiting map for customer chat (protects against automated abuse)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.expiresAt < now) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    if (!checkRateLimit(`chat_${ip}`)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "You are sending messages too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.businessId || !body.message) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "businessId and message are required." },
        { status: 400 }
      );
    }

    const { businessId, message, history = [], customerPhone, consentGiven } = body;

    // 1. Retrieve Business Snapshot
    let snapshot;
    try {
      snapshot = await getCustomerBusinessSnapshot(businessId);
    } catch (e: any) {
      return NextResponse.json({ error: "BUSINESS_NOT_FOUND", message: e.message }, { status: 404 });
    }

    // 2. Load customer preferences if consented and phone is available
    let preferences: CustomerPreferences | null = null;
    const { db } = getFirebaseAdmin();
    if (db && customerPhone && consentGiven) {
      try {
        const cleanPhone = String(customerPhone).replace(/\D/g, "");
        if (cleanPhone.length >= 10) {
          const prefDoc = await db.collection("customer_ai_preferences").doc(`pref_${businessId}_${cleanPhone}`).get();
          if (prefDoc.exists) {
            preferences = prefDoc.data() as CustomerPreferences;
          }
        }
      } catch (prefErr) {
        console.warn("Could not load customer preferences:", prefErr);
      }
    }

    // 3. Build System Prompt grounded strictly in real business data
    const systemPrompt = buildCustomerAiSystemPrompt(snapshot, preferences);

    // 4. Format chat history
    const aiMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      ...history.slice(-6).map((h: any) => ({
        role: h.role === "user" ? ("user" as const) : ("assistant" as const),
        content: String(h.content || ""),
      })),
      { role: "user" as const, content: String(message) },
    ];

    let replyContent = "";
    let usedModel = "algorithmic-advisor";
    let isLiveLlm = false;

    // 5. Attempt OpenRouter LLM Call
    try {
      const openRouterResult = await callVisroSlotAI({
        messages: aiMessages,
        systemPrompt,
        model: VISRO_AI_MODELS.DEFAULT_FAST,
        temperature: 0.25,
        maxTokens: 500,
      });

      replyContent = openRouterResult.content;
      usedModel = openRouterResult.model;
      isLiveLlm = true;

      // Optional async usage logging
      if (db) {
        db.collection("ai_usage_logs")
          .add({
            business_id: businessId,
            type: "CUSTOMER_AI_CHAT",
            model: usedModel,
            ip,
            created_at: new Date().toISOString(),
          })
          .catch(() => {});
      }
    } catch (llmErr: any) {
      console.warn("[Customer AI OpenRouter Gateway Falling Back]:", llmErr.message);
      // Fall back to deterministic, hallucination-free advisor
      replyContent = getAlgorithmicCustomerResponse(message, snapshot);
    }

    // 6. Generate contextual clickable suggestion chips
    const suggestionChips = extractSuggestionChips(message, replyContent, snapshot);

    return NextResponse.json({
      success: true,
      reply: replyContent,
      suggestionChips,
      usedModel,
      isLiveLlm,
      businessName: snapshot.businessName,
    });
  } catch (error: any) {
    console.error("[Customer AI Chat Handler Error]:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message || "Failed to process chat message." },
      { status: 500 }
    );
  }
}
