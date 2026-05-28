import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import type { createEmbedding as createEmbeddingType } from "@/lib/ai/embeddings";
import type { buildNormalizedSolarProduct as buildNormalizedSolarProductType } from "@/lib/knowledge/validators";
import type { crawlFelicityProducts as crawlFelicityProductsType } from "@/lib/rag/felicity-crawler";
import type {
  normalizeFelicityProduct as normalizeFelicityProductType,
  NormalizedFelicityProduct,
} from "@/lib/rag/felicity-normalizer";
import type { getSupabaseAdminClientOrThrow as getSupabaseAdminClientOrThrowType } from "@/lib/supabase/admin";

let createEmbedding: typeof createEmbeddingType;
let buildNormalizedSolarProduct: typeof buildNormalizedSolarProductType;
let crawlFelicityProducts: typeof crawlFelicityProductsType;
let normalizeFelicityProduct: typeof normalizeFelicityProductType;
let getSupabaseAdminClientOrThrow: typeof getSupabaseAdminClientOrThrowType;

async function loadDependencies() {
  const [embeddings, validators, crawler, normalizer, supabaseAdmin] = await Promise.all([
    import("@/lib/ai/embeddings"),
    import("@/lib/knowledge/validators"),
    import("@/lib/rag/felicity-crawler"),
    import("@/lib/rag/felicity-normalizer"),
    import("@/lib/supabase/admin"),
  ]);

  createEmbedding = embeddings.createEmbedding;
  buildNormalizedSolarProduct = validators.buildNormalizedSolarProduct;
  crawlFelicityProducts = crawler.crawlFelicityProducts;
  normalizeFelicityProduct = normalizer.normalizeFelicityProduct;
  getSupabaseAdminClientOrThrow = supabaseAdmin.getSupabaseAdminClientOrThrow;
}

type IngestStats = {
  productsFound: number;
  productsStored: number;
  chunksCreated: number;
  categories: Set<string>;
  failedPages: Array<{ url: string; reason: string }>;
  skippedDuplicates: number;
};

function sanitizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function toKnowledgeRecord(product: NormalizedFelicityProduct) {
  return {
    title: product.title,
    manufacturer: product.brand,
    model: product.model,
    type: product.productType,
    source: product.sourceUrl,
    enabled: true,
    notes: [product.summary, product.recommendationContext],
    specifications: product.specs,
    metadata: {
      brand: product.brand,
      product_category: product.productCategory,
      product_model: product.model,
      source_url: product.sourceUrl,
      images: product.images,
      content_hash: product.contentHash,
    },
    raw: {
      brand: product.brand,
      source_url: product.sourceUrl,
      product_category: product.productCategory,
      product_model: product.model,
      content_hash: product.contentHash,
      description: product.description,
      raw_specs: product.rawSpecs,
      normalized_specs: product.specs,
      images: product.images,
    },
  };
}

async function findExistingHash(filePath: string) {
  const supabase = getSupabaseAdminClientOrThrow();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("raw_json")
    .eq("file_path", filePath)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || `Could not check existing document ${filePath}.`);
  }

  const rawJson = data?.raw_json;
  return rawJson && typeof rawJson === "object" && !Array.isArray(rawJson)
    ? sanitizeText((rawJson as Record<string, unknown>).content_hash)
    : "";
}

async function storeProduct(product: NormalizedFelicityProduct) {
  const supabase = getSupabaseAdminClientOrThrow();
  const record = toKnowledgeRecord(product);
  const normalizedProduct = buildNormalizedSolarProduct(record);
  const filePath = `web/felicity/${slugify(product.model || product.title || product.sourceUrl)}`;
  const existingHash = await findExistingHash(filePath);

  if (existingHash && existingHash === product.contentHash) {
    return {
      skipped: true,
      chunksCreated: 0,
    };
  }

  const { data: document, error: documentError } = await supabase
    .from("knowledge_documents")
    .upsert(
      {
        title: product.title,
        manufacturer: product.brand,
        model: product.model,
        product_type: product.productType,
        source: product.sourceUrl,
        file_path: filePath,
        enabled: true,
        raw_json: record.raw,
        last_indexed_at: new Date().toISOString(),
      },
      { onConflict: "file_path" },
    )
    .select("id")
    .single();

  if (documentError || !document?.id) {
    throw new Error(documentError?.message || `Could not upsert ${product.title}.`);
  }

  const documentId = String(document.id);
  const { error: deleteChunksError } = await supabase.from("knowledge_chunks").delete().eq("document_id", documentId);
  if (deleteChunksError) {
    throw new Error(deleteChunksError.message || `Could not refresh chunks for ${product.title}.`);
  }

  const chunkRows = [];
  for (let index = 0; index < product.chunks.length; index += 1) {
    const chunk = product.chunks[index];
    const embedding = await createEmbedding(chunk.text);
    chunkRows.push({
      document_id: documentId,
      chunk_text: chunk.text,
      chunk_index: index,
      embedding,
      metadata: {
        ...chunk.metadata,
        brand: product.brand,
        product_category: product.productCategory,
        product_model: product.model,
        source_url: product.sourceUrl,
        content_hash: product.contentHash,
      },
    });
  }

  if (chunkRows.length) {
    const { error: insertChunksError } = await supabase.from("knowledge_chunks").insert(chunkRows);
    if (insertChunksError) {
      throw new Error(insertChunksError.message || `Could not insert chunks for ${product.title}.`);
    }
  }

  const { error: deleteProductError } = await supabase.from("solar_products").delete().eq("document_id", documentId);
  if (deleteProductError) {
    throw new Error(deleteProductError.message || `Could not refresh solar product ${product.title}.`);
  }

  const { error: insertProductError } = await supabase.from("solar_products").insert({
    ...normalizedProduct,
    document_id: documentId,
    enabled: true,
  });
  if (insertProductError) {
    throw new Error(insertProductError.message || `Could not insert solar product ${product.title}.`);
  }

  return {
    skipped: false,
    chunksCreated: chunkRows.length,
  };
}

async function clearExistingFelicityProducts() {
  const supabase = getSupabaseAdminClientOrThrow();
  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("manufacturer", "Felicity Solar");

  if (error) {
    throw new Error(error.message || "Could not clear existing Felicity Solar documents.");
  }
}

async function main() {
  await loadDependencies();

  const maxPages = Number(process.env.FELICITY_CRAWL_MAX_PAGES || 180);
  const startUrl = sanitizeText(process.env.FELICITY_START_URL) || undefined;
  const delayMs = Number(process.env.FELICITY_CRAWL_DELAY_MS || 600);
  const timeoutMs = Number(process.env.FELICITY_CRAWL_TIMEOUT_MS || 15000);
  const replaceExisting = !/^(0|false|no|off)$/i.test(String(process.env.FELICITY_REPLACE_EXISTING || "true"));
  const crawl = await crawlFelicityProducts({ maxPages, startUrl, delayMs, timeoutMs });
  const normalized = crawl.products.map(normalizeFelicityProduct);
  const stats: IngestStats = {
    productsFound: normalized.length,
    productsStored: 0,
    chunksCreated: 0,
    categories: new Set(),
    failedPages: [...crawl.failedPages],
    skippedDuplicates: crawl.skippedDuplicates,
  };
  const seenHashes = new Set<string>();

  console.log(`Felicity crawl visited ${crawl.visitedCount} page(s).`);
  console.log(`Felicity products found: ${normalized.length}.`);

  if (replaceExisting) {
    await clearExistingFelicityProducts();
    console.log("Cleared existing Felicity Solar documents before ingest.");
  }

  for (const product of normalized) {
    stats.categories.add(product.productCategory);

    if (seenHashes.has(product.contentHash)) {
      stats.skippedDuplicates += 1;
      console.log(`Skipped duplicate content: ${product.model} (${product.productCategory})`);
      continue;
    }
    seenHashes.add(product.contentHash);

    try {
      const result = await storeProduct(product);
      if (result.skipped) {
        stats.skippedDuplicates += 1;
        console.log(`Skipped duplicate: ${product.model} (${product.productCategory})`);
        continue;
      }

      stats.productsStored += 1;
      stats.chunksCreated += result.chunksCreated;
      console.log(`Stored: ${product.model} (${product.productCategory}) - ${result.chunksCreated} chunks`);
    } catch (error) {
      stats.failedPages.push({
        url: product.sourceUrl,
        reason: error instanceof Error ? error.message : "Unknown ingestion error",
      });
      console.warn(`Failed: ${product.sourceUrl}`);
    }
  }

  console.log("Felicity ingestion complete.");
  console.log(`Total products found: ${stats.productsFound}`);
  console.log(`Total products stored: ${stats.productsStored}`);
  console.log(`Total chunks created: ${stats.chunksCreated}`);
  console.log(`Categories discovered: ${Array.from(stats.categories).sort().join(", ") || "none"}`);
  console.log(`Failed pages: ${stats.failedPages.length}`);
  console.log(`Skipped duplicates: ${stats.skippedDuplicates}`);

  if (stats.failedPages.length) {
    console.log("Failed page details:");
    for (const failed of stats.failedPages.slice(0, 20)) {
      console.log(`- ${failed.url}: ${failed.reason}`);
    }
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Felicity ingestion failed: ${message}`);
  process.exitCode = 1;
});
