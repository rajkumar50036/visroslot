import { NextResponse } from "next/server";
import { getOpenRouterApiKey, VISRO_AI_MODELS } from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasKey = !!getOpenRouterApiKey();
  return NextResponse.json({
    status: "ok",
    aiService: "VISROSLOT AI",
    engine: "VISROSLOT Intelligent Engine",
    isConfigured: hasKey,
    defaultModels: {
      fast: VISRO_AI_MODELS.DEFAULT_FAST,
      intelligent: VISRO_AI_MODELS.DEFAULT_INTELLIGENT,
    },
    capabilities: [
      "Owner AI (Command Center operations, performance summaries)",
      "Customer AI (Conversational service matching & availability)",
    ],
  });
}
