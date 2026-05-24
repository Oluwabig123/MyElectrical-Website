import { NextResponse } from "next/server";
import { generateAssistantChatReply } from "@/lib/assistant-rag";
import {
  runConsultationEngine,
  type ConsultationState,
} from "@/lib/ai/consultation-engine";
import type { ConsultationIntentContext } from "@/lib/ai/intent-context";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLatestUserMessage(messages: unknown) {
  if (!Array.isArray(messages)) return "";

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as { role?: unknown; content?: unknown; text?: unknown };
    const role = sanitizeText(message?.role).toLowerCase();
    if (role !== "user") continue;

    const content = sanitizeText(message?.content || message?.text);
    if (content) return content;
  }

  return "";
}

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
  const latestUserMessage = getLatestUserMessage(messages.messages);

  if (!latestUserMessage) {
    return NextResponse.json({ error: "Please enter a message before sending." }, { status: 400 });
  }

  const intentContext = (payload as { intentContext?: unknown }).intentContext as
    | ConsultationIntentContext
    | undefined;
  const consultationState = (payload as { consultationState?: unknown }).consultationState as
    | ConsultationState
    | undefined;

  if (intentContext || consultationState) {
    try {
      const result = await runConsultationEngine({
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
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sorry, the assistant could not complete this consultation.";

      return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
    }
  }

  try {
    const result = await generateAssistantChatReply(messages.messages);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources,
      usedKnowledgeBase: result.usedKnowledgeBase,
      quoteIntentDetected: result.quoteIntentDetected,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sorry, the assistant could not complete this request.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: buildStatusCode(message) },
    );
  }
}
