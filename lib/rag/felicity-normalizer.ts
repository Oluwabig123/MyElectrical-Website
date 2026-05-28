import { createHash } from "node:crypto";
import type { ProductType } from "@/lib/engineering/types";
import type { RawFelicityProductPage } from "@/lib/rag/felicity-parser";

export type RagChunkType =
  | "overview"
  | "electrical_specs"
  | "compatibility"
  | "installation_notes"
  | "charging_behavior"
  | "protection_recommendations";

export type FelicityRagChunk = {
  type: RagChunkType;
  text: string;
  metadata: Record<string, unknown>;
};

export type NormalizedFelicityProduct = {
  brand: "Felicity Solar";
  title: string;
  model: string;
  productType: ProductType;
  productCategory: string;
  sourceUrl: string;
  description: string;
  images: string[];
  specs: Record<string, unknown>;
  rawSpecs: Record<string, string>;
  summary: string;
  recommendationContext: string;
  chunks: FelicityRagChunk[];
  contentHash: string;
};

function sanitizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: digits,
  }).format(value);
}

function firstMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1] || "";
}

function parseNumber(value: unknown) {
  const text = sanitizeText(value).replace(/,/g, "");
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeVoltage(value: unknown) {
  const text = sanitizeText(value);
  const parsed = parseNumber(text);
  if (parsed === null) return null;
  if (/\bkv\b/i.test(text)) return parsed * 1000;
  return parsed;
}

export function normalizeWattage(value: unknown) {
  const text = sanitizeText(value);
  const parsed = parseNumber(text);
  if (parsed === null) return null;
  if (/\b(mw)\b/i.test(text)) return parsed * 1000000;
  if (/\b(kva|kw|k w)\b/i.test(text)) return parsed * 1000;
  if (/\bva\b/i.test(text) && !/\bkva\b/i.test(text)) return parsed;
  return parsed;
}

export function normalizeCurrent(value: unknown) {
  const parsed = parseNumber(value);
  return parsed === null ? null : parsed;
}

export function normalizeBatteryCapacity(value: unknown, voltageHint?: unknown) {
  const text = sanitizeText(value);
  const voltage = normalizeVoltage(firstMatch(text, /(\d+(?:\.\d+)?)\s*v(?:olt)?s?/i)) ?? normalizeVoltage(voltageHint);
  const capacityAh = parseNumber(firstMatch(text, /(\d+(?:\.\d+)?)\s*a\s*h\b/i)) ?? null;
  const energyKwh = parseNumber(firstMatch(text, /(\d+(?:\.\d+)?)\s*k\s*w\s*h\b/i));
  const energyWh = parseNumber(firstMatch(text, /(\d+(?:\.\d+)?)\s*w\s*h\b/i));

  return {
    voltage,
    capacityAh,
    energyWh:
      energyWh ??
      (energyKwh !== null ? energyKwh * 1000 : voltage && capacityAh ? voltage * capacityAh : null),
  };
}

function findSpec(specs: Record<string, string>, aliases: RegExp[]) {
  for (const [key, value] of Object.entries(specs)) {
    const haystack = `${normalizeKey(key).replace(/_/g, " ")} ${key}`.toLowerCase();
    if (aliases.some((alias) => alias.test(haystack))) return value;
  }

  return "";
}

function extractModel(page: RawFelicityProductPage) {
  const fromSpecs = findSpec(page.specs, [/\bmodel\b/, /\btype\b/]);
  const candidate = sanitizeText(fromSpecs || page.title)
    .replace(/^felicity\s+(solar\s+)?/i, "")
    .replace(/\b(lithium|gel|battery|hybrid|off[-\s]?grid|inverter|solar panel|charge controller)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return candidate || page.title;
}

function valueList(value: string) {
  return sanitizeText(value)
    .split(/[,/;|]+/)
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .join(", ");
}

function normalizeBatterySpecs(page: RawFelicityProductPage) {
  const voltageValue = findSpec(page.specs, [/\bnominal_voltage\b/, /\brated_voltage\b/, /\bvoltage\b/]);
  const capacityValue = findSpec(page.specs, [/\bcapacity\b/, /\bnominal_capacity\b/]);
  const batteryCapacity = normalizeBatteryCapacity(capacityValue, voltageValue);
  const voltage = batteryCapacity.voltage ?? normalizeVoltage(voltageValue);
  const capacityAh = batteryCapacity.capacityAh ?? parseNumber(capacityValue);
  const energyWh = batteryCapacity.energyWh ?? (voltage && capacityAh ? voltage * capacityAh : null);
  const chemistryText = findSpec(page.specs, [/\bchemistry\b/, /\bcell_type\b/, /\bbattery_type\b/]) || page.rawText;
  const categoryText = page.category || "";
  const batteryType = /gel/i.test(categoryText) ? "gel" : /lithium|lifepo4|li-ion/i.test(chemistryText) ? "lithium" : categoryText;

  return {
    battery_type: batteryType,
    voltage,
    nominal_voltage: voltage,
    capacity_ah: capacityAh,
    capacity_kwh: energyWh ? energyWh / 1000 : null,
    energy_wh: energyWh,
    chemistry: /lifepo4/i.test(chemistryText) ? "LiFePO4" : /lithium|li-ion/i.test(chemistryText) ? "Lithium" : /gel/i.test(chemistryText) ? "Gel" : null,
    recommended_dod: findSpec(page.specs, [/\bdod\b/, /\bdepth_of_discharge\b/]) || null,
    cycle_life: findSpec(page.specs, [/\bcycle\b/, /\blife\b/]) || null,
    max_charge_current: normalizeCurrent(findSpec(page.specs, [/\bmax_charge_current\b/, /\bcharging_current\b/, /\bcharge_current\b/])),
    max_charge_current_a: normalizeCurrent(findSpec(page.specs, [/\bmax_charge_current\b/, /\bcharging_current\b/, /\bcharge_current\b/])),
    max_discharge_current: normalizeCurrent(findSpec(page.specs, [/\bmax_discharge_current\b/, /\bdischarge_current\b/])),
    max_discharge_current_a: normalizeCurrent(findSpec(page.specs, [/\bmax_discharge_current\b/, /\bdischarge_current\b/])),
    communication_ports: valueList(findSpec(page.specs, [/\bcommunication\b/, /\bcan\b/, /\brs485\b/])),
    communication: valueList(findSpec(page.specs, [/\bcommunication\b/, /\bcan\b/, /\brs485\b/])),
    weight: findSpec(page.specs, [/\bweight\b/]) || null,
    dimensions: findSpec(page.specs, [/\bdimension\b/, /\bsize\b/]) || null,
  };
}

function parseMpptRange(value: string) {
  const text = sanitizeText(value);
  const matches = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (matches.length >= 2) return { mppt_min_v: Math.min(matches[0], matches[1]), mppt_max_v: Math.max(matches[0], matches[1]) };
  if (matches.length === 1) return { mppt_min_v: null, mppt_max_v: matches[0] };
  return { mppt_min_v: null, mppt_max_v: null };
}

function normalizeInverterSpecs(page: RawFelicityProductPage) {
  const mppt = parseMpptRange(findSpec(page.specs, [/\bmppt.*range\b/, /\bpv.*range\b/, /\bmppt_voltage\b/]));
  const maxPvVoltage = normalizeVoltage(findSpec(page.specs, [/\bmax.*pv.*voltage\b/, /\bmax.*solar.*voltage\b/, /\bmax_pv_voc\b/]));

  return {
    inverter_type: page.category === "off_grid_inverter" ? "off-grid" : "hybrid",
    system_voltage: normalizeVoltage(findSpec(page.specs, [/\bbattery_voltage\b/, /\bdc_voltage\b/, /\bsystem_voltage\b/])),
    nominal_voltage: normalizeVoltage(findSpec(page.specs, [/\bbattery_voltage\b/, /\bdc_voltage\b/, /\bsystem_voltage\b/])),
    output_power_w: normalizeWattage(findSpec(page.specs, [/\brated_power\b/, /\boutput_power\b/, /\bpower\b/, /\bcapacity\b/])),
    rated_power_w: normalizeWattage(findSpec(page.specs, [/\brated_power\b/, /\boutput_power\b/, /\bpower\b/, /\bcapacity\b/])),
    surge_power_w: normalizeWattage(findSpec(page.specs, [/\bsurge\b/, /\bpeak_power\b/])),
    output_waveform: findSpec(page.specs, [/\bwaveform\b/, /\bwave\b/]) || null,
    mppt_voltage_range: findSpec(page.specs, [/\bmppt.*range\b/, /\bpv.*range\b/, /\bmppt_voltage\b/]) || null,
    ...mppt,
    max_pv_input: normalizeWattage(findSpec(page.specs, [/\bmax.*pv.*power\b/, /\bmax.*solar.*power\b/, /\bpv_input_power\b/])),
    max_pv_power_w: normalizeWattage(findSpec(page.specs, [/\bmax.*pv.*power\b/, /\bmax.*solar.*power\b/, /\bpv_input_power\b/])),
    max_pv_voc: maxPvVoltage,
    max_pv_current_a: normalizeCurrent(findSpec(page.specs, [/\bmax.*pv.*current\b/, /\bpv.*current\b/])),
    charging_current: normalizeCurrent(findSpec(page.specs, [/\bmax.*charging_current\b/, /\bcharging_current\b/, /\bcharge_current\b/])),
    max_charge_current_a: normalizeCurrent(findSpec(page.specs, [/\bmax.*charging_current\b/, /\bcharging_current\b/, /\bcharge_current\b/])),
    efficiency: findSpec(page.specs, [/\befficiency\b/]) || null,
    parallel_support: findSpec(page.specs, [/\bparallel\b/]) || null,
    transfer_time: findSpec(page.specs, [/\btransfer_time\b/, /\btransfer\b/]) || null,
  };
}

function normalizeControllerSpecs(page: RawFelicityProductPage) {
  return {
    controller_type: /mppt/i.test(page.rawText) ? "MPPT" : /pwm/i.test(page.rawText) ? "PWM" : null,
    system_voltage: normalizeVoltage(findSpec(page.specs, [/\bsystem_voltage\b/, /\bbattery_voltage\b/, /\bvoltage\b/])),
    nominal_voltage: normalizeVoltage(findSpec(page.specs, [/\bsystem_voltage\b/, /\bbattery_voltage\b/, /\bvoltage\b/])),
    max_pv_voltage: normalizeVoltage(findSpec(page.specs, [/\bmax.*pv.*voltage\b/, /\bopen_circuit_voltage\b/])),
    max_pv_voc: normalizeVoltage(findSpec(page.specs, [/\bmax.*pv.*voltage\b/, /\bopen_circuit_voltage\b/])),
    max_charge_current: normalizeCurrent(findSpec(page.specs, [/\bcharge_current\b/, /\brated_current\b/, /\bcurrent\b/])),
    max_charge_current_a: normalizeCurrent(findSpec(page.specs, [/\bcharge_current\b/, /\brated_current\b/, /\bcurrent\b/])),
    supported_battery_types: valueList(findSpec(page.specs, [/\bbattery_type\b/, /\bsupported_battery\b/])),
    efficiency: findSpec(page.specs, [/\befficiency\b/]) || null,
  };
}

function normalizePanelSpecs(page: RawFelicityProductPage) {
  return {
    panel_type: /mono/i.test(page.rawText) ? "Monocrystalline" : /poly/i.test(page.rawText) ? "Polycrystalline" : null,
    wattage: normalizeWattage(findSpec(page.specs, [/\bmaximum_power\b/, /\brated_power\b/, /\bpower\b/, /\bwattage\b/])),
    rated_power_w: normalizeWattage(findSpec(page.specs, [/\bmaximum_power\b/, /\brated_power\b/, /\bpower\b/, /\bwattage\b/])),
    voc: normalizeVoltage(findSpec(page.specs, [/\bvoc\b/, /\bopen_circuit_voltage\b/])),
    vmp: normalizeVoltage(findSpec(page.specs, [/\bvmp\b/, /\bmaximum_power_voltage\b/])),
    isc: normalizeCurrent(findSpec(page.specs, [/\bisc\b/, /\bshort_circuit_current\b/])),
    imp: normalizeCurrent(findSpec(page.specs, [/\bimp\b/, /\bmaximum_power_current\b/])),
    efficiency: findSpec(page.specs, [/\befficiency\b/]) || null,
    dimensions: findSpec(page.specs, [/\bdimension\b/, /\bsize\b/]) || null,
  };
}

function removeEmptyValues(specs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(specs).filter(([, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
}

function normalizeSpecs(page: RawFelicityProductPage) {
  if (page.productType === "battery") return removeEmptyValues(normalizeBatterySpecs(page));
  if (page.productType === "hybrid_inverter" || page.productType === "inverter") {
    return removeEmptyValues(normalizeInverterSpecs(page));
  }
  if (page.productType === "charge_controller") return removeEmptyValues(normalizeControllerSpecs(page));
  if (page.productType === "solar_panel") return removeEmptyValues(normalizePanelSpecs(page));
  return {};
}

function buildSummary(page: RawFelicityProductPage, model: string, specs: Record<string, unknown>) {
  if (page.productType === "battery") {
    const voltage = specs.voltage ? `${specs.voltage}V` : "";
    const capacity = specs.capacity_ah ? `${specs.capacity_ah}Ah` : "";
    const energy = specs.energy_wh ? `approximately ${formatNumber(Number(specs.energy_wh) / 1000)}kWh` : "";
    return `Felicity ${[voltage, capacity, specs.battery_type, "battery"].filter(Boolean).join(" ")} ${energy ? `with ${energy} storage capacity` : ""}. Suitable for solar backup and inverter battery bank planning when voltage, current limits, and supported communication match the inverter.`;
  }

  if (page.productType === "hybrid_inverter" || page.productType === "inverter") {
    return `Felicity ${model} ${specs.inverter_type || ""} inverter with ${specs.output_power_w ? `${formatNumber(Number(specs.output_power_w), 0)}W` : "documented"} output class. Use its PV voltage, MPPT range, charge current, and battery voltage limits before selecting panels or battery bank size.`;
  }

  if (page.productType === "charge_controller") {
    return `Felicity ${model} charge controller for matching PV array voltage/current to compatible battery banks. Confirm max PV voltage, charge current, and supported battery chemistry before installation.`;
  }

  return `Felicity ${model} solar panel rated around ${specs.wattage || specs.rated_power_w || "the documented"}W. Use Voc, Vmp, Isc, and Imp values for inverter MPPT stringing and protection sizing.`;
}

function buildRecommendationContext(page: RawFelicityProductPage, specs: Record<string, unknown>) {
  const lines = ["Recommended for:"];

  if (page.productType === "battery") {
    const kwh = Number(specs.capacity_kwh || 0);
    if (kwh >= 8) lines.push("- 5kVA hybrid inverter systems and longer residential backup windows");
    else if (kwh >= 4) lines.push("- 3kVA to 5kVA inverter systems and moderate backup loads");
    else lines.push("- smaller backup banks or modular battery expansion");
    lines.push("- residential solar backup where battery voltage and current limits match the inverter");
  } else if (page.productType === "hybrid_inverter" || page.productType === "inverter") {
    lines.push("- inverter-led solar backup systems");
    lines.push("- PV array sizing after checking MPPT voltage range and max PV input");
    lines.push("- lithium or gel charging only when the documented charging profile supports that battery type");
  } else if (page.productType === "charge_controller") {
    lines.push("- standalone PV charge systems");
    lines.push("- battery banks within the controller voltage and charge-current limits");
  } else {
    lines.push("- PV arrays where Voc/Vmp stay inside inverter or controller limits");
    lines.push("- panel count planning from daily energy demand and available roof space");
  }

  return lines.join("\n");
}

function renderSpecBlock(specs: Record<string, unknown>) {
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("\n");
}

function clampChunk(text: string) {
  const clean = sanitizeText(text);
  if (clean.length <= 900) return clean;
  return `${clean.slice(0, 880).replace(/\s+\S*$/, "")}.`;
}

function buildChunks(page: RawFelicityProductPage, product: Omit<NormalizedFelicityProduct, "chunks" | "contentHash">) {
  const baseMetadata = {
    brand: product.brand,
    product_category: product.productCategory,
    product_model: product.model,
    source_url: product.sourceUrl,
  };
  const specBlock = renderSpecBlock(product.specs);
  const chunks: FelicityRagChunk[] = [
    {
      type: "overview",
      text: `${product.summary}\nSource: ${product.sourceUrl}`,
      metadata: baseMetadata,
    },
    {
      type: "electrical_specs",
      text: `Electrical specs for ${product.title}:\n${specBlock}`,
      metadata: baseMetadata,
    },
    {
      type: "compatibility",
      text: `${product.title} compatibility context:\n${product.recommendationContext}`,
      metadata: baseMetadata,
    },
    {
      type: "installation_notes",
      text: `${product.title} installation notes: verify cable route length, ventilation/clearance, DC isolation, breaker ratings, polarity, and earthing before final installation. Use the product manual and site measurements for final ratings.`,
      metadata: baseMetadata,
    },
    {
      type: "charging_behavior",
      text: `${product.title} charging behavior: confirm battery chemistry, charge voltage, charge current, MPPT range, and battery communication support before pairing with lithium or gel batteries.`,
      metadata: baseMetadata,
    },
    {
      type: "protection_recommendations",
      text: `${product.title} protection recommendations: include correctly rated DC breaker or fuse, PV isolator, SPD, AC breaker, earthing, MC4 connectors, and lugs. Final sizing depends on string current, battery current, inverter output current, and cable distance.`,
      metadata: baseMetadata,
    },
  ];

  if (page.description) {
    chunks.push({
      type: "overview",
      text: `${product.title} product description: ${page.description}`,
      metadata: baseMetadata,
    });
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      text: clampChunk(chunk.text),
      metadata: {
        ...chunk.metadata,
        chunk_type: chunk.type,
      },
    }))
    .filter((chunk) => chunk.text.length >= 80);
}

function buildHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function normalizeFelicityProduct(page: RawFelicityProductPage): NormalizedFelicityProduct {
  const specs = normalizeSpecs(page);
  const model = extractModel(page);
  const summary = buildSummary(page, model, specs);
  const recommendationContext = buildRecommendationContext(page, specs);
  const productWithoutChunks = {
    brand: "Felicity Solar" as const,
    title: page.title,
    model,
    productType: page.productType,
    productCategory: page.category || page.productType,
    sourceUrl: page.url,
    description: page.description,
    images: page.images,
    specs,
    rawSpecs: page.specs,
    summary,
    recommendationContext,
  };
  const chunks = buildChunks(page, productWithoutChunks);
  const contentHash = buildHash({
    model,
    specs,
    chunks: chunks.map((chunk) => chunk.text),
  });

  return {
    ...productWithoutChunks,
    chunks,
    contentHash,
  };
}
