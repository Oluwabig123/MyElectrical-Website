import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { createEmbedding } from "@/lib/ai/embeddings";
import { ingestKnowledgeDocument } from "@/lib/assistant-rag";
import { loadStructuredKnowledge } from "@/lib/knowledge/load-knowledge";
import {
  buildKnowledgeChunkText,
  buildNormalizedSolarProduct,
} from "@/lib/knowledge/validators";
import { getSupabaseAdminClientOrThrow } from "@/lib/supabase/admin";

const LEGACY_KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge", "oduzz");

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.md$/i, "")
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferCategory(filename: string) {
  const key = filename.toLowerCase();

  if (key.includes("solar") || key.includes("inverter")) return "Solar Installation";
  if (key.includes("cable") || key.includes("wire")) return "Cables & Wires";
  if (key.includes("switch") || key.includes("socket")) return "Switches & Sockets";
  if (key.includes("lighting")) return "Lighting";
  if (key.includes("protection") || key.includes("distribution")) return "Protection & Distribution";
  if (key.includes("cctv") || key.includes("smart-home")) return "CCTV & Smart Home";
  if (key.includes("quote") || key.includes("inspection")) return "Quote & Inspection";
  if (key.includes("safety")) return "Safety";
  if (key.includes("faq")) return "FAQ";
  if (key.includes("service")) return "Electrical Services";
  if (key.includes("product") || key.includes("catalog")) return "Products";
  if (key.includes("company")) return "Company";

  return "General";
}

function extractH1(content: string) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

async function readMarkdownFiles() {
  const entries = await fs.readdir(LEGACY_KNOWLEDGE_DIR, { withFileTypes: true }).catch(() => []);

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(LEGACY_KNOWLEDGE_DIR, entry.name))
    .sort();
}

async function ingestStructuredRecord(
  item: Awaited<ReturnType<typeof loadStructuredKnowledge>>[number],
) {
  const supabase = getSupabaseAdminClientOrThrow();
  const record = item.record;
  const chunkText = buildKnowledgeChunkText(record);
  const embedding = await createEmbedding(chunkText);
  const normalizedProduct = buildNormalizedSolarProduct(record);

  const { data: document, error: documentError } = await supabase
    .from("knowledge_documents")
    .upsert(
      {
        title: record.title,
        manufacturer: record.manufacturer,
        model: record.model,
        product_type: record.type,
        source: record.source,
        file_path: item.relativePath,
        enabled: record.enabled,
        raw_json: record.raw,
        last_indexed_at: new Date().toISOString(),
      },
      {
        onConflict: "file_path",
      },
    )
    .select("id")
    .single();

  if (documentError || !document?.id) {
    throw new Error(documentError?.message || `Could not upsert ${item.relativePath}.`);
  }

  const documentId = document.id as string;

  const { error: deleteChunksError } = await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("document_id", documentId);

  if (deleteChunksError) {
    throw new Error(deleteChunksError.message || `Could not refresh chunks for ${item.relativePath}.`);
  }

  const { error: insertChunkError } = await supabase.from("knowledge_chunks").insert({
    document_id: documentId,
    chunk_text: chunkText,
    chunk_index: 0,
    embedding,
    metadata: {
      title: record.title,
      manufacturer: record.manufacturer,
      model: record.model,
      product_type: record.type,
      source: record.source,
    },
  });

  if (insertChunkError) {
    throw new Error(insertChunkError.message || `Could not insert chunk for ${item.relativePath}.`);
  }

  const solarLikeTypes = new Set([
    "inverter",
    "hybrid_inverter",
    "battery",
    "solar_panel",
    "charge_controller",
    "cable",
    "breaker",
    "spd",
    "earthing",
  ]);

  if (solarLikeTypes.has(record.type)) {
    const { error: deleteProductError } = await supabase
      .from("solar_products")
      .delete()
      .eq("document_id", documentId);

    if (deleteProductError) {
      throw new Error(deleteProductError.message || `Could not refresh product ${item.relativePath}.`);
    }

    const { error: insertProductError } = await supabase.from("solar_products").insert({
      ...normalizedProduct,
      document_id: documentId,
      enabled: record.enabled,
    });

    if (insertProductError) {
      throw new Error(insertProductError.message || `Could not insert product ${item.relativePath}.`);
    }
  }

  return {
    type: "structured" as const,
    filePath: item.relativePath,
    title: record.title,
    productType: record.type,
    enabled: record.enabled,
  };
}

async function ingestLegacyMarkdown(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const fileName = path.basename(filePath);
  const fallbackTitle = titleFromFilename(fileName);
  const title = sanitizeText(parsed.data?.title) || extractH1(parsed.content) || fallbackTitle;
  const category = sanitizeText(parsed.data?.category) || inferCategory(fileName);
  const sourceUrl = sanitizeText(parsed.data?.source_url || parsed.data?.sourceUrl) || null;
  const content = parsed.content.trim();

  if (!content) {
    throw new Error(`Skipping ${fileName}: empty content.`);
  }

  const result = await ingestKnowledgeDocument({
    title,
    category,
    sourceType: "manual",
    sourceUrl,
    content,
    replaceExistingTitle: true,
  });

  return {
    type: "legacy" as const,
    filePath: path.relative(process.cwd(), filePath),
    title,
    category,
    chunkCount: result.chunkCount,
  };
}

export async function ingestStructuredKnowledge() {
  const records = await loadStructuredKnowledge();
  const results = [];

  for (const item of records) {
    results.push(await ingestStructuredRecord(item));
  }

  return results;
}

export async function ingestLegacyKnowledgeMarkdown() {
  const files = await readMarkdownFiles();
  const results = [];

  for (const filePath of files) {
    results.push(await ingestLegacyMarkdown(filePath));
  }

  return results;
}
