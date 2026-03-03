const CATEGORY_DEFINITIONS = [
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

const categoryLabelByKey = CATEGORY_DEFINITIONS.reduce((acc, category) => {
  acc[category.key] = category.label;
  return acc;
}, {});

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractSizeNumber(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const normalized = String(value).replace(",", ".").toLowerCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*mm\b/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareProducts(a, b) {
  const sizeA = extractSizeNumber(a.size || a.name);
  const sizeB = extractSizeNumber(b.size || b.name);

  if (sizeA !== sizeB) return sizeA - sizeB;
  return a.name.localeCompare(b.name);
}

export function inferProductCategory(product) {
  const text = [product.name, product.type, product.bestFor, product.size]
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

export function normalizeProduct(rawProduct, fallbackId) {
  const safeName = sanitizeText(rawProduct?.name) || "Unnamed product";
  const safeSize = sanitizeText(rawProduct?.size) || "N/A";
  const safeType = sanitizeText(rawProduct?.type) || "Electrical item";
  const safeBestFor = sanitizeText(rawProduct?.bestFor) || "General electrical use";

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
    category: finalCategory,
    categoryLabel: getCategoryLabel(finalCategory),
  };
}

export function buildProductCatalog(products) {
  const normalizedItems = products.map((item, index) =>
    normalizeProduct(item, `product-${index + 1}`)
  );

  const buckets = CATEGORY_DEFINITIONS.reduce((acc, category) => {
    acc[category.key] = [];
    return acc;
  }, {});

  normalizedItems.forEach((item) => {
    const key = buckets[item.category] ? item.category : FALLBACK_CATEGORY;
    buckets[key].push(item);
  });

  const groups = CATEGORY_DEFINITIONS
    .map((category) => ({
      key: category.key,
      label: category.label,
      items: buckets[category.key].sort(compareProducts),
    }))
    .filter((group) => group.items.length > 0);

  return {
    groups,
    items: normalizedItems,
  };
}
