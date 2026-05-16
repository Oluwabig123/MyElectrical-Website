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
] as const;

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "wiring-cables": ["cables-wiring", "cables-and-wiring", "wires-cables"],
  "circuit-protection": ["protection-control", "protection-and-control"],
  "power-backup-solar": ["power-backup", "power-and-backup", "power-backup-solar-systems"],
  "electrical-accessories": ["general-electrical", "installation-accessories"],
  "testing-measuring": ["tools-testers", "tools-and-testers"],
  "cctv-accessories": ["cctv-accessorie"],
};

const CATEGORY_KEYWORDS = [
  { key: "wireless-cctv", keywords: ["wireless cctv", "wireless camera", "wifi camera", "wi-fi camera"] },
  { key: "ip-cameras", keywords: ["ip camera", "network camera", "onvif camera", "poe camera"] },
  { key: "analog-cameras", keywords: ["analog camera", "ahd camera", "tvi camera", "cvi camera"] },
  { key: "cctv-kits", keywords: ["cctv kit", "security kit", "camera kit", "complete system"] },
  { key: "dvr", keywords: ["dvr", "digital video recorder"] },
  { key: "nvr", keywords: ["nvr", "network video recorder"] },
  { key: "surveillance-hard-drives", keywords: ["surveillance hard drive", "wd purple", "skyhawk"] },
  { key: "cctv-cables-connectors", keywords: ["bnc", "rg59", "siamese cable", "video cable", "cctv connector"] },
  { key: "power-supply-units", keywords: ["smps", "power adapter", "12v adapter", "cctv power supply"] },
  { key: "camera-mounts-brackets", keywords: ["camera bracket", "camera mount", "wall mount"] },
  { key: "video-baluns", keywords: ["video balun", "balun"] },
  { key: "poe-equipment", keywords: ["poe", "poe switch", "poe injector", "poe splitter"] },
  { key: "access-control-systems", keywords: ["access control", "biometric", "card reader", "maglock"] },
  { key: "intercom-systems", keywords: ["intercom", "door phone", "video doorbell"] },
  { key: "alarm-systems-sensors", keywords: ["alarm", "siren", "pir sensor", "motion detector"] },
  { key: "cctv-cameras", keywords: ["cctv camera", "security camera", "surveillance camera", "bullet camera", "dome camera"] },
  { key: "smart-home-automation", keywords: ["smart switch", "smart socket", "smart home", "automation"] },
  { key: "switches-sockets", keywords: ["switch", "socket", "outlet", "receptacle", "wall socket"] },
  { key: "conduits-trunking", keywords: ["conduit", "trunking", "raceway", "pvc pipe"] },
  { key: "distribution-boards-panels", keywords: ["distribution board", "consumer unit", "panel board", "db box"] },
  { key: "circuit-protection", keywords: ["mcb", "rccb", "rcbo", "breaker", "isolator", "fuse", "surge", "spd"] },
  { key: "wiring-cables", keywords: ["cable", "wire", "single core", "double core", "twin and earth", "armoured", "flexible cable"] },
  { key: "lighting", keywords: ["light", "lamp", "led", "bulb", "floodlight", "spotlight", "chandelier", "downlight"] },
  { key: "power-backup-solar", keywords: ["inverter", "battery", "solar", "solar panel", "ups", "charger", "hybrid"] },
  { key: "industrial-electrical", keywords: ["vfd", "plc", "motor starter", "selector switch", "push button", "contactor"] },
  { key: "testing-measuring", keywords: ["tester", "meter", "multimeter", "clamp meter", "megger", "insulation tester"] },
  { key: "cable-management", keywords: ["cable tie", "cable tray", "cable gland", "cable clip"] },
  { key: "earthing-lightning-protection", keywords: ["earthing", "earth rod", "grounding", "lightning arrester"] },
  { key: "transformers-power-equipment", keywords: ["transformer", "stabilizer", "servo", "step down", "step-up"] },
  { key: "installation-materials", keywords: ["clip", "tape", "connector", "ferrule", "lug", "fastener"] },
  { key: "electrical-accessories", keywords: ["junction box", "plug", "adapter", "lamp holder", "terminal block"] },
] as const;

const FALLBACK_CATEGORY = "electrical-accessories";
const FALLBACK_CURRENCY = "NGN";

export type ProductCategoryDefinition = (typeof PRODUCT_CATEGORY_DEFINITIONS)[number];
export type ProductCategoryKey = ProductCategoryDefinition["key"];

export type Product = {
  id: string;
  name: string;
  size: string;
  type: string;
  bestFor: string;
  imageUrl: string;
  brand: string;
  description: string;
  keyFeatures: string[];
  priceAmount: number;
  currency: string;
  stockQty: number;
  slug: string;
  isActive: boolean;
  featured: boolean;
  source: string;
  category: string;
  categoryLabel: string;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeSlug(value: unknown) {
  return sanitizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function slugifyCategory(value: unknown) {
  return sanitizeText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const categoryLabelByKey = PRODUCT_CATEGORY_DEFINITIONS.reduce<Record<string, string>>((acc, category) => {
  acc[category.key] = category.label;
  return acc;
}, {});

const categoryKeyBySlug = PRODUCT_CATEGORY_DEFINITIONS.reduce<Record<string, string>>((acc, category) => {
  acc[slugifyCategory(category.key)] = category.key;
  acc[slugifyCategory(category.label)] = category.key;
  return acc;
}, {});

Object.entries(CATEGORY_SYNONYMS).forEach(([categoryKey, aliases]) => {
  aliases.forEach((alias) => {
    categoryKeyBySlug[slugifyCategory(alias)] = categoryKey;
  });
});

function normalizeCategoryKey(categoryKey: unknown) {
  return categoryKeyBySlug[slugifyCategory(categoryKey)] || "";
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeInteger(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 8);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n|,/).map((item) => sanitizeText(item)).filter(Boolean).slice(0, 8);
  }
  return [] as string[];
}

function compareProducts(left: Product, right: Product) {
  if (left.featured !== right.featured) return Number(right.featured) - Number(left.featured);
  return left.name.localeCompare(right.name);
}

export function inferProductCategory(product: Partial<Product>) {
  const text = [product.name, product.brand, product.type, product.bestFor, product.size, product.description, ...(product.keyFeatures ?? [])]
    .map((value) => sanitizeText(value).toLowerCase())
    .join(" ");

  return CATEGORY_KEYWORDS.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.key ?? FALLBACK_CATEGORY;
}

export function getCategoryLabel(categoryKey: unknown) {
  return categoryLabelByKey[normalizeCategoryKey(categoryKey)] || categoryLabelByKey[FALLBACK_CATEGORY];
}

export function resolveProductCategory(categoryKey: unknown) {
  const normalizedKey = normalizeCategoryKey(categoryKey);
  if (!normalizedKey) return null;
  return PRODUCT_CATEGORY_DEFINITIONS.find((category) => category.key === normalizedKey) ?? null;
}

export function buildCollectionPath(categoryKey: unknown) {
  const category = resolveProductCategory(categoryKey);
  return category ? `/collections/${category.key}` : "/products";
}

export function isValidProductCategory(categoryKey: unknown) {
  return Boolean(normalizeCategoryKey(categoryKey));
}

export function normalizeProduct(rawProduct: Partial<Product>, fallbackId: string): Product {
  const safeName = sanitizeText(rawProduct.name) || "Unnamed product";
  const safeKeyFeatures = normalizeStringList(rawProduct.keyFeatures);
  const inferredCategory = inferProductCategory({ ...rawProduct, name: safeName, keyFeatures: safeKeyFeatures });
  const finalCategory = normalizeCategoryKey(rawProduct.category) || inferredCategory;

  return {
    id: sanitizeText(rawProduct.id) || fallbackId,
    name: safeName,
    size: sanitizeText(rawProduct.size) || "N/A",
    type: sanitizeText(rawProduct.type) || "Electrical item",
    bestFor: sanitizeText(rawProduct.bestFor) || "General electrical use",
    imageUrl: sanitizeText(rawProduct.imageUrl),
    brand: sanitizeText(rawProduct.brand) || "Oduzz",
    description: sanitizeText(rawProduct.description),
    keyFeatures: safeKeyFeatures,
    priceAmount: Math.max(0, normalizeInteger(rawProduct.priceAmount, 0)),
    currency: sanitizeText(rawProduct.currency).toUpperCase() || FALLBACK_CURRENCY,
    stockQty: Math.max(0, normalizeInteger(rawProduct.stockQty, 0)),
    slug: sanitizeSlug(rawProduct.slug) || sanitizeSlug(safeName) || sanitizeSlug(fallbackId),
    isActive: normalizeBoolean(rawProduct.isActive, true),
    featured: normalizeBoolean(rawProduct.featured, false),
    source: sanitizeText(rawProduct.source).toLowerCase() || "catalog",
    category: finalCategory,
    categoryLabel: getCategoryLabel(finalCategory),
  };
}

export function formatProductPrice(product: Partial<Product>) {
  const amount = Number(product.priceAmount || 0);
  const currency = sanitizeText(product.currency).toUpperCase() || FALLBACK_CURRENCY;
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function getProductAvailability(product: Partial<Product>) {
  if (!product.isActive) return "Inactive";
  if ((product.stockQty || 0) <= 0) return "Out of stock";
  if ((product.stockQty || 0) <= 5) return "Low stock";
  return "In stock";
}

export function buildProductPath(product: Partial<Product>) {
  const slug = sanitizeSlug(product.slug) || sanitizeText(product.id);
  return slug ? `/products/${slug}` : "/products";
}

function normalizeCardCopyText(value: unknown) {
  return sanitizeText(value).replace(/\s+/g, " ");
}

function ensureSentence(value: unknown) {
  const text = normalizeCardCopyText(value).replace(/[.!?]+$/, "");
  if (!text) return "";
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function joinListWithAnd(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildProductTagline(product: Partial<Product>) {
  const description = normalizeCardCopyText(product.description);
  const firstDescriptionSentence = description.split(/[.!?]/).find((part) => sanitizeText(part));

  if (firstDescriptionSentence) {
    const shortDescription = normalizeCardCopyText(firstDescriptionSentence);
    if (shortDescription.length >= 28 && shortDescription.length <= 88) {
      return ensureSentence(shortDescription);
    }
  }

  const useCases = normalizeCardCopyText(product.bestFor)
    .split("|")
    .map((value) => sanitizeText(value).toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
  const productContext = `${product.name || ""} ${product.type || ""}`.toLowerCase();

  if (useCases.length > 0) {
    if (/socket|outlet/.test(productContext)) {
      return ensureSentence(`Confident power access for ${joinListWithAnd(useCases)}`);
    }
    if (/switch/.test(productContext)) {
      return ensureSentence(`Smooth control built for ${joinListWithAnd(useCases)}`);
    }
    if (/cable|wire/.test(productContext)) {
      return ensureSentence(`Dependable current delivery for ${joinListWithAnd(useCases)}`);
    }
    if (/light|lamp|bulb|led|flood/.test(productContext)) {
      return ensureSentence(`Clean illumination for ${joinListWithAnd(useCases)}`);
    }
    return ensureSentence(`Designed for ${joinListWithAnd(useCases)}`);
  }

  const typeLabel = normalizeCardCopyText(product.type).toLowerCase();
  if (typeLabel && typeLabel !== "electrical item") {
    return ensureSentence(`Built for dependable ${typeLabel} performance`);
  }

  return "Built for dependable daily performance.";
}

function buildFallbackProductHighlights(product: Partial<Product>) {
  const highlightSet = new Map<string, string>();
  const pushHighlight = (value: string) => {
    const normalized = ensureSentence(value).slice(0, -1);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!highlightSet.has(key)) {
      highlightSet.set(key, normalized);
    }
  };

  const productContext = [
    product.name,
    product.type,
    product.size,
    product.bestFor,
    product.description,
    ...(Array.isArray(product.keyFeatures) ? product.keyFeatures : []),
  ]
    .join(" ")
    .toLowerCase();

  if (/fire/.test(productContext)) pushHighlight("Fire-resistant material");
  if (/shock/.test(productContext)) pushHighlight("Shock protection");
  if (/durable|durability|lasting|long-lasting|long lasting/.test(productContext)) {
    pushHighlight("Built for lasting service");
  }
  if (/socket|outlet/.test(productContext)) {
    pushHighlight("Convenient multi-point power access");
    pushHighlight("Clean wall-mounted finish");
    pushHighlight("Made for repeated daily use");
  } else if (/switch/.test(productContext)) {
    pushHighlight("Responsive switching feel");
    pushHighlight("Clean wall-mounted finish");
    pushHighlight("Built for everyday operation");
  } else if (/cable|wire/.test(productContext)) {
    pushHighlight("Durable outer insulation");
    pushHighlight("Organized cable routing");
    pushHighlight("Made for neat installations");
  } else if (/breaker|mcb|distribution|panel|isolator|rcbo/.test(productContext)) {
    pushHighlight("Clear circuit control");
    pushHighlight("Installation-ready form factor");
    pushHighlight("Built for dependable operation");
  } else if (/light|lamp|bulb|led|flood/.test(productContext)) {
    pushHighlight("Clean modern light output");
    pushHighlight("Low-maintenance service life");
    pushHighlight("Suited to contemporary spaces");
  }

  pushHighlight("Reliable for daily electrical use");
  pushHighlight("Installation-ready finish");
  pushHighlight("Made for lasting performance");

  return Array.from(highlightSet.values()).slice(0, 3);
}

export function buildProductHighlights(product: Partial<Product>) {
  const directHighlights = Array.isArray(product.keyFeatures)
    ? product.keyFeatures
        .map((value) => normalizeCardCopyText(value).replace(/[.!?]+$/, ""))
        .filter(Boolean)
        .filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .slice(0, 3)
    : [];

  if (directHighlights.length >= 3) return directHighlights;

  const mergedHighlights = [...directHighlights];
  buildFallbackProductHighlights(product).forEach((highlight) => {
    if (!mergedHighlights.some((item) => item.toLowerCase() === highlight.toLowerCase())) {
      mergedHighlights.push(highlight);
    }
  });

  return mergedHighlights.slice(0, 3);
}

export type ProductCredibilityNotes = {
  bestUseCase: string;
  safetyNote: string;
  installationNote: string;
  compatibilityNote: string;
  bulkAvailabilityNote: string;
  confirmBeforePaymentNote: string;
};

export function buildProductCredibilityNotes(product: Partial<Product>): ProductCredibilityNotes {
  const useCases = sanitizeText(product.bestFor)
    .split("|")
    .map((value) => sanitizeText(value).toLowerCase())
    .filter(Boolean);
  const useCaseText = useCases.length > 0 ? joinListWithAnd(useCases) : "general electrical applications";

  const context = [
    sanitizeText(product.name),
    sanitizeText(product.type),
    sanitizeText(product.category),
    sanitizeText(product.description),
    ...(Array.isArray(product.keyFeatures) ? product.keyFeatures.map((item) => sanitizeText(item)) : []),
  ]
    .join(" ")
    .toLowerCase();

  let safetyNote =
    "Use a qualified electrician and isolate power before handling this item in any live installation area.";
  let installationNote =
    "Installation approach should match site conditions, circuit loading, and the final finish level required.";
  let compatibilityNote =
    "Confirm this item matches your existing electrical setup, accessory size, and intended application before payment.";

  if (/cable|wire|conduit|trunking/.test(context)) {
    safetyNote =
      "Confirm cable and protection sizing against load requirements to reduce overheating and insulation risk.";
    installationNote =
      "Route through approved containment, protect bends and junction points, and keep terminations clean and labeled.";
    compatibilityNote =
      "Verify conductor size, insulation class, and pathway fit with your conduit, trunking, and panel entry points.";
  } else if (/breaker|mcb|rccb|rcbo|panel|distribution|isolator|fuse|surge/.test(context)) {
    safetyNote =
      "Protection ratings must match the connected load profile and fault level; avoid direct substitution without verification.";
    installationNote =
      "Install in correctly sized enclosures with clear circuit labeling and termination torque checks.";
    compatibilityNote =
      "Confirm breaker format, panel rail compatibility, and coordination with upstream and downstream protection.";
  } else if (/socket|outlet|switch/.test(context)) {
    safetyNote =
      "Ensure the circuit is isolated and correctly protected before replacing switches or sockets.";
    installationNote =
      "Mount on secure back boxes, maintain proper polarity, and test operation under normal use after installation.";
    compatibilityNote =
      "Confirm gang format, plate style, and electrical rating with your existing wall box and accessory line.";
  } else if (/solar|inverter|battery|ups|charger/.test(context)) {
    safetyNote =
      "Backup power accessories should be paired with proper isolation and protection to avoid battery or inverter faults.";
    installationNote =
      "Install with load-priority planning, cable protection, and clear separation between AC and backup circuits.";
    compatibilityNote =
      "Confirm voltage class, inverter capacity, and accessory support with your current backup architecture.";
  } else if (/cctv|camera|dvr|nvr|poe|security|intercom|alarm/.test(context)) {
    safetyNote =
      "Security equipment should use stable power paths and protected cable routing to reduce downtime and signal issues.";
    installationNote =
      "Place for real coverage first, then secure mounts, connectors, and recorder settings before handover.";
    compatibilityNote =
      "Confirm camera protocol, recorder channel type, storage support, and power method before procurement.";
  } else if (/light|lamp|bulb|flood|chandelier|downlight|spot/.test(context)) {
    safetyNote =
      "Match fixture and control accessories to circuit protection and environment to prevent heat or trip issues.";
    installationNote =
      "Use secure mounting points, maintain clean terminations, and test switching groups for balanced output.";
    compatibilityNote =
      "Confirm fitting type, mounting depth, and control method with your ceiling design and switching layout.";
  }

  return {
    bestUseCase: `Best use case: ${useCaseText}.`,
    safetyNote,
    installationNote,
    compatibilityNote,
    bulkAvailabilityNote:
      "Bulk availability is confirmed per order. Live quantities can change during active projects and restock cycles.",
    confirmBeforePaymentNote:
      "Confirm final spec, quantity, delivery location, and availability with Oduzz before payment.",
  };
}

export function buildProductCatalog(products: Array<Partial<Product>>, { includeInactive = false } = {}) {
  const normalizedItems = products.map((item, index) => normalizeProduct(item, `product-${index + 1}`));
  const visibleItems = includeInactive ? normalizedItems : normalizedItems.filter((item) => item.isActive);
  const buckets = PRODUCT_CATEGORY_DEFINITIONS.reduce<Record<string, Product[]>>((acc, category) => {
    acc[category.key] = [];
    return acc;
  }, {});

  visibleItems.forEach((item) => {
    const key = buckets[item.category] ? item.category : FALLBACK_CATEGORY;
    buckets[key].push(item);
  });

  return {
    groups: PRODUCT_CATEGORY_DEFINITIONS.map((category) => ({
      key: category.key,
      label: category.label,
      items: buckets[category.key].sort(compareProducts),
    })).filter((group) => group.items.length > 0),
    items: visibleItems,
  };
}

export function selectMixedProducts(products: Array<Partial<Product>>, limit = 10) {
  const safeLimit = Math.max(0, Number.parseInt(String(limit), 10) || 0);
  if (!safeLimit) return [] as Product[];

  const { groups, items } = buildProductCatalog(products);
  const pickedIds = new Set<string>();
  const mixed: Product[] = [];

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
