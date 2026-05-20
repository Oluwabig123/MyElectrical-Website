import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { ingestKnowledgeDocument, sanitizeKnowledgePayload } from "@/lib/assistant-rag";
import {
  extractKnowledgeTextFromFile,
  getKnowledgeUploadLimits,
} from "@/lib/knowledge-file-parser";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = sanitizeText(value).toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;

  return fallback;
}

function buildStatusCode(errorMessage: string) {
  if (/unauthorized|forbidden/i.test(errorMessage)) return 401;
  if (/missing openai|missing supabase|not configured/i.test(errorMessage)) return 503;
  if (/embedding|openai|semantic search/i.test(errorMessage)) return 502;
  if (/required|empty|invalid|document content/i.test(errorMessage)) return 400;
  return 500;
}

async function requireAdminSession() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    throw new Error("Unauthorized.");
  }

  return adminSession;
}

async function requireSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabaseAdmin;
}

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = await requireSupabaseAdminClient();

    const { data, error } = await supabase
      .from("documents")
      .select("id, title, category, source_type, source_url, content, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(120);

    if (error) {
      throw new Error(error.message || "Could not load knowledge documents.");
    }

    return NextResponse.json({
      items: Array.isArray(data) ? data : [],
      limits: getKnowledgeUploadLimits(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load knowledge documents.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const contentType = sanitizeText(request.headers.get("content-type")).toLowerCase();
    let payload = {
      title: "",
      category: null as string | null,
      sourceType: "manual",
      sourceUrl: null as string | null,
      content: "",
      replaceExistingTitle: true,
    };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("file");

      if (!(fileEntry instanceof File)) {
        return NextResponse.json({ error: "file is required." }, { status: 400 });
      }

      const extracted = await extractKnowledgeTextFromFile(fileEntry);
      const requestedTitle = sanitizeText(formData.get("title"));
      const requestedCategory = sanitizeText(formData.get("category"));
      const requestedSourceType = sanitizeText(formData.get("source_type")) || "upload";
      const requestedSourceUrl = sanitizeText(formData.get("source_url")) || null;
      const replaceExistingRaw = sanitizeText(formData.get("replace_existing")).toLowerCase();

      payload = {
        title: requestedTitle || extracted.suggestedTitle,
        category: requestedCategory || null,
        sourceType: requestedSourceType,
        sourceUrl: requestedSourceUrl,
        content: extracted.content,
        replaceExistingTitle: !["false", "0", "no", "off"].includes(replaceExistingRaw),
      };
    } else {
      const body = await request.json().catch(() => ({}));
      payload = sanitizeKnowledgePayload(body);
    }

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
      deactivatedCount: result.deactivatedCount,
      limits: getKnowledgeUploadLimits(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save knowledge document.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminSession();
    const supabase = await requireSupabaseAdminClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const documentId = sanitizeText(body.documentId || body.id);
    const isActive = toBoolean(body.isActive ?? body.is_active, true);

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("documents")
      .update({ is_active: isActive })
      .eq("id", documentId);

    if (error) {
      throw new Error(error.message || "Could not update document active status.");
    }

    return NextResponse.json({
      success: true,
      documentId,
      isActive,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update document status.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}
