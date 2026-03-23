export const PRODUCT_CATEGORY_DEFINITIONS = [
  { key: "lighting", label: "Lighting", group: "Electrical" },
  { key: "switches-sockets", label: "Switches & Sockets", group: "Electrical" },
  { key: "wiring-cables", label: "Wiring & Cables", group: "Electrical" },
  { key: "conduits-trunking", label: "Conduits & Trunking", group: "Electrical" },
  { key: "circuit-protection", label: "Circuit Protection", group: "Electrical" },
  { key: "distribution-boards-panels", label: "Distribution Boards & Panels", group: "Electrical" },
  { key: "electrical-accessories", label: "Electrical Accessories", group: "Electrical" },
  { key: "smart-home-automation", label: "Smart Home & Automation", group: "Electrical" },
  { key: "power-backup-solar", label: "Power Backup & Solar Systems", group: "Electrical" },
  { key: "industrial-electrical", label: "Industrial Electrical Equipment", group: "Electrical" },
  { key: "testing-measuring", label: "Testing & Measuring Instruments", group: "Electrical" },
  { key: "cable-management", label: "Cable Management", group: "Electrical" },
  { key: "earthing-lightning-protection", label: "Earthing & Lightning Protection", group: "Electrical" },
  { key: "transformers-power-equipment", label: "Transformers & Power Equipment", group: "Electrical" },
  { key: "installation-materials", label: "Installation Materials", group: "Electrical" },
  { key: "cctv-cameras", label: "CCTV Cameras", group: "Security & CCTV" },
  { key: "dvr", label: "DVR (Digital Video Recorders)", group: "Security & CCTV" },
  { key: "nvr", label: "NVR (Network Video Recorders)", group: "Security & CCTV" },
  { key: "ip-cameras", label: "IP Cameras", group: "Security & CCTV" },
  { key: "analog-cameras", label: "Analog Cameras", group: "Security & CCTV" },
  { key: "wireless-cctv", label: "Wireless CCTV Systems", group: "Security & CCTV" },
  { key: "cctv-kits", label: "CCTV Kits (Complete Systems)", group: "Security & CCTV" },
  { key: "surveillance-hard-drives", label: "Surveillance Hard Drives", group: "Security & CCTV" },
  { key: "cctv-cables-connectors", label: "Cables & Connectors (CCTV)", group: "Security & CCTV" },
  { key: "power-supply-units", label: "Power Supply Units (SMPS/Adapters)", group: "Security & CCTV" },
  { key: "camera-mounts-brackets", label: "Camera Mounts & Brackets", group: "Security & CCTV" },
  { key: "video-baluns", label: "Video Baluns", group: "Security & CCTV" },
  { key: "poe-equipment", label: "PoE (Power over Ethernet) Equipment", group: "Security & CCTV" },
  { key: "monitors-display-screens", label: "Monitors & Display Screens", group: "Security & CCTV" },
  { key: "remote-viewing-monitoring", label: "Remote Viewing & Monitoring Devices", group: "Security & CCTV" },
  { key: "access-control-systems", label: "Access Control Systems", group: "Security & CCTV" },
  { key: "intercom-systems", label: "Intercom Systems", group: "Security & CCTV" },
  { key: "alarm-systems-sensors", label: "Alarm Systems & Sensors", group: "Security & CCTV" },
  { key: "cctv-accessories", label: "CCTV Accessories", group: "Security & CCTV" },
];

const CATEGORY_SYNONYMS = {
  "wiring-cables": ["cables-wiring", "cables-and-wiring", "wires-cables"],
  "circuit-protection": ["protection-control", "protection-and-control"],
  "power-backup-solar": ["power-backup", "power-and-backup", "power-backup-solar-systems"],
  "electrical-accessories": ["general-electrical", "installation-accessories"],
  "testing-measuring": ["tools-testers", "tools-and-testers"],
  "cctv-accessories": ["cctv-accessorie"],
};

const CATEGORY_KEYWORDS = [
  {
    key: "wireless-cctv",
    keywords: [
      "wireless cctv",
      "wireless camera",
      "wifi camera",
      "wi-fi camera",
      "cordless cctv",
    ],
  },
  {
    key: "ip-cameras",
    keywords: ["ip camera", "network camera", "onvif camera", "poe camera"],
  },
  {
    key: "analog-cameras",
    keywords: ["analog camera", "ahd camera", "tvi camera", "cvi camera"],
  },
  {
    key: "cctv-kits",
    keywords: ["cctv kit", "security kit", "camera kit", "complete system", "complete kit"],
  },
  {
    key: "dvr",
    keywords: ["dvr", "digital video recorder"],
  },
  {
    key: "nvr",
    keywords: ["nvr", "network video recorder"],
  },
  {
    key: "surveillance-hard-drives",
    keywords: ["surveillance hard drive", "surveillance hdd", "wd purple", "skyhawk"],
  },
  {
    key: "cctv-cables-connectors",
    keywords: ["bnc", "rg59", "siamese cable", "video cable", "dc jack", "cctv connector"],
  },
  {
    key: "power-supply-units",
    keywords: ["smps", "power adapter", "12v adapter", "cctv power supply", "power box"],
  },
  {
    key: "camera-mounts-brackets",
    keywords: ["camera bracket", "camera mount", "mount bracket", "wall mount", "pole mount"],
  },
  {
    key: "video-baluns",
    keywords: ["video balun", "balun", "passive balun", "active balun"],
  },
  {
    key: "poe-equipment",
    keywords: ["poe", "poe switch", "poe injector", "poe splitter"],
  },
  {
    key: "monitors-display-screens",
    keywords: ["monitor", "display screen", "lcd screen", "led monitor"],
  },
  {
    key: "remote-viewing-monitoring",
    keywords: ["remote viewing", "remote monitoring", "monitoring device", "viewing device"],
  },
  {
    key: "access-control-systems",
    keywords: ["access control", "biometric", "card reader", "attendance machine", "maglock", "door lock"],
  },
  {
    key: "intercom-systems",
    keywords: ["intercom", "door phone", "video doorbell", "audio intercom"],
  },
  {
    key: "alarm-systems-sensors",
    keywords: ["alarm", "siren", "pir sensor", "motion detector", "smoke detector", "magnetic sensor"],
  },
  {
    key: "cctv-accessories",
    keywords: ["cctv accessory", "camera housing", "cctv microphone", "security accessory"],
  },
  {
    key: "cctv-cameras",
    keywords: ["cctv camera", "security camera", "surveillance camera", "bullet camera", "dome camera"],
  },
  {
    key: "smart-home-automation",
    keywords: ["smart switch", "smart socket", "smart home", "automation", "zigbee", "wifi control", "thermostat"],
  },
  {
    key: "switches-sockets",
    keywords: ["switch", "socket", "outlet", "receptacle", "faceplate", "wall socket", "gang switch"],
  },
  {
    key: "conduits-trunking",
    keywords: ["conduit", "trunking", "raceway", "pvc pipe", "corrugated pipe", "electrical pipe"],
  },
  {
    key: "distribution-boards-panels",
    keywords: ["distribution board", "consumer unit", "panel board", "breaker panel", "db box"],
  },
  {
    key: "circuit-protection",
    keywords: [
      "mcb",
      "rccb",
      "rcbo",
      "breaker",
      "isolator",
      "fuse",
      "surge",
      "spd",
      "changeover",
      "switchgear",
    ],
  },
  {
    key: "wiring-cables",
    keywords: [
      "cable",
      "wire",
      "single core",
      "double core",
      "twin and earth",
      "armoured",
      "armored",
      "flex",
      "flexible cable",
      "copper wire",
    ],
  },
  {
    key: "lighting",
    keywords: ["light", "lamp", "led", "bulb", "floodlight", "spotlight", "chandelier", "downlight"],
  },
  {
    key: "power-backup-solar",
    keywords: ["inverter", "battery", "solar", "solar panel", "ups", "charger", "hybrid", "deep cycle"],
  },
  {
    key: "industrial-electrical",
    keywords: ["vfd", "plc", "motor starter", "selector switch", "push button", "overload relay", "contactor"],
  },
  {
    key: "testing-measuring",
    keywords: [
      "tester",
      "meter",
      "multimeter",
      "clamp meter",
      "megger",
      "insulation tester",
      "voltmeter",
      "ammeter",
    ],
  },
  {
    key: "cable-management",
    keywords: ["cable tie", "cable tray", "cable trunk", "cable gland", "cable clip", "cable marker"],
  },
  {
    key: "earthing-lightning-protection",
    keywords: ["earthing", "earth rod", "ground rod", "grounding", "lightning arrester", "lightning protection"],
  },
  {
    key: "transformers-power-equipment",
    keywords: ["transformer", "stabilizer", "servo", "step down", "step-up", "power equipment"],
  },
  {
    key: "installation-materials",
    keywords: [
      "clip",
      "tape",
      "connector",
      "ferrule",
      "lug",
      "rawl plug",
      "screw",
      "fastener",
      "installation material",
    ],
  },
  {
    key: "electrical-accessories",
    keywords: [
      "junction box",
      "accessory",
      "plug",
      "extension box",
      "adapter",
      "lamp holder",
      "terminal block",
      "ceiling rose",
    ],
  },
];

const FALLBACK_CATEGORY = "electrical-accessories";
const FALLBACK_CURRENCY = "NGN";

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

function slugifyCategory(value) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const categoryLabelByKey = PRODUCT_CATEGORY_DEFINITIONS.reduce((acc, category) => {
  acc[category.key] = category.label;
  return acc;
}, {});

const categoryKeyBySlug = PRODUCT_CATEGORY_DEFINITIONS.reduce((acc, category) => {
  acc[slugifyCategory(category.key)] = category.key;
  acc[slugifyCategory(category.label)] = category.key;
  return acc;
}, {});

Object.entries(CATEGORY_SYNONYMS).forEach(([categoryKey, aliases]) => {
  aliases.forEach((alias) => {
    categoryKeyBySlug[slugifyCategory(alias)] = categoryKey;
  });
});

function normalizeCategoryKey(categoryKey) {
  const slug = slugifyCategory(categoryKey);
  return categoryKeyBySlug[slug] || "";
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
  return categoryLabelByKey[normalizeCategoryKey(categoryKey)] || categoryLabelByKey[FALLBACK_CATEGORY];
}

export function isValidProductCategory(categoryKey) {
  return Boolean(normalizeCategoryKey(categoryKey));
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
    brand: safeBrand,
    size: safeSize,
    type: safeType,
    bestFor: safeBestFor,
    description: safeDescription,
    keyFeatures: safeKeyFeatures,
  });

  const providedCategory = normalizeCategoryKey(rawProduct?.category);
  const finalCategory = providedCategory || inferredCategory;

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
