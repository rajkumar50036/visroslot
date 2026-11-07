import { NextRequest, NextResponse } from "next/server";
import { callVisroSlotAI, VISRO_AI_MODELS } from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

const LANDING_AI_SYSTEM_PROMPT = `You are VISROSLOT AI Assistant, the friendly, professional customer concierge on the official VISROSLOT platform website.
Tagline: EVERY SLOT. SIMPLIFIED.

Your purpose is to answer prospective customers' and business owners' questions about VISROSLOT with accurate, helpful, and concise information:

1. PRODUCT OVERVIEW:
   - VISROSLOT is a modern, high-performance appointment and slot booking SaaS platform for salons, clinics, spas, fitness studios, tutors, and professional consultants.
   - Provides public booking links (e.g. /book/your-business), QR code generation, multi-staff calendar matrix, customer CRM, and verified review management.

2. PRICING & TRIAL:
   - 7-Day Free Trial included for all new businesses upon verifying an AutoPay mandate.
   - Professional Plan: ₹499/month (or ₹4,990/year with 2 months free). Includes 3 staff members, 300 bookings/month, automated reminders, and calendar matrix.
   - Business Suite: ₹999/month (or ₹9,990/year). Includes 10 staff members, UNLIMITED bookings, Owner AI Business Manager, VIP client tracking, and custom branding.
   - AutoPay Verification: Uses a nominal ₹2 refundable verification mandate via Razorpay to activate the free trial. Commercial plan payments only begin after the 7-day trial.

3. SPECIAL FEATURES:
   - Owner AI: An executive business intelligence manager analyzing revenue leaks, staff workload, and client retention.
   - Customer AI: Natural-language booking assistant allowing clients to book, explore services, reschedule, or cancel via plain text chat.
   - Background Phone Alarms: Loud booking chimes and lockscreen push notifications delivered via Service Worker even when the website is closed and phone is locked.
   - Live Demo: Visitors can test the booking experience anytime at /book/demo-salon.

GUIDELINES:
- Keep answers concise (2-4 sentences max per point).
- Provide clickable Markdown links where appropriate: [Register](/register), [Pricing](/#pricing), [Try Demo Salon](/book/demo-salon).
- Do not mention third-party AI gateway vendors (OpenRouter, Google, etc.); simply present yourself as VISROSLOT AI.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.message) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "message is required" },
        { status: 400 }
      );
    }

    const { message, history = [] } = body;

    // Fast keyword-based intelligent fallback for zero-latency responses
    const lower = message.toLowerCase();
    let reply = "";
    let suggestionChips: Array<{ label: string; action: string; url?: string }> = [];

    if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("rate")) {
      reply = "VISROSLOT offers two transparent plans with a 7-day free trial:\n\n• **Professional (₹499/mo)**: 3 staff members, 300 bookings/month, full calendar matrix & reminders.\n• **Business Suite (₹999/mo)**: 10 staff members, unlimited bookings, Owner AI business manager & priority support.\n\nAll plans include a 7-day trial with a refundable ₹2 AutoPay verification.";
      suggestionChips = [
        { label: "View Pricing Table", action: "NAVIGATE", url: "/#pricing" },
        { label: "Start Free Trial", action: "NAVIGATE", url: "/register" },
      ];
    } else if (lower.includes("demo") || lower.includes("try") || lower.includes("sample") || lower.includes("test")) {
      reply = "You can test our live customer booking experience and Customer AI right now on our flagship demo salon page: [VISROSLOT Demo Salon & Wellness](/book/demo-salon).\n\nTry exploring haircuts, facial treatments, or chatting with the AI assistant!";
      suggestionChips = [
        { label: "Open Demo Salon", action: "NAVIGATE", url: "/book/demo-salon" },
        { label: "Create Your Account", action: "NAVIGATE", url: "/register" },
      ];
    } else if (lower.includes("trial") || lower.includes("free") || lower.includes("autopay") || lower.includes("₹2")) {
      reply = "Every new business gets a **full 7-day free trial**. To prevent fraudulent accounts and enable seamless renewals, Razorpay authorizes a ₹2 refundable verification mandate. You are not charged for the subscription until your 7-day trial concludes.";
      suggestionChips = [
        { label: "Start 7-Day Trial", action: "NAVIGATE", url: "/register" },
        { label: "Explore Features", action: "NAVIGATE", url: "/features" },
      ];
    } else if (lower.includes("sound") || lower.includes("notification") || lower.includes("alarm") || lower.includes("close")) {
      reply = "VISROSLOT features loud audio chimes and lock-screen Web Push notifications. Using our Background Service Worker, you receive urgent sound and vibration alerts when an appointment is booked—**even when the website is closed and your phone screen is off**.";
      suggestionChips = [
        { label: "Test Sound in Demo", action: "NAVIGATE", url: "/book/demo-salon" },
        { label: "Get Started", action: "NAVIGATE", url: "/register" },
      ];
    } else {
      // Attempt LLM call if available
      try {
        const conversation = [
          { role: "system" as const, content: LANDING_AI_SYSTEM_PROMPT },
          ...history.slice(-4),
          { role: "user" as const, content: message },
        ];
        const res = await callVisroSlotAI({
          messages: conversation,
          model: VISRO_AI_MODELS.DEFAULT_FAST,
          temperature: 0.6,
          maxTokens: 350,
        });
        reply = res.content;
      } catch (e) {
        reply = "VISROSLOT simplifies appointment management for salons, clinics, spas, and consultants. You get an instant public booking page, multi-staff calendar matrix, automatic reminders, and AI business assistants. Would you like to view our pricing or try our demo?";
      }

      suggestionChips = [
        { label: "Explore Pricing (₹499/₹999)", action: "NAVIGATE", url: "/#pricing" },
        { label: "Try Demo Salon", action: "NAVIGATE", url: "/book/demo-salon" },
        { label: "Start 7-Day Free Trial", action: "NAVIGATE", url: "/register" },
      ];
    }

    return NextResponse.json({
      success: true,
      reply,
      suggestionChips,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
