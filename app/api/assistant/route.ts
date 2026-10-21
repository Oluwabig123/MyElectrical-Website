import { NextResponse } from "next/server";
import { generateAssistantChatReply } from "@/lib/assistant-rag";
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
    routeKey: "assistant",
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

  try {
    const safeMessages = clampMessages((body as { messages?: unknown })?.messages);
    const result = await generateAssistantChatReply(safeMessages);

    return NextResponse.json({
      text: result.answer,
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
