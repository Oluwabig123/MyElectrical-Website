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
  const wattage = text.match(/\b(\d+(?:\.\d+)?)\s*w(?:att)?\s*(?:panel|solar)?\b/i)?.[1];
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

export function extractConsultationEntities(input: unknown): ConsultationEntities {
  const text = sanitizeText(input);
  if (!text) return {};

  const entities: ConsultationEntities = {};
  const inverterVoltage = text.match(/\b(?:inverter[^.\n,;]{0,30})?(12|24|48|96)\s*v\b/i)?.[1];
  const batteryVoltage = text.match(/\bbattery[^.\n,;]{0,30}?(12|24|48|96)\s*v\b/i)?.[1];
  const inverterSize = text.match(/\b(\d+(?:\.\d+)?)\s*(kva|kw|va|w)\b/i);
  const backupHours =
    text.match(/\b(?:for|backup|last|run|running|need)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i)?.[1] ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i)?.[1];
  const inverterType = text.match(/\b(transformerless|transformer-based|transformer based|hybrid|off-?grid|grid-?tie)\b/i)?.[1];
  const budget = text.match(/\b(?:budget|around|about|under|below|ngn|₦|naira)\s*[:=]?\s*(₦?\s*[\d,.]+(?:\s*(?:k|m|million|thousand))?)/i)?.[1];
  const protection = text.match(/\b(?:breaker|mcb|mccb|fuse|spd|isolator|earthing|rcd|elcb|changeover)\b/gi);
  const panelSpecs = extractPanelSpecs(text);
  const applianceData = extractAppliances(text);

  if (inverterVoltage) entities.inverter_voltage = `${inverterVoltage.toUpperCase()}V`;
  if (batteryVoltage) entities.battery_voltage = `${batteryVoltage.toUpperCase()}V`;
  if (inverterSize) entities.inverter_size = `${inverterSize[1]}${inverterSize[2]}`.replace(/\s+/g, "");
  if (inverterType) entities.inverter_type = inverterType.toLowerCase();
  if (backupHours) entities.backup_hours = Number(backupHours);
  if (budget) entities.budget = budget.replace(/\s+/g, " ").trim();
  if (protection?.length) entities.protection_components = Array.from(new Set(protection.map((item) => item.toLowerCase())));
  if (panelSpecs) entities.panel_specs = panelSpecs;
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
