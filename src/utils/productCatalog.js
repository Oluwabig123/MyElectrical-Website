export const PRODUCT_CATEGORY_DEFINITIONS = [
  { key: "cables-wiring", label: "Cables & Wiring" },
  { key: "lighting", label: "Lighting" },
  { key: "protection-control", label: "Protection & Control" },
  { key: "power-backup", label: "Power & Backup" },
  { key: "installation-accessories", label: "Installation Accessories" },
  { key: "tools-testers", label: "Tools & Testers" },
  { key: "general-electrical", label: "General Electrical" },
];

const CATEGORY_KEYWORDS = [
  {
    key: "cables-wiring",
    keywords: [
      "cable",
      "wire",
      "single core",
      "double core",
      "armoured",
      "armored",
      "flex",
      "flexible",
      "awg",
      "mm",
    ],
  },
  {
    key: "lighting",
    keywords: ["light", "lamp", "led", "bulb", "flood", "spotlight", "chandelier"],
  },
  {
    key: "protection-control",
    keywords: [
      "mcb",
      "rccb",
      "rcbo",
      "breaker",
      "contactor",
      "isolator",
      "db",
      "distribution board",
      "switchgear",
      "fuse",
      "surge",
      "protection",
    ],
  },
  {
    key: "power-backup",
    keywords: ["inverter", "battery", "solar", "ups", "panel", "charger", "hybrid"],
  },
  {
    key: "installation-accessories",
    keywords: [
      "socket",
      "switch",
      "conduit",
      "trunking",
      "junction box",
      "accessory",
      "plug",
      "extension",
      "faceplate",
      "clamp",
      "clip",
      "connector",
    ],
  },
  {
    key: "tools-testers",
    keywords: [
      "tester",
      "meter",
      "multimeter",
      "tool",
      "screwdriver",
      "plier",
      "drill",
      "cutter",
      "crimp",
      "stripper",
    ],
  },
];

const FALLBACK_CATEGORY = "general-electrical";
const FALLBACK_CURRENCY = "NGN";

const categoryLabelByKey = PRODUCT_CATEGORY_DEFINITIONS.reduce((acc, category) => {
  acc[category.key] = category.label;
  return acc;
}, {});

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeSlug(value) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value > 0;
  return fallback;
}

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item))
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => sanitizeText(item))
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function normalizeSource(value) {
  const source = sanitizeText(value).toLowerCase();
  return source || "catalog";
}

function extractSizeNumber(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const normalized = String(value).replace(",", ".").toLowerCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*mm\b/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareProducts(a, b) {
  if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
  const sizeA = extractSizeNumber(a.size || a.name);
  const sizeB = extractSizeNumber(b.size || b.name);

  if (sizeA !== sizeB) return sizeA - sizeB;
  return a.name.localeCompare(b.name);
}

export function inferProductCategory(product) {
  const text = [
    product.name,
    product.brand,
    product.type,
    product.bestFor,
    product.size,
    product.description,
    ...(Array.isArray(product?.keyFeatures) ? product.keyFeatures : []),
  ]
    .map((value) => sanitizeText(value).toLowerCase())
    .join(" ");

  const matchedRule = CATEGORY_KEYWORDS.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  return matchedRule?.key || FALLBACK_CATEGORY;
}

export function getCategoryLabel(categoryKey) {
  return categoryLabelByKey[categoryKey] || categoryLabelByKey[FALLBACK_CATEGORY];
}

export function isValidProductCategory(categoryKey) {
  return Boolean(categoryLabelByKey[sanitizeText(categoryKey)]);
}

export function normalizeProduct(rawProduct, fallbackId) {
  const safeName = sanitizeText(rawProduct?.name) || "Unnamed product";
  const safeSize = sanitizeText(rawProduct?.size) || "N/A";
  const safeType = sanitizeText(rawProduct?.type) || "Electrical item";
  const safeBestFor = sanitizeText(rawProduct?.bestFor) || "General electrical use";
  const safeImageUrl = sanitizeText(rawProduct?.imageUrl);
  const safeBrand = sanitizeText(rawProduct?.brand) || "Oduzz";
  const safeDescription = sanitizeText(rawProduct?.description);
  const safeKeyFeatures = normalizeStringList(rawProduct?.keyFeatures);
  const safeCurrency = sanitizeText(rawProduct?.currency).toUpperCase() || FALLBACK_CURRENCY;
  const safePriceAmount = normalizeInteger(rawProduct?.priceAmount, 0);
  const safeStockQty = Math.max(0, normalizeInteger(rawProduct?.stockQty, 0));
  const safeSlug = sanitizeSlug(rawProduct?.slug) || sanitizeSlug(safeName) || sanitizeSlug(fallbackId);
  const safeIsActive = normalizeBoolean(rawProduct?.isActive, true);
  const safeFeatured = normalizeBoolean(rawProduct?.featured, false);
  const safeSource = normalizeSource(rawProduct?.source);

  const inferredCategory = inferProductCategory({
    name: safeName,
    size: safeSize,
    type: safeType,
    bestFor: safeBestFor,
  });

  const providedCategory = sanitizeText(rawProduct?.category);
  const finalCategory = categoryLabelByKey[providedCategory] ? providedCategory : inferredCategory;

  return {
    id: sanitizeText(rawProduct?.id) || fallbackId,
    name: safeName,
    size: safeSize,
    type: safeType,
    bestFor: safeBestFor,
    imageUrl: safeImageUrl,
    brand: safeBrand,
    description: safeDescription,
    keyFeatures: safeKeyFeatures,
    priceAmount: safePriceAmount,
    currency: safeCurrency,
    stockQty: safeStockQty,
    slug: safeSlug,
    isActive: safeIsActive,
    featured: safeFeatured,
    source: safeSource,
    category: finalCategory,
    categoryLabel: getCategoryLabel(finalCategory),
  };
}

export function formatProductPrice(product) {
  const amount = Number(product?.priceAmount || 0);
  const currency = sanitizeText(product?.currency).toUpperCase() || FALLBACK_CURRENCY;
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function getProductAvailability(product) {
  if (!product?.isActive) return "Inactive";
  if ((product?.stockQty || 0) <= 0) return "Out of stock";
  if (product.stockQty <= 5) return "Low stock";
  return "In stock";
}

export function buildProductPath(product) {
  const slug = sanitizeSlug(product?.slug) || sanitizeText(product?.id);
  return slug ? `/products/${slug}` : "/products";
}

export function buildProductCatalog(products, { includeInactive = false } = {}) {
  const normalizedItems = products.map((item, index) =>
    normalizeProduct(item, `product-${index + 1}`)
  );
  const visibleItems = includeInactive
    ? normalizedItems
    : normalizedItems.filter((item) => item.isActive);

  const buckets = PRODUCT_CATEGORY_DEFINITIONS.reduce((acc, category) => {
    acc[category.key] = [];
    return acc;
  }, {});

  visibleItems.forEach((item) => {
    const key = buckets[item.category] ? item.category : FALLBACK_CATEGORY;
    buckets[key].push(item);
  });

  const groups = PRODUCT_CATEGORY_DEFINITIONS
    .map((category) => ({
      key: category.key,
      label: category.label,
      items: buckets[category.key].sort(compareProducts),
    }))
    .filter((group) => group.items.length > 0);

  return {
    groups,
    items: visibleItems,
  };
}

export function selectMixedProducts(products, limit = 10) {
  const safeLimit = Math.max(0, Number.parseInt(String(limit), 10) || 0);
  if (!safeLimit) return [];

  const { groups, items } = buildProductCatalog(products);
  const pickedIds = new Set();
  const mixed = [];

  groups.forEach((group) => {
    if (mixed.length >= safeLimit) return;
    const candidate = group.items.find((item) => !pickedIds.has(item.id));
    if (!candidate) return;
    pickedIds.add(candidate.id);
    mixed.push(candidate);
  });

  items.forEach((item) => {
    if (mixed.length >= safeLimit || pickedIds.has(item.id)) return;
    pickedIds.add(item.id);
    mixed.push(item);
  });

  return mixed;
}
