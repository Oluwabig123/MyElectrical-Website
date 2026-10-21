import { NextResponse } from "next/server";
import { runConsultationOrchestrator } from "@/lib/ai/consultation-orchestrator";
import type { ConsultationState } from "@/lib/ai/consultation-state";
import type { ConsultationIntentContext } from "@/lib/ai/intent-context";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 1500;

function clampMessages(rawMessages: unknown) {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages.slice(-MAX_MESSAGES).map((item) => {
    if (!item || typeof item !== "object") return item;
    const record = item as Record<string, unknown>;
    return {
      ...record,
      text: typeof record.text === "string" ? record.text.slice(0, MAX_MESSAGE_CHARS) : record.text,
      content:
        typeof record.content === "string"
          ? record.content.slice(0, MAX_MESSAGE_CHARS)
          : record.content,
    };
  });
}

function buildStatusCode(errorMessage: string) {
  if (/missing openai|missing supabase|not configured/i.test(errorMessage)) return 503;
  if (/embedding|openai|semantic search/i.test(errorMessage)) return 502;
  if (/empty chat|no user message/i.test(errorMessage)) return 400;
  return 500;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    request,
    routeKey: "assistant-chat",
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "You are sending messages too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => ({}));
  const payload = body && typeof body === "object" ? body : {};

  const messages = payload as { messages?: unknown };
  const intentContext = (payload as { intentContext?: unknown }).intentContext as
    | ConsultationIntentContext
    | undefined;
  const consultationState = (payload as { consultationState?: unknown }).consultationState as
    | ConsultationState
    | undefined;

  try {
    const safeMessages = clampMessages(messages.messages);
    const result = await runConsultationOrchestrator({
      messages: safeMessages as never,
      intentContext,
      state: consultationState,
    });

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources,
      usedKnowledgeBase: result.usedKnowledgeBase,
      recommendation: result.recommendation,
      consultationState: result.state,
      quoteIntentDetected: result.quoteIntentDetected,
      consultationGuide: result.consultationGuide,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sorry, the assistant could not complete this request.";

    return NextResponse.json(
      {
        error: /empty chat|no user message/i.test(message)
          ? "Please enter a message before sending."
          : message,
      },
      { status: buildStatusCode(message) },
    );
  }
}
