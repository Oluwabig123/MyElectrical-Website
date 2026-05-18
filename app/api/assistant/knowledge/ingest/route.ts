import { NextResponse } from "next/server";
import { ingestKnowledgeDocument, sanitizeKnowledgePayload } from "@/lib/assistant-rag";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isAuthorized(request: Request) {
  const configuredSecret = sanitizeText(process.env.ADMIN_INGEST_SECRET);
  const providedSecret = sanitizeText(request.headers.get("x-admin-secret"));

  if (!configuredSecret) {
    throw new Error("Missing ADMIN_INGEST_SECRET.");
  }

  return providedSecret && providedSecret === configuredSecret;
}

function buildStatusCode(errorMessage: string) {
  if (/missing admin_ingest_secret/i.test(errorMessage)) return 503;
  if (/forbidden|unauthorized/i.test(errorMessage)) return 401;
  if (/missing openai|missing supabase|not configured/i.test(errorMessage)) return 503;
  if (/embedding|openai|semantic search/i.test(errorMessage)) return 502;
  if (/required|empty|invalid|document content/i.test(errorMessage)) return 400;
  return 500;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const payload = sanitizeKnowledgePayload(body);

    if (!payload.title) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    if (!payload.content) {
      return NextResponse.json({ error: "content is required." }, { status: 400 });
    }

    const result = await ingestKnowledgeDocument(payload);

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Sorry, the document ingestion request could not be completed.";

    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}
