import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { ingestStructuredKnowledge } from "@/lib/knowledge/ingest-knowledge";
import { getSupabaseAdminClientOrThrow } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = sanitizeText(value).toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
}

function buildStatusCode(errorMessage: string) {
  if (/unauthorized|forbidden/i.test(errorMessage)) return 401;
  if (/missing openai|missing supabase|not configured/i.test(errorMessage)) return 503;
  if (/embedding|openai|semantic search/i.test(errorMessage)) return 502;
  if (/required|empty|invalid/i.test(errorMessage)) return 400;
  return 500;
}

async function requireAdminSession() {
  if (!(await getAdminSession())) {
    throw new Error("Unauthorized.");
  }
}

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdminClientOrThrow();
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select(
        "id, title, manufacturer, model, product_type, source, file_path, enabled, raw_json, last_indexed_at, updated_at, created_at",
      )
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new Error(error.message || "Could not load knowledge items.");
    }

    return NextResponse.json({
      items: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load knowledge items.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = sanitizeText(body.action);

    if (!action || !["reindex-all", "reindex-one"].includes(action)) {
      return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
    }

    if (action === "reindex-all") {
      const items = await ingestStructuredKnowledge();
      return NextResponse.json({
        success: true,
        count: items.length,
      });
    }

    const filePath = sanitizeText(body.filePath);
    if (!filePath) {
      return NextResponse.json({ error: "filePath is required for reindex-one." }, { status: 400 });
    }

    const items = await ingestStructuredKnowledge();
    const match = items.find((item) => item.filePath === filePath);

    return NextResponse.json({
      success: true,
      count: match ? 1 : 0,
      reindexed: match || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not re-index knowledge.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdminClientOrThrow();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const documentId = sanitizeText(body.documentId || body.id);
    const enabled = toBoolean(body.enabled, true);

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("knowledge_documents")
      .update({ enabled })
      .eq("id", documentId);

    if (error) {
      throw new Error(error.message || "Could not update knowledge item.");
    }

    const { error: productError } = await supabase
      .from("solar_products")
      .update({ enabled })
      .eq("document_id", documentId);

    if (productError) {
      throw new Error(productError.message || "Could not update linked product state.");
    }

    return NextResponse.json({
      success: true,
      documentId,
      enabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update knowledge item.";
    return NextResponse.json({ error: message }, { status: buildStatusCode(message) });
  }
}
