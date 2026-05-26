import { assistantFlows, assistantFlowOrder, type AssistantFlowId } from "@/lib/assistant-flows";
import type { ApplianceEntry, ConsultationEntities } from "@/lib/ai/entity-extraction";
import {
  createConsultationState,
  normalizeConsultationState,
  refreshConsultationStateIndexes,
  type ConsultationChildState,
  type ConsultationState,
} from "@/lib/ai/consultation-state";
import {
  detectConversationIntent,
  getConsultationIntentLabel,
  type ConsultationIntent,
  type ConsultationIntentContext,
} from "@/lib/ai/intent-context";
import { estimateLoadWatts } from "@/lib/engineering/consultation-priority";

// The consultation engine is deliberately non-user-facing. It only normalizes
// state, detects missing fields, and recommends the next consultation move.
export type ConsultationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConsultationEngineRequest = {
  messages: ConsultationMessage[];
  intentContext?: ConsultationIntentContext | null;
  state?: ConsultationState | null;
};

export type ConsultationProgress = {
  stage:
    | "identify_intent"
    | "collect_load"
    | "collect_quantities"
    | "collect_backup_hours"
    | "clarify"
    | "estimate_load"
    | "engineering_recommendation"
    | "handoff";
  label: string;
  percent: number;
};

export type ConsultationGuide = {
  intent?: ConsultationIntent;
  requiredFields: string[];
  missingFields: string[];
  nextRecommendedQuestion: string;
  suggestedNextQuestion: string;
  progress: ConsultationProgress;
};

export type ConsultationAnalysis = {
  intent?: ConsultationIntent;
  childState?: ConsultationChildState;
  captured: ConsultationEntities;
  missingFields: string[];
  suggestedNextQuestion: string;
  progress: ConsultationProgress;
  pendingClarifications: string[];
  confidence: number;
};

const FLOW_INTENTS: Record<AssistantFlowId, ConsultationIntent> = {
  solar: "solar_sizing",
  battery: "battery_sizing",
  inverter: "inverter_recommendation",
  panels: "panel_recommendation",
  protection: "protection_recommendation",
  safety: "safety_check",
  wiring: "wiring_help",
  lighting: "lighting_recommendation",
  cctv: "cctv",
  quote: "quote",
  whatsapp: "whatsapp",
  materials: "materials_recommendation",
};

const POWER_INTENTS = new Set<ConsultationIntent>([
  "solar_sizing",
  "battery_sizing",
  "inverter_recommendation",
  "protection_recommendation",
]);

const BACKUP_INTENTS = new Set<ConsultationIntent>(["solar_sizing", "battery_sizing"]);

const APPLIANCE_PLURALS: Record<string, string> = {
  TV: "TVs",
  freezer: "freezers",
  fridge: "fridges",
  laptop: "laptops",
  fan: "fans",
  bulb: "bulbs",
  AC: "ACs",
  pump: "pumps",
  decoder: "decoders",
  router: "routers",
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeConsultationMessages(rawMessages: unknown) {
  return (Array.isArray(rawMessages) ? rawMessages : [])
    .map((message) => {
      const role = sanitizeText((message as { role?: unknown })?.role);
      const content = sanitizeText(
        (message as { content?: unknown; text?: unknown })?.content ||
          (message as { text?: unknown })?.text,
      );

      if (role !== "assistant" && role !== "user") return null;
      if (!content) return null;

      return { role, content } as ConsultationMessage;
    })
    .filter((message): message is ConsultationMessage => Boolean(message))
    .slice(-12);
}

export function latestUserMessage(messages: ConsultationMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function mergeUnique(existing: string[] = [], incoming: string[] = []) {
  return Array.from(new Set([...existing, ...incoming].map((item) => String(item).trim()).filter(Boolean)));
}

function mergeRecordWithoutOverwrite(
  existing: Record<string, number> | undefined,
  incoming: Record<string, number> | undefined,
) {
  const next = { ...(existing || {}) };

  for (const [key, value] of Object.entries(incoming || {})) {
    if (!hasValue(next[key]) && Number.isFinite(value)) {
      next[key] = value;
    }
  }

  return next;
}

function pluralizeApplianceName(name: string) {
  return APPLIANCE_PLURALS[name] || `${name}s`;
}

function formatApplianceLabel(item: ApplianceEntry) {
  if (!item.quantity) return item.label || item.name;
  const label = item.quantity === 1 ? item.name : pluralizeApplianceName(item.name);
  return `${item.quantity} ${label}`;
}

function mergeApplianceDetails(existing: ApplianceEntry[] = [], incoming: ApplianceEntry[] = []) {
  const rows = new Map<string, ApplianceEntry>();
  for (const item of existing) {
    rows.set(item.name.toLowerCase(), {
      ...item,
      label: formatApplianceLabel(item),
    });
  }

  for (const item of incoming) {
    const key = item.name.toLowerCase();
    const previous = rows.get(key);
    const merged: ApplianceEntry = {
      name: previous?.name || item.name,
      quantity: previous?.quantity || item.quantity,
      wattage: previous?.wattage || item.wattage,
      label: "",
    };
    merged.label = formatApplianceLabel(merged);
    rows.set(key, merged);
  }

  return Array.from(rows.values());
}

function mergePendingClarifications(existing: string[] = [], incoming: string[] = []) {
  return mergeUnique(existing, incoming).slice(-5);
}

export function mergeConsultationState(
  previous: ConsultationState | null | undefined,
  extracted: ConsultationEntities,
  intent?: ConsultationIntent,
): ConsultationState {
  const normalized = normalizeConsultationState(previous || createConsultationState(intent), intent);
  const collected: ConsultationEntities = { ...normalized.collected };
  let pendingClarifications = normalized.pendingClarifications || [];

  if (extracted.ambiguous_power_values?.length) {
    pendingClarifications = mergePendingClarifications(
      pendingClarifications,
      extracted.ambiguous_power_values.map((value) => `${value} needs context`),
    );
  }

  for (const [key, value] of Object.entries(extracted) as Array<
    [keyof ConsultationEntities, ConsultationEntities[keyof ConsultationEntities]]
  >) {
    if (!hasValue(value) || key === "ambiguous_power_values") continue;

    if (key === "appliances") {
      collected.appliances = mergeUnique(collected.appliances, value as string[]);
      continue;
    }

    if (key === "appliance_details") {
      const details = mergeApplianceDetails(collected.appliance_details, value as ApplianceEntry[]);
      collected.appliance_details = details;
      collected.appliances = details.map((item) => item.label);
      continue;
    }

    if (key === "appliance_quantity" || key === "appliance_wattage") {
      collected[key] = mergeRecordWithoutOverwrite(
        collected[key] as Record<string, number> | undefined,
        value as Record<string, number> | undefined,
      ) as never;
      continue;
    }

    if (key === "panel_specs") {
      collected.panel_specs = {
        ...((collected.panel_specs as object | undefined) || {}),
      };
      for (const [specKey, specValue] of Object.entries((value as object | undefined) || {})) {
        if (!hasValue((collected.panel_specs as Record<string, unknown>)[specKey])) {
          (collected.panel_specs as Record<string, unknown>)[specKey] = specValue;
        }
      }
      continue;
    }

    if (key === "protection_components" || key === "coverage_needs") {
      collected[key] = mergeUnique(collected[key] as string[] | undefined, value as string[]) as never;
      continue;
    }

    if (!hasValue(collected[key]) || key === "has_media_hint") {
      collected[key] = value as never;
    }
  }

  return refreshConsultationStateIndexes({
    ...normalized,
    intent: intent || normalized.intent,
    collected,
    missing: [],
    missingFields: [],
    pendingClarifications,
  });
}

function applianceNames(state: ConsultationState) {
  return state.collected.appliance_details?.map((item) => item.name) || [];
}

function missingQuantityNames(state: ConsultationState) {
  if (state.collected.total_load_watts) return [];
  return (state.collected.appliance_details || [])
    .filter((item) => !item.quantity)
    .map((item) => item.name);
}

function hasCompressorWithoutRating(state: ConsultationState) {
  const names = applianceNames(state).map((name) => name.toLowerCase());
  if (!names.some((name) => ["freezer", "fridge", "pump", "ac"].includes(name))) return false;
  return !hasValue(state.collected.load_surge_details);
}

function hasLoadBasis(state: ConsultationState) {
  return (
    hasValue(state.collected.total_load_watts) ||
    hasValue(state.collected.appliance_details) ||
    hasValue(state.collected.appliances)
  );
}

function hasEstimatedLoadBasis(state: ConsultationState) {
  if (state.collected.total_load_watts) return true;
  if (!state.collected.appliance_details?.length) return false;
  return missingQuantityNames(state).length === 0;
}

export function getRequiredFields(intent: ConsultationIntent | undefined) {
  const fields: Partial<Record<ConsultationIntent, string[]>> = {
    battery_sizing: ["appliances or total load", "quantities if estimating from appliances", "backup hours"],
    inverter_recommendation: ["appliances or total load", "quantities if estimating from appliances"],
    panel_recommendation: ["inverter or charge controller model", "panel model or datasheet values"],
    solar_sizing: ["appliances or total load", "quantities if estimating from appliances", "backup hours"],
    safety_check: ["setup or fault being checked"],
    wiring_help: ["wiring issue or affected area"],
    cctv: ["property type", "areas to monitor", "location"],
    quote: ["service or work brief", "project location", "urgency or preferred timeline"],
    protection_recommendation: ["load or inverter details", "protection component context"],
    materials_recommendation: ["product category", "project type", "intended load or use case"],
    lighting_recommendation: ["property type or room purpose", "fixture style or lighting goal", "control zones"],
    whatsapp: ["handoff brief"],
  };

  return intent ? fields[intent] || [] : [];
}

export function determineMissingFields(state: ConsultationState) {
  const intent = state.intent;
  const collected = state.collected;
  const missing: string[] = [];

  if (state.pendingClarifications?.length) {
    missing.push("clarify ambiguous detail");
  }

  if (!intent && !state.childState) {
    return missing;
  }

  if (state.childState === "load_estimation" || (intent && POWER_INTENTS.has(intent))) {
    if (!hasLoadBasis(state)) {
      missing.push("load or appliance list");
    } else if (missingQuantityNames(state).length) {
      missing.push("quantities");
    }

    if (intent && BACKUP_INTENTS.has(intent) && !hasValue(collected.backup_hours)) {
      missing.push("backup hours");
    }

    if (hasEstimatedLoadBasis(state) && hasCompressorWithoutRating(state)) {
      missing.push("freezer/AC/pump wattage or type");
    }
  }

  if (intent === "panel_recommendation") {
    if (!hasValue(collected.inverter_size) && !hasValue(collected.inverter_voltage)) {
      missing.push("inverter or charge controller model");
    }
    if (!hasValue(collected.panel_model) && !hasValue(collected.panel_specs)) {
      missing.push("panel model or datasheet values");
    }
  }

  if (intent === "protection_recommendation") {
    if (!hasValue(collected.protection_components) && !hasValue(collected.issue)) {
      missing.push("protection goal or component context");
    }
  }

  if (intent === "safety_check") {
    if (!hasValue(collected.issue)) missing.push("setup or fault being checked");
  }

  if (intent === "wiring_help") {
    if (!hasValue(collected.issue) && !hasValue(collected.service_type)) {
      missing.push("wiring issue or affected area");
    }
  }

  if (intent === "cctv") {
    if (!hasValue(collected.property_type)) missing.push("property type");
    if (!hasValue(collected.coverage_needs) && !hasValue(collected.issue)) missing.push("areas to monitor");
    if (!hasValue(collected.location)) missing.push("project location");
  }

  if (intent === "quote") {
    if (!hasValue(collected.service_type) && !hasValue(collected.issue) && !hasValue(collected.appliances)) {
      missing.push("service or work brief");
    }
    if (!hasValue(collected.location)) missing.push("project location");
    if (!hasValue(collected.urgency)) missing.push("urgency or preferred timeline");
  }

  if (intent === "lighting_recommendation") {
    if (!hasValue(collected.property_type) && !hasValue(collected.room_purpose)) {
      missing.push("property type or room purpose");
    }
    if (!hasValue(collected.service_type)) missing.push("fixture style or lighting goal");
    if (!hasValue(collected.control_zones)) missing.push("number of control zones or switching preference");
  }

  if (intent === "materials_recommendation") {
    if (!hasValue(collected.service_type)) missing.push("product category or item you need");
    if (!hasValue(collected.project_type)) missing.push("project type or whether this is new installation, replacement, or upgrade");
    if (!hasValue(collected.issue) && !hasValue(collected.total_load_watts)) missing.push("intended load or use case");
  }

  return Array.from(new Set(missing));
}

export function formatCollected(state: ConsultationState) {
  const collected = state.collected;
  const lines: string[] = [];
  const inverter = [collected.inverter_voltage, collected.inverter_size, collected.inverter_type, "inverter"]
    .filter(Boolean)
    .join(" ");

  if (inverter.trim() !== "inverter") lines.push(inverter);
  if (collected.service_type) lines.push(`service: ${collected.service_type}`);
  if (collected.location) lines.push(`location: ${collected.location}`);
  if (collected.property_type) lines.push(`property: ${collected.property_type}`);
  if (collected.coverage_needs?.length) lines.push(`coverage: ${collected.coverage_needs.join(", ")}`);
  if (collected.total_load_watts) lines.push(`${collected.total_load_watts}W total load`);
  if (collected.appliance_details?.length) {
    lines.push(collected.appliance_details.map((item) => item.label).join(", "));
  } else if (collected.appliances?.length) {
    lines.push(collected.appliances.join(", "));
  }
  if (collected.backup_hours) lines.push(`${collected.backup_hours}-hour backup target`);
  if (collected.panel_specs?.wattage) lines.push(`${collected.panel_specs.wattage}W panel detail`);
  if (collected.urgency) lines.push(`urgency: ${collected.urgency}`);
  if (collected.budget) lines.push(`budget: ${collected.budget}`);

  return lines;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function firstPendingValue(state: ConsultationState) {
  const pending = state.pendingClarifications?.[0] || "";
  return pending.replace(/\s+needs context$/i, "");
}

export function buildNextRecommendedQuestion(state: ConsultationState) {
  const missing = state.missing[0];

  if (missing === "clarify ambiguous detail") {
    const value = firstPendingValue(state) || "that value";
    return `What does ${value} refer to: total load, one appliance rating, panel wattage, or something else?`;
  }

  if (state.childState === "load_estimation" && !hasLoadBasis(state)) {
    return "I can help estimate your load. What appliances do you want to power? Add quantities if you know them, for example: 3 fans, 8 bulbs.";
  }

  if (missing === "load or appliance list") {
    return "What appliances do you want to power, or what is the total load in watts if you already know it?";
  }

  if (missing === "quantities") {
    const names = missingQuantityNames(state).map(pluralizeApplianceName);
    const label = formatList(names);
    return label
      ? `How many ${label} do you want to power? Example: 3 fans, 8 bulbs.`
      : "How many of each appliance do you want to power?";
  }

  if (missing === "backup hours") {
    return "How many hours do you want the system to keep those appliances running?";
  }

  if (missing === "freezer/AC/pump wattage or type") {
    return "What type, HP, or wattage is the freezer, AC, or pump? If you do not know, I can estimate cautiously for now.";
  }

  if (missing) {
    return `Please share the ${missing}.`;
  }

  if (state.intent === "quote") {
    return "Add a short scope description and any photos/videos so the quote handoff is clearer.";
  }

  if (state.intent === "solar_sizing" || state.intent === "battery_sizing") {
    return "The next useful step is to confirm the load estimate, then choose practical inverter, battery, panel, and protection sizes.";
  }

  if (state.intent) {
    return `What else should I consider for this ${getConsultationIntentLabel(state.intent).toLowerCase()} request?`;
  }

  return "What would you like help with: solar, wiring, CCTV, lighting, materials, or quote preparation?";
}

function buildProgress(state: ConsultationState): ConsultationProgress {
  const firstMissing = state.missing[0];
  const load = estimateLoadWatts(state);

  if (!state.intent) {
    return { stage: "identify_intent", label: "Understanding request", percent: 10 };
  }

  if (firstMissing === "clarify ambiguous detail") {
    return { stage: "clarify", label: "Clarifying one detail", percent: 35 };
  }

  if (firstMissing === "load or appliance list") {
    return { stage: "collect_load", label: "Collecting appliance list", percent: 25 };
  }

  if (firstMissing === "quantities") {
    return { stage: "collect_quantities", label: "Collecting appliance quantities", percent: 45 };
  }

  if (firstMissing === "backup hours") {
    return { stage: "collect_backup_hours", label: "Collecting backup target", percent: 60 };
  }

  if (load.watts && state.collected.backup_hours) {
    return { stage: "engineering_recommendation", label: "Ready for engineering direction", percent: 85 };
  }

  if (load.watts) {
    return { stage: "estimate_load", label: "Load estimate available", percent: 70 };
  }

  return { stage: "handoff", label: "Gathering final details", percent: 70 };
}

export function buildConsultationGuide(state: ConsultationState): ConsultationGuide {
  const nextRecommendedQuestion = buildNextRecommendedQuestion(state);

  return {
    intent: state.intent,
    requiredFields: getRequiredFields(state.intent),
    missingFields: state.missing,
    nextRecommendedQuestion,
    suggestedNextQuestion: nextRecommendedQuestion,
    progress: buildProgress(state),
  };
}

export function analyzeConsultationState(state: ConsultationState): ConsultationAnalysis {
  const missingFields = determineMissingFields(state);
  const analyzedState = refreshConsultationStateIndexes({
    ...state,
    missing: missingFields,
    missingFields,
    confidence: Math.min(0.95, formatCollected(state).length * 0.12),
  });
  const guide = buildConsultationGuide(analyzedState);

  return {
    intent: analyzedState.intent,
    childState: analyzedState.childState,
    captured: analyzedState.collected,
    missingFields,
    suggestedNextQuestion: guide.suggestedNextQuestion,
    progress: guide.progress,
    pendingClarifications: analyzedState.pendingClarifications || [],
    confidence: analyzedState.confidence,
  };
}

export function applyConsultationAnalysis(
  state: ConsultationState,
  analysis: ConsultationAnalysis,
): ConsultationState {
  return refreshConsultationStateIndexes({
    ...state,
    missing: analysis.missingFields,
    missingFields: analysis.missingFields,
    confidence: analysis.confidence,
  });
}

function resolveIntentAlias(text: string) {
  const value = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!value) return undefined;

  const flowId = assistantFlowOrder.find((id) =>
    assistantFlows[id].aliases.some((alias) => value.includes(alias.toLowerCase())),
  );

  return flowId ? FLOW_INTENTS[flowId] : undefined;
}

export function inferIntentFromMessage(text: string, extracted: ConsultationEntities) {
  const value = text.toLowerCase();
  const aliasIntent = resolveIntentAlias(value);
  if (aliasIntent) return aliasIntent;
  if (detectConversationIntent(value) === "LOAD_ESTIMATION") return "solar_sizing";
  if (/\b(quote|pricing|price|cost|budget|inspection|site visit)\b/.test(value)) return "quote";
  if (/\b(solar|inverter|battery|panel|backup power)\b/.test(value) && /\b(size|sizing|capacity|calculate|load|backup|power|run)\b/.test(value)) {
    return "solar_sizing";
  }
  if (
    extracted.appliance_details?.length &&
    (hasValue(extracted.backup_hours) || /\b(inverter|solar|battery|backup)\b/.test(value))
  ) {
    return "solar_sizing";
  }
  if (/\b(cctv|camera|surveillance|dvr|nvr|remote viewing)\b/.test(value)) return "cctv";
  if (/\b(wiring|rewiring|breaker|tripping|fault|socket|switch|burnt)\b/.test(value)) return "wiring_help";
  if (/\b(spark|shock|burning|smoke|unsafe|exposed)\b/.test(value)) return "safety_check";
  if (/\b(lighting|chandelier|pop light|downlight|spotlight|fixture)\b/.test(value)) {
    return "lighting_recommendation";
  }
  if (/\b(material|product|cable|wire|mcb|mccb|spd|isolator)\b/.test(value)) return "materials_recommendation";
  if (extracted.service_type === "CCTV") return "cctv";
  if (extracted.service_type === "lighting") return "lighting_recommendation";
  if (extracted.service_type === "materials") return "materials_recommendation";
  if (extracted.service_type === "electrical fault/wiring") return "wiring_help";
  if (extracted.service_type === "solar/inverter") return "solar_sizing";
  return undefined;
}

export function resolveConsultationIntent({
  message,
  intentContext,
  state,
  extracted,
}: {
  message: string;
  intentContext?: ConsultationIntentContext | null;
  state?: ConsultationState | null;
  extracted: ConsultationEntities;
}) {
  const activeIntent = intentContext?.intent || state?.intent;
  const loadEstimationRequested = detectConversationIntent(message) === "LOAD_ESTIMATION";

  if (loadEstimationRequested) {
    return activeIntent && POWER_INTENTS.has(activeIntent) ? activeIntent : "solar_sizing";
  }

  if (activeIntent) return activeIntent;

  return inferIntentFromMessage(message, extracted);
}

export function resolveConsultationChildState({
  message,
  state,
  intent,
}: {
  message: string;
  state?: ConsultationState | null;
  intent?: ConsultationIntent;
}) {
  if (detectConversationIntent(message) === "LOAD_ESTIMATION") return "load_estimation";
  if (state?.childState) return state.childState;
  if (intent === "solar_sizing" && /\b(i\s+do not|don't|dont)\s+know\b/i.test(message)) return "load_estimation";
  return undefined;
}

export function answersFromState(state: ConsultationState) {
  const collected = state.collected;
  return {
    appliances:
      collected.appliances?.join(", ") ||
      (collected.total_load_watts ? `${collected.total_load_watts}W total load` : ""),
    backup_hours: collected.backup_hours ? String(collected.backup_hours) : "",
    existing_inverter: [collected.inverter_voltage, collected.inverter_size, collected.inverter_type]
      .filter(Boolean)
      .join(" "),
    existing_battery: [collected.battery_voltage, collected.battery_model].filter(Boolean).join(" "),
    panel_details: [
      collected.panel_model,
      collected.panel_specs?.quantity ? `${collected.panel_specs.quantity} panels` : "",
      collected.panel_specs?.wattage ? `${collected.panel_specs.wattage}W` : "",
      collected.panel_specs?.voc ? `Voc ${collected.panel_specs.voc}` : "",
      collected.panel_specs?.vmp ? `Vmp ${collected.panel_specs.vmp}` : "",
      collected.panel_specs?.isc ? `Isc ${collected.panel_specs.isc}` : "",
      collected.panel_specs?.imp ? `Imp ${collected.panel_specs.imp}` : "",
    ]
      .filter(Boolean)
      .join(", "),
    load_surge_details: collected.load_surge_details || "",
    issue: collected.issue || collected.service_type || "",
    budget: collected.budget || "",
    location: collected.location || "",
  };
}

export function summarizeConsultationState(state: ConsultationState) {
  const captured = formatCollected(state);
  if (!captured.length) return "";
  return `Captured so far: ${captured.join("; ")}.`;
}

export function isQuoteIntent(message: string, state: ConsultationState) {
  return state.intent === "quote" || /\b(quote|pricing|price|cost|budget|inspection|site visit)\b/i.test(message);
}
