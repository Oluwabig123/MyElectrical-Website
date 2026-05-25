export type ApplianceEntry = {
  name: string;
  quantity?: number;
  wattage?: number;
  label: string;
};

export type PanelSpecs = {
  quantity?: number;
  wattage?: number;
  voc?: number;
  vmp?: number;
  isc?: number;
  imp?: number;
};

export type ConsultationEntities = {
  inverter_voltage?: string;
  inverter_size?: string;
  inverter_type?: string;
  total_load_watts?: number;
  battery_voltage?: string;
  battery_model?: string;
  panel_model?: string;
  appliances?: string[];
  appliance_details?: ApplianceEntry[];
  appliance_quantity?: Record<string, number>;
  appliance_wattage?: Record<string, number>;
  backup_hours?: number;
  budget?: string;
  protection_components?: string[];
  panel_specs?: PanelSpecs;
  load_surge_details?: string;
  issue?: string;
  location?: string;
  service_type?: string;
  urgency?: string;
  property_type?: string;
  room_purpose?: string;
  coverage_needs?: string[];
  project_type?: string;
  control_zones?: string;
  has_media_hint?: boolean;
};

const APPLIANCE_ALIASES = [
  { name: "TV", pattern: /\b(?:tv|television)\b/i, singular: "TV", plural: "TVs" },
  { name: "freezer", pattern: /\b(?:freezer|deep freezer)\b/i, singular: "freezer", plural: "freezers" },
  { name: "fridge", pattern: /\b(?:fridge|refrigerator)\b/i, singular: "fridge", plural: "fridges" },
  { name: "laptop", pattern: /\blaptops?\b/i, singular: "laptop", plural: "laptops" },
  { name: "fan", pattern: /\bfans?\b/i, singular: "fan", plural: "fans" },
  { name: "bulb", pattern: /\b(?:bulbs?|lights?)\b/i, singular: "bulb", plural: "bulbs" },
  { name: "AC", pattern: /\b(?:ac|air ?conditioner)\b/i, singular: "AC", plural: "ACs" },
  { name: "pump", pattern: /\b(?:pump|pumping machine)\b/i, singular: "pump", plural: "pumps" },
  { name: "decoder", pattern: /\bdecoders?\b/i, singular: "decoder", plural: "decoders" },
  { name: "router", pattern: /\b(?:router|wifi)\b/i, singular: "router", plural: "routers" },
];

function sanitizeText(value: unknown) {
  return String(value || "").trim();
}

function formatQuantityLabel(quantity: number | undefined, singular: string, plural: string) {
  if (!quantity || quantity <= 1) return singular;
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function findQuantity(text: string, matchText: string) {
  const escaped = matchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = text.match(new RegExp(`(?:^|\\b)(\\d+)\\s+(?:${escaped})\\b`, "i"));
  if (before?.[1]) return parseNumber(before[1]);

  const after = text.match(new RegExp(`\\b(?:${escaped})\\s*(?:x|×)?\\s*(\\d+)\\b`, "i"));
  if (after?.[1]) return parseNumber(after[1]);

  return undefined;
}

function extractAppliances(text: string) {
  const details: ApplianceEntry[] = [];
  const quantities: Record<string, number> = {};
  const wattages: Record<string, number> = {};

  for (const appliance of APPLIANCE_ALIASES) {
    const match = text.match(appliance.pattern);
    if (!match) continue;

    const quantity = findQuantity(text, match[0]);
    const wattageMatch = text.match(
      new RegExp(`(?:${match[0]}|${appliance.name})[^.\\n,;]{0,24}?(\\d+(?:\\.\\d+)?)\\s*w\\b`, "i"),
    );
    const wattage = parseNumber(wattageMatch?.[1]);
    const label = formatQuantityLabel(quantity, appliance.singular, appliance.plural);

    details.push({
      name: appliance.name,
      quantity,
      wattage,
      label,
    });

    if (quantity) quantities[appliance.name] = quantity;
    if (wattage) wattages[appliance.name] = wattage;
  }

  return {
    appliances: details.map((item) => item.label),
    appliance_details: details,
    appliance_quantity: quantities,
    appliance_wattage: wattages,
  };
}

function extractPanelSpecs(text: string): PanelSpecs | undefined {
  const specs: PanelSpecs = {};
  const quantity = text.match(/(\d+)\s*(?:x\s*)?(?:panels?|solar panels?)/i)?.[1];
  const wattage =
    text.match(/\b(\d+(?:\.\d+)?)\s*w(?:att)?\s*(?:solar\s*)?panels?\b/i)?.[1] ||
    text.match(/\b(?:solar\s*)?panels?[^.\n,;]{0,24}?(\d+(?:\.\d+)?)\s*w\b/i)?.[1];
  const voc = text.match(/\bvoc\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1];
  const vmp = text.match(/\bvmp\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1];
  const isc = text.match(/\bisc\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1];
  const imp = text.match(/\bimp\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1];

  if (quantity) specs.quantity = Number(quantity);
  if (wattage) specs.wattage = Number(wattage);
  if (voc) specs.voc = Number(voc);
  if (vmp) specs.vmp = Number(vmp);
  if (isc) specs.isc = Number(isc);
  if (imp) specs.imp = Number(imp);

  return Object.keys(specs).length ? specs : undefined;
}

function extractModel(text: string, label: "battery" | "panel") {
  const match = text.match(new RegExp(`\\b${label}\\b[^.\\n,;:]*[:=]?\\s*([a-z0-9][a-z0-9\\-\\s/]{2,40})`, "i"));
  return match?.[1]?.trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractLocation(text: string) {
  const lower = text.toLowerCase();
  const knownLocations = [
    "ikorodu",
    "lekki",
    "ajah",
    "victoria island",
    "vi",
    "ikeja",
    "yaba",
    "surulere",
    "lagos island",
    "mainland",
    "lagos",
  ];
  const direct = knownLocations.find((location) => lower.includes(location));

  if (direct) {
    return direct === "vi" ? "Victoria Island" : titleCase(direct);
  }

  const fallback = text.match(
    /\b(?:in|at|from|around|near|location is|located in)\s+([a-z][a-z\s-]{2,40})(?:[.,;!?]|$)/i,
  );
  const candidate = sanitizeText(fallback?.[1] || "").replace(/\s+/g, " ");
  const genericPlaces = new Set(["the house", "house", "home", "my house", "my home", "shop", "office"]);

  return candidate && !genericPlaces.has(candidate.toLowerCase()) ? titleCase(candidate) : "";
}

function extractServiceType(text: string) {
  const lower = text.toLowerCase();
  if (/(solar|inverter|battery|panel)/.test(lower)) return "solar/inverter";
  if (/(cctv|camera|surveillance|dvr|nvr|remote viewing|security setup)/.test(lower)) return "CCTV";
  if (/(wiring|rewiring|breaker|tripping|fault|socket|panel|db|distribution board)/.test(lower)) {
    return "electrical fault/wiring";
  }
  if (/(lighting|chandelier|pop light|downlight|spotlight|fixture)/.test(lower)) return "lighting";
  if (/(smart home|smart switch|automation)/.test(lower)) return "smart home";
  if (/(cable|wire|materials?|product|breaker|switch|socket)/.test(lower)) return "materials";
  return "";
}

function extractUrgency(text: string) {
  const lower = text.toLowerCase();
  if (/(urgent|asap|immediately|today|now|emergency)/.test(lower)) return "urgent";
  if (/(tomorrow|this week|soon|quickly)/.test(lower)) return "soon";
  if (/(routine|whenever|no rush|later)/.test(lower)) return "routine";
  return "";
}

function extractPropertyType(text: string) {
  const lower = text.toLowerCase();
  if (/\b(shop|store|retail)\b/.test(lower)) return "shop";
  if (/\b(office|workspace)\b/.test(lower)) return "office";
  if (/\b(home|house|flat|apartment)\b/.test(lower)) return "home";
  if (/\b(compound|estate)\b/.test(lower)) return "compound";
  if (/\b(warehouse)\b/.test(lower)) return "warehouse";
  return "";
}

function extractRoomPurpose(text: string) {
  const lower = text.toLowerCase();
  if (/\b(living room|parlour|sitting room)\b/.test(lower)) return "living room";
  if (/\b(bedroom)\b/.test(lower)) return "bedroom";
  if (/\b(kitchen)\b/.test(lower)) return "kitchen";
  if (/\b(shop|store)\b/.test(lower)) return "shop";
  if (/\b(office)\b/.test(lower)) return "office";
  if (/\b(outdoor|compound|exterior)\b/.test(lower)) return "outdoor area";
  return "";
}

function extractCoverageNeeds(text: string) {
  const lower = text.toLowerCase();
  const needs: string[] = [];
  if (/(entry|entrance|gate|door)/.test(lower)) needs.push("entry points");
  if (/(perimeter|outside|exterior|compound)/.test(lower)) needs.push("perimeter");
  if (/(indoor|inside|counter|stock|hall|room)/.test(lower)) needs.push("indoor zones");
  if (/(remote view|phone view|remote access)/.test(lower)) needs.push("remote viewing");
  if (/(backup|inverter|power backup)/.test(lower)) needs.push("backup-aware monitoring");
  return needs;
}

function extractProjectType(text: string) {
  const lower = text.toLowerCase();
  if (/(new build|new house|new project|new installation)/.test(lower)) return "new installation";
  if (/(replace|replacement|change old)/.test(lower)) return "replacement";
  if (/(upgrade|renovation|remodel)/.test(lower)) return "upgrade";
  return "";
}

function extractControlZones(text: string) {
  const explicit = text.match(/(\d+)\s*(?:zones|switch zones|control zones)/i);
  if (explicit?.[1]) return `${explicit[1]} zones`;
  if (/(separate switch|different switch|layered control)/i.test(text)) return "multiple zones";
  return "";
}

export function extractConsultationEntities(input: unknown): ConsultationEntities {
  const text = sanitizeText(input);
  if (!text) return {};

  const entities: ConsultationEntities = {};
  const inverterVoltage = text.match(/\b(?:inverter[^.\n,;]{0,30})?(12|24|48|96)\s*v\b/i)?.[1];
  const batteryVoltage = text.match(/\bbattery[^.\n,;]{0,30}?(12|24|48|96)\s*v\b/i)?.[1];
  const inverterSize =
    text.match(/\binverter[^.\n,;]{0,30}?(\d+(?:\.\d+)?)\s*(kva|kw|va|w)\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*kva\b/i);
  const totalLoad =
    text.match(/\b(?:total\s+load|load|appliances?\s+need|power)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(kw|w)\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(kw|w)\s+(?:critical\s+load|load|total load)\b/i);
  const backupHours =
    text.match(/\b(?:for|backup|last|run|running|need)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i)?.[1] ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i)?.[1];
  const inverterType = text.match(/\b(transformerless|transformer-based|transformer based|hybrid|off-?grid|grid-?tie)\b/i)?.[1];
  const budget = text.match(/\b(?:budget|around|about|under|below|ngn|₦|naira)\s*[:=]?\s*(₦?\s*[\d,.]+(?:\s*(?:k|m|million|thousand))?)/i)?.[1];
  const protection = text.match(/\b(?:breaker|mcb|mccb|fuse|spd|isolator|earthing|rcd|elcb|changeover)\b/gi);
  const panelSpecs = extractPanelSpecs(text);
  const applianceData = extractAppliances(text);
  const location = extractLocation(text);
  const serviceType = extractServiceType(text);
  const urgency = extractUrgency(text);
  const propertyType = extractPropertyType(text);
  const roomPurpose = extractRoomPurpose(text);
  const coverageNeeds = extractCoverageNeeds(text);
  const projectType = extractProjectType(text);
  const controlZones = extractControlZones(text);

  if (inverterVoltage) entities.inverter_voltage = `${inverterVoltage.toUpperCase()}V`;
  if (batteryVoltage) entities.battery_voltage = `${batteryVoltage.toUpperCase()}V`;
  if (inverterSize) entities.inverter_size = `${inverterSize[1]}${inverterSize[2] || "kVA"}`.replace(/\s+/g, "");
  if (totalLoad) {
    const amount = Number(totalLoad[1]);
    const unit = totalLoad[2].toLowerCase();
    if (Number.isFinite(amount)) entities.total_load_watts = unit === "kw" ? amount * 1000 : amount;
  }
  if (inverterType) entities.inverter_type = inverterType.toLowerCase();
  if (backupHours) entities.backup_hours = Number(backupHours);
  if (budget) entities.budget = budget.replace(/\s+/g, " ").trim();
  if (protection?.length) entities.protection_components = Array.from(new Set(protection.map((item) => item.toLowerCase())));
  if (panelSpecs) entities.panel_specs = panelSpecs;
  if (location) entities.location = location;
  if (serviceType) entities.service_type = serviceType;
  if (urgency) entities.urgency = urgency;
  if (propertyType) entities.property_type = propertyType;
  if (roomPurpose) entities.room_purpose = roomPurpose;
  if (coverageNeeds.length) entities.coverage_needs = coverageNeeds;
  if (projectType) entities.project_type = projectType;
  if (controlZones) entities.control_zones = controlZones;
  if (/\b(?:photo|photos|video|videos|picture|pictures|image|images)\b/i.test(text)) {
    entities.has_media_hint = true;
  }
  if (applianceData.appliances.length) {
    entities.appliances = applianceData.appliances;
    entities.appliance_details = applianceData.appliance_details;
  }
  if (Object.keys(applianceData.appliance_quantity).length) {
    entities.appliance_quantity = applianceData.appliance_quantity;
  }
  if (Object.keys(applianceData.appliance_wattage).length) {
    entities.appliance_wattage = applianceData.appliance_wattage;
  }

  const batteryModel = extractModel(text, "battery");
  const panelModel = extractModel(text, "panel");
  if (batteryModel) entities.battery_model = batteryModel;
  if (panelModel) entities.panel_model = panelModel;

  if (/\b(?:spark|shock|burnt|burning|smoke|tripping|unsafe|exposed)\b/i.test(text)) {
    entities.issue = text;
  }

  if (/\b(?:freezer|fridge|pump|ac|air ?conditioner)\b/i.test(text) && /\b(?:hp|horsepower|inverter freezer|deep freezer|\d+\s*w)\b/i.test(text)) {
    entities.load_surge_details = text;
  }

  return entities;
}
