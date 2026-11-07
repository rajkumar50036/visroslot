/**
 * VISROSLOT AI – OpenRouter Server-Side Gateway Client
 * 
 * Secure server-side interface for OpenRouter LLMs.
 * Powers Owner AI (Command Center) and Customer AI (Conversational Booking).
 * 
 * Security: This module runs ONLY on the server. Never import in client components.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface AIOptions {
  messages: AIMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export const VISRO_AI_MODELS = {
  DEFAULT_FAST: "google/gemini-2.0-flash-001",
  DEFAULT_INTELLIGENT: "anthropic/claude-3.5-sonnet",
  DEFAULT_LLAMA: "meta-llama/llama-3.3-70b-instruct",
};

export function getOpenRouterApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

export async function callVisroSlotAI({
  messages,
  systemPrompt,
  model = VISRO_AI_MODELS.DEFAULT_FAST,
  temperature = 0.3,
  maxTokens = 1000,
}: AIOptions): Promise<{ content: string; model: string; usage?: any }> {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey || apiKey.includes("placeholder")) {
    throw new Error(
      "VISROSLOT AI gateway is not configured. Missing OPENROUTER_API_KEY in server environment."
    );
  }

  const finalMessages: AIMessage[] = [];
  if (systemPrompt) {
    finalMessages.push({ role: "system", content: systemPrompt });
  }
  finalMessages.push(...messages);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://visroslot.pages.dev",
      "X-Title": "VISROSLOT SaaS Platform",
    },
    body: JSON.stringify({
      model,
      messages: finalMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown gateway error");
    console.error("[VISROSLOT AI Gateway Error]:", res.status, errText);
    throw new Error(`VISROSLOT AI gateway responded with HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const reply = choice?.message?.content || "";

  return {
    content: reply,
    model: data.model || model,
    usage: data.usage,
  };
}
