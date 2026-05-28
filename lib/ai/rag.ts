import { createEmbedding } from "@/lib/ai/embeddings";
import type { ProductSpecMatch, ProductType } from "@/lib/engineering/types";
import { getSupabaseAdminClientOrThrow } from "@/lib/supabase/admin";

export type KnowledgeChunkMatch = {
  document_id: string;
  chunk_text: string;
  title: string | null;
  manufacturer: string | null;
  model: string | null;
  product_type: string | null;
  source: string | null;
  similarity: number;
  metadata: Record<string, unknown> | null;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeModel(text: unknown) {
  return sanitizeText(text).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function rowToSpecMatch(row: Record<string, unknown>, matchedBy: ProductSpecMatch["matchedBy"]): ProductSpecMatch {
  return {
    documentId: sanitizeText(row.document_id || row.documentId) || null,
    manufacturer: sanitizeText(row.manufacturer) || null,
    model: sanitizeText(row.model) || null,
    productType: String(row.product_type || row.productType || "business") as ProductType,
    source: sanitizeText(row.source) || null,
    specs:
      row.raw_specs && typeof row.raw_specs === "object" && !Array.isArray(row.raw_specs)
        ? (row.raw_specs as Record<string, unknown>)
        : {},
    confidence: matchedBy === "exact_model" ? "high" : "medium",
    matchedBy,
  };
}

export function extractModelCandidates(text: string) {
  const matches = text.match(/[A-Za-z]{2,}[A-Za-z0-9-]{2,}/g) || [];
  const unique = new Map<string, string>();

  for (const item of matches) {
    const normalized = normalizeModel(item);
    if (!normalized || normalized.length < 4) continue;
    if (!unique.has(normalized)) unique.set(normalized, item);
  }

  return Array.from(unique.values());
}

export async function findSolarProducts({
  productTypes,
  modelText,
  manufacturer,
  minCapacityKwh,
  minRatedPowerW,
  nominalVoltage,
  limit = 8,
}: {
  productTypes?: ProductType[];
  modelText?: string;
  manufacturer?: string;
  minCapacityKwh?: number | null;
  minRatedPowerW?: number | null;
  nominalVoltage?: number | null;
  limit?: number;
}) {
  const supabase = getSupabaseAdminClientOrThrow();
  let query = supabase
    .from("solar_products")
    .select(
      "document_id, manufacturer, model, product_type, source, raw_specs, nominal_voltage, rated_power_w, capacity_ah, capacity_kwh, max_pv_voc, mppt_min_v, mppt_max_v, max_pv_power_w, max_pv_current_a, max_charge_current_a, max_discharge_current_a, supported_series, supported_parallel, communication, batteryless_supported, enabled",
    )
    .eq("enabled", true)
    .limit(limit);

  if (productTypes?.length) {
    query = query.in("product_type", productTypes);
  }

  if (sanitizeText(modelText)) {
    query = query.ilike("model", `%${sanitizeText(modelText)}%`);
  }

  if (sanitizeText(manufacturer)) {
    query = query.ilike("manufacturer", `%${sanitizeText(manufacturer)}%`);
  }

  if (minCapacityKwh && minCapacityKwh > 0) {
    query = query.gte("capacity_kwh", minCapacityKwh);
  }

  if (minRatedPowerW && minRatedPowerW > 0) {
    query = query.gte("rated_power_w", minRatedPowerW);
  }

  if (nominalVoltage && nominalVoltage > 0) {
    query = query.eq("nominal_voltage", nominalVoltage);
  }

  if (minCapacityKwh && minCapacityKwh > 0) {
    query = query.order("capacity_kwh", { ascending: true, nullsFirst: false });
  } else if (minRatedPowerW && minRatedPowerW > 0) {
    query = query.order("rated_power_w", { ascending: true, nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Could not load structured product data.");
  }

  return (Array.isArray(data) ? data : []).map((row) => rowToSpecMatch(row, modelText ? "partial_model" : "retrieval"));
}

export async function findFelicityProductsForSizing({
  productTypes,
  minCapacityKwh,
  minRatedPowerW,
  nominalVoltage,
  limit = 6,
}: {
  productTypes: ProductType[];
  minCapacityKwh?: number | null;
  minRatedPowerW?: number | null;
  nominalVoltage?: number | null;
  limit?: number;
}) {
  return findSolarProducts({
    productTypes,
    manufacturer: "Felicity",
    minCapacityKwh,
    minRatedPowerW,
    nominalVoltage,
    limit,
  });
}

export async function findBestProductMatch({
  productTypes,
  text,
}: {
  productTypes: ProductType[];
  text: string;
}) {
  const candidates = extractModelCandidates(text);
  const normalizedCandidates = new Set(candidates.map((item) => normalizeModel(item)));
  const candidateRows = (
    await Promise.all(
      (candidates.length ? candidates : [text])
        .slice(0, 6)
        .map((candidate) => findSolarProducts({ productTypes, modelText: candidate, limit: 6 })),
    )
  ).flat();

  const uniqueRows = candidateRows.filter(
    (row, index, rows) =>
      rows.findIndex(
        (item) =>
          normalizeModel(item.model) === normalizeModel(row.model) &&
          String(item.productType) === String(row.productType),
      ) === index,
  );

  const exact = uniqueRows.find((row) => {
    const normalized = normalizeModel(row.model);
    return normalized && normalizedCandidates.has(normalized);
  });

  if (exact) {
    return {
      ...exact,
      confidence: "high" as const,
      matchedBy: "exact_model" as const,
    };
  }

  return uniqueRows[0] || null;
}

export async function matchKnowledgeChunks({
  query,
  productType,
  model,
  matchCount = 6,
}: {
  query: string;
  productType?: ProductType | null;
  model?: string | null;
  matchCount?: number;
}) {
  const supabase = getSupabaseAdminClientOrThrow();
  const embedding = await createEmbedding(query);
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
    filter_product_type: productType || null,
    filter_model: model || null,
  });

  if (error) {
    throw new Error(error.message || "Could not run structured knowledge retrieval.");
  }

  return (Array.isArray(data) ? data : []) as KnowledgeChunkMatch[];
}
