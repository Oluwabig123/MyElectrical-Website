import { NextResponse } from "next/server";
import { runConsultationOrchestrator } from "@/lib/ai/consultation-orchestrator";
import type { ConsultationState } from "@/lib/ai/consultation-state";
import type { ConsultationIntentContext } from "@/lib/ai/intent-context";

function buildStatusCode(errorMessage: string) {
  if (/missing openai|missing supabase|not configured/i.test(errorMessage)) return 503;
  if (/embedding|openai|semantic search/i.test(errorMessage)) return 502;
  if (/empty chat|no user message/i.test(errorMessage)) return 400;
  return 500;
}

export async function POST(request: Request) {
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
    const result = await runConsultationOrchestrator({
      messages: (Array.isArray(messages.messages) ? messages.messages : []) as never,
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
