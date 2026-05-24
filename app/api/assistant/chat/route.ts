import { NextResponse } from "next/server";
import { generateAssistantChatReply } from "@/lib/assistant-rag";
import { runAssistantWorkflow, type WorkflowFlowId } from "@/lib/ai/workflows";

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

function sanitizeAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      sanitizeText(key),
      sanitizeText(item),
    ]),
  );
}

function isWorkflowRequest(value: unknown): value is {
  mode: "workflow";
  flowId: WorkflowFlowId;
  answers: Record<string, string>;
  sessionId?: string;
  customerName?: string;
  phone?: string;
} {
  if (!value || typeof value !== "object") return false;
  return sanitizeText((value as { mode?: unknown }).mode) === "workflow";
}

function inferWorkflowFromMessage(message: string): WorkflowFlowId | null {
  const value = sanitizeText(message).toLowerCase();
  if (!value) return null;
  if (/burning|sparks?|shock|tripping breaker|smoke|exposed wire|unsafe|safe setup|is this safe/.test(value)) {
    return "safety";
  }
  if (/panel|mppt|voc|vmp|pv|solar/.test(value)) return "solar";
  if (/battery|bms|series support|parallel support/.test(value)) return "battery";
  if (/inverter/.test(value)) return "inverter";
  if (/breaker|spd|isolator|fuse|earthing|mc4|cable size|protection/.test(value)) return "protection";
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = body && typeof body === "object" ? body : {};

  if (isWorkflowRequest(payload)) {
    try {
      const result = await runAssistantWorkflow({
        flowId: payload.flowId,
        answers: sanitizeAnswers(payload.answers),
        sessionId: sanitizeText(payload.sessionId),
        customerName: sanitizeText(payload.customerName),
        phone: sanitizeText(payload.phone),
      });

      return NextResponse.json({
        answer: result.answer,
        sources: result.sources,
        usedKnowledgeBase: result.usedKnowledgeBase,
        recommendation: result.recommendation,
        quoteIntentDetected: payload.flowId === "quote",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sorry, the assistant could not complete this consultation.";

      return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
    }
  }

  const messages = payload as { messages?: unknown };
  const latestUserMessage = getLatestUserMessage(messages.messages);

  if (!latestUserMessage) {
    return NextResponse.json({ error: "Please enter a message before sending." }, { status: 400 });
  }

  const inferredFlowId = inferWorkflowFromMessage(latestUserMessage);
  if (inferredFlowId) {
    try {
      const result = await runAssistantWorkflow({
        flowId: inferredFlowId,
        answers: {
          appliances: latestUserMessage,
          existing_inverter: latestUserMessage,
          existing_battery: latestUserMessage,
          panel_details: latestUserMessage,
          issue: latestUserMessage,
          backup_hours: latestUserMessage,
        },
      });

      return NextResponse.json({
        answer: result.answer,
        sources: result.sources,
        usedKnowledgeBase: result.usedKnowledgeBase,
        recommendation: result.recommendation,
        quoteIntentDetected: false,
      });
    } catch {
      // Fall through to the general assistant route so transient workflow errors do not block chat.
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
