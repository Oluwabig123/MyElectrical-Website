export const KNOWLEDGE_PRODUCT_TYPES = [
  "inverter",
  "hybrid_inverter",
  "battery",
  "solar_panel",
  "charge_controller",
  "cable",
  "breaker",
  "spd",
  "earthing",
  "installation_guide",
  "pricing_sheet",
  "faq",
  "business",
  "service",
] as const;

export type KnowledgeProductType = (typeof KNOWLEDGE_PRODUCT_TYPES)[number];

export type StructuredKnowledgeRecord = {
  title: string;
  manufacturer: string | null;
  model: string | null;
  type: KnowledgeProductType;
  source: string | null;
  enabled: boolean;
  notes: string[];
  specifications: Record<string, unknown>;
  metadata: Record<string, unknown>;
  raw: Record<string, unknown>;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = sanitizeText(value).toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
}

function ensureObject(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function toKnowledgeType(value: unknown, filePath: string): KnowledgeProductType {
  const normalized = sanitizeText(value) as KnowledgeProductType;
  if (!normalized || !KNOWLEDGE_PRODUCT_TYPES.includes(normalized)) {
    throw new Error(`Unsupported product type in ${filePath}.`);
  }

  return normalized;
}

export function shouldIgnoreKnowledgeFile(filePath: string) {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".template.json") || lower.endsWith("/template.json");
}

export function validateKnowledgeRecord(input: unknown, filePath: string): StructuredKnowledgeRecord {
  const raw = ensureObject(input, `Knowledge record at ${filePath}`);
  const type = toKnowledgeType(raw.type, filePath);
  const specifications = ensureObject(raw.specifications || {}, `specifications in ${filePath}`);
  const title = sanitizeText(raw.title) || sanitizeText(raw.model) || sanitizeText(raw.manufacturer);

  if (!title) {
    throw new Error(`title is required in ${filePath}.`);
  }

  return {
    title,
    manufacturer: sanitizeText(raw.manufacturer) || null,
    model: sanitizeText(raw.model) || null,
    type,
    source: sanitizeText(raw.source) || null,
    enabled: sanitizeBoolean(raw.enabled, true),
    notes: Array.isArray(raw.notes)
      ? raw.notes.map((item) => sanitizeText(item)).filter(Boolean)
      : [],
    specifications,
    metadata: ensureObject(raw.metadata || {}, `metadata in ${filePath}`),
    raw,
  };
}

function presentValue(value: unknown) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

export function buildKnowledgeChunkText(record: StructuredKnowledgeRecord) {
  const lines = [
    `Title: ${record.title}`,
    `Product type: ${record.type}`,
  ];

  if (record.manufacturer) lines.push(`Manufacturer: ${record.manufacturer}`);
  if (record.model) lines.push(`Model: ${record.model}`);
  if (record.source) lines.push(`Source: ${record.source}`);

  for (const [key, value] of Object.entries(record.specifications)) {
    if (!presentValue(value)) continue;
    const label = key.replace(/_/g, " ");
    const rendered = Array.isArray(value) ? value.join(", ") : String(value);
    lines.push(`${label}: ${rendered}`);
  }

  if (record.notes.length) {
    lines.push(`Notes: ${record.notes.join(" | ")}`);
  }

  return lines.join("\n");
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value: unknown) {
  const parsed = toNullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function toNullableBoolean(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return sanitizeBoolean(value, false);
}

export function buildNormalizedSolarProduct(record: StructuredKnowledgeRecord) {
  const specs = record.specifications;

  return {
    manufacturer: record.manufacturer,
    model: record.model || record.title,
    product_type: record.type,
    nominal_voltage: toNullableNumber(specs.nominal_voltage ?? specs.battery_voltage),
    rated_power_w: toNullableNumber(specs.rated_power_w ?? specs.wattage),
    capacity_ah: toNullableNumber(specs.capacity_ah),
    capacity_kwh: toNullableNumber(specs.capacity_kwh),
    max_pv_voc: toNullableNumber(specs.max_pv_voc),
    mppt_min_v: toNullableNumber(specs.mppt_min_v),
    mppt_max_v: toNullableNumber(specs.mppt_max_v),
    max_pv_power_w: toNullableNumber(specs.max_pv_power_w),
    max_pv_current_a: toNullableNumber(specs.max_pv_current_a),
    max_charge_current_a: toNullableNumber(specs.max_charge_current_a),
    max_discharge_current_a: toNullableNumber(specs.max_discharge_current_a),
    supported_series: toNullableInteger(specs.supported_series),
    supported_parallel: toNullableInteger(specs.supported_parallel),
    communication: sanitizeText(specs.communication) || null,
    batteryless_supported: toNullableBoolean(specs.batteryless_supported),
    raw_specs: specs,
  };
}
