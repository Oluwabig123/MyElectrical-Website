import { generateAssistantChatReply, type AssistantChatMessage } from "@/lib/assistant-rag";
import {
  extractConsultationEntities,
  type ApplianceEntry,
  type ConsultationEntities,
} from "@/lib/ai/entity-extraction";
import {
  getConsultationIntentLabel,
  type ConsultationIntent,
  type ConsultationIntentContext,
} from "@/lib/ai/intent-context";
import { validateInput } from "@/lib/ai/validation";
import { runAssistantWorkflow, type WorkflowFlowId } from "@/lib/ai/workflows";
import type { SizingRecommendation } from "@/lib/engineering/types";

export type ConsultationState = {
  intent?: ConsultationIntent;
  collected: ConsultationEntities;
  missing: string[];
};

export type ConsultationEngineRequest = {
  messages: AssistantChatMessage[];
  intentContext?: ConsultationIntentContext | null;
  state?: ConsultationState | null;
};

export type ConsultationEngineResult = {
  answer: string;
  state: ConsultationState;
  sources: unknown[];
  usedKnowledgeBase: boolean;
  recommendation?: SizingRecommendation | null;
  quoteIntentDetected?: boolean;
};

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function mergeUnique(existing: string[] = [], incoming: string[] = []) {
  return Array.from(new Set([...existing, ...incoming].map((item) => String(item).trim()).filter(Boolean)));
}

function mergeApplianceDetails(existing: ApplianceEntry[] = [], incoming: ApplianceEntry[] = []) {
  const rows = new Map<string, ApplianceEntry>();
  for (const item of existing) rows.set(item.name.toLowerCase(), item);
  for (const item of incoming) {
    const key = item.name.toLowerCase();
    rows.set(key, {
      ...item,
      ...rows.get(key),
      label: item.label || rows.get(key)?.label || item.name,
    });
  }
  return Array.from(rows.values());
}

export function mergeConsultationState(
  previous: ConsultationState | null | undefined,
  extracted: ConsultationEntities,
  intent?: ConsultationIntent,
): ConsultationState {
  const collected: ConsultationEntities = { ...(previous?.collected || {}) };

  for (const [key, value] of Object.entries(extracted) as Array<[keyof ConsultationEntities, ConsultationEntities[keyof ConsultationEntities]]>) {
    if (!hasValue(value)) continue;

    if (key === "appliances") {
      collected.appliances = mergeUnique(collected.appliances, value as string[]);
      continue;
    }

    if (key === "appliance_details") {
      collected.appliance_details = mergeApplianceDetails(
        collected.appliance_details,
        value as ApplianceEntry[],
      );
      continue;
    }

    if (key === "appliance_quantity" || key === "appliance_wattage" || key === "panel_specs") {
      collected[key] = {
        ...((collected[key] as object | undefined) || {}),
        ...((value as object | undefined) || {}),
      } as never;
      continue;
    }

    if (key === "protection_components") {
      collected.protection_components = mergeUnique(collected.protection_components, value as string[]);
      continue;
    }

    if (!hasValue(collected[key])) {
      collected[key] = value as never;
    }
  }

  return {
    intent: intent || previous?.intent,
    collected,
    missing: [],
  };
}

function latestUserMessage(messages: AssistantChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function applianceNames(state: ConsultationState) {
  return state.collected.appliance_details?.map((item) => item.name.toLowerCase()) || [];
}

function hasCompressorWithoutRating(state: ConsultationState) {
  const names = applianceNames(state);
  if (!names.some((name) => ["freezer", "fridge", "pump", "ac"].includes(name))) return false;
  return !hasValue(state.collected.load_surge_details);
}

function determineMissingFields(state: ConsultationState) {
  const intent = state.intent;
  const collected = state.collected;
  const missing: string[] = [];

  if (intent === "battery_sizing") {
    if (!hasValue(collected.appliances)) missing.push("appliance list");
    if (!hasValue(collected.backup_hours)) missing.push("backup hours");
    if (!hasValue(collected.inverter_voltage)) missing.push("inverter or battery voltage");
    if (hasCompressorWithoutRating(state)) missing.push("freezer/AC/pump wattage or type");
  }

  if (intent === "inverter_recommendation") {
    if (!hasValue(collected.appliances)) missing.push("appliance list");
    if (hasCompressorWithoutRating(state)) missing.push("compressor load HP or wattage");
    if (!hasValue(collected.battery_voltage) && !hasValue(collected.inverter_voltage)) {
      missing.push("preferred battery voltage");
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

  if (intent === "solar_sizing") {
    if (!hasValue(collected.appliances)) missing.push("appliance list");
    if (!hasValue(collected.backup_hours)) missing.push("backup hours");
    if (hasCompressorWithoutRating(state)) missing.push("compressor load HP or wattage");
  }

  if (intent === "safety_check") {
    if (!hasValue(collected.issue)) missing.push("setup or fault being checked");
  }

  if (intent === "wiring_help") {
    if (!hasValue(collected.issue)) missing.push("wiring issue or affected area");
  }

  if (intent === "cctv") {
    if (!hasValue(collected.issue) && !hasValue(collected.location)) missing.push("areas to monitor and property type");
  }

  if (intent === "quote") {
    if (!hasValue(collected.issue) && !hasValue(collected.appliances)) missing.push("service or work brief");
    if (!hasValue(collected.location)) missing.push("project location");
  }

  return missing;
}

function formatCollected(state: ConsultationState) {
  const collected = state.collected;
  const lines: string[] = [];
  const inverter = [collected.inverter_voltage, collected.inverter_size, collected.inverter_type, "inverter"]
    .filter(Boolean)
    .join(" ");

  if (inverter.trim() !== "inverter") lines.push(inverter);
  if (collected.battery_voltage) lines.push(`${collected.battery_voltage} battery context`);
  if (collected.appliances?.length) lines.push(...collected.appliances);
  if (collected.backup_hours) lines.push(`${collected.backup_hours}-hour backup target`);
  if (collected.panel_specs?.wattage) lines.push(`${collected.panel_specs.wattage}W panel detail`);
  if (collected.budget) lines.push(`Budget: ${collected.budget}`);

  return lines;
}

function buildInvalidResponse() {
  return [
    "I couldn't identify sizing information.",
    "",
    "Please provide information like:",
    "",
    "- TV",
    "- Freezer",
    "- AC",
    "- Fans",
    "- Bulbs",
  ].join("\n");
}

function buildMissingQuestion(state: ConsultationState) {
  const label = state.intent ? getConsultationIntentLabel(state.intent) : "Consultation";
  const captured = formatCollected(state);
  const missing = state.missing[0];

  if (missing === "freezer/AC/pump wattage or type") {
    const compressorNames = applianceNames(state).filter((name) => ["freezer", "fridge", "pump", "ac"].includes(name));
    const targetLoad = compressorNames.length === 1 ? compressorNames[0] : "freezer, AC, or pump";

    return [
      "Great, I captured:",
      "",
      ...captured.map((item) => `- ${item}`),
      "",
      "I need one more detail:",
      "",
      `What type of ${targetLoad} are you using?`,
      "",
      "- Small freezer",
      "- Medium freezer",
      "- Deep freezer",
      "- Wattage or HP if known",
    ].join("\n");
  }

  return [
    captured.length ? "Great, I captured:" : `You're currently in ${label}.`,
    "",
    ...captured.map((item) => `- ${item}`),
    captured.length ? "" : "Tell me what you already have and what you want to power.",
    missing ? `The next useful detail is: ${missing}.` : "",
  ]
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n")
    .trim();
}

function workflowFromIntent(intent: ConsultationIntent | undefined): WorkflowFlowId | null {
  const map: Partial<Record<ConsultationIntent, WorkflowFlowId>> = {
    battery_sizing: "battery",
    inverter_recommendation: "inverter",
    panel_recommendation: "panels",
    solar_sizing: "solar",
    safety_check: "safety",
    wiring_help: "wiring",
    cctv: "cctv",
    quote: "quote",
    protection_recommendation: "protection",
    materials_recommendation: "materials",
    lighting_recommendation: "lighting",
    whatsapp: "whatsapp",
  };

  return intent ? map[intent] || null : null;
}

function answersFromState(state: ConsultationState) {
  const collected = state.collected;
  return {
    appliances: collected.appliances?.join(", ") || "",
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
    issue: collected.issue || "",
    budget: collected.budget || "",
    location: collected.location || "",
  };
}

export async function runConsultationEngine({
  messages,
  intentContext,
  state,
}: ConsultationEngineRequest): Promise<ConsultationEngineResult> {
  const intent = intentContext?.intent || state?.intent;
  const userMessage = latestUserMessage(messages);
  const validation = validateInput(userMessage);
  const merged = mergeConsultationState(state, extractConsultationEntities(userMessage), intent);
  merged.missing = determineMissingFields(merged);

  if (intent && validation.category === "GREETING") {
    return {
      answer: `Hi 👋 You're currently in ${getConsultationIntentLabel(intent)}.\n\nWould you like to continue?`,
      state: merged,
      sources: [],
      usedKnowledgeBase: false,
    };
  }

  if (intent && validation.category === "OFF_TOPIC") {
    return {
      answer: [
        `You're currently in ${getConsultationIntentLabel(intent)}.`,
        "",
        "Would you like to:",
        "",
        "- Continue consultation",
        "- Pause and ask a general question",
        "- Start a new consultation",
      ].join("\n"),
      state: merged,
      sources: [],
      usedKnowledgeBase: false,
    };
  }

  if (intent && validation.category === "INVALID") {
    return {
      answer: buildInvalidResponse(),
      state: merged,
      sources: [],
      usedKnowledgeBase: false,
    };
  }

  if (intent && validation.category === "QUESTION" && !Object.keys(extractConsultationEntities(userMessage)).length) {
    const result = await generateAssistantChatReply(messages);
    return {
      ...result,
      state: merged,
    };
  }

  if (intent && merged.missing.length > 0) {
    return {
      answer: buildMissingQuestion(merged),
      state: merged,
      sources: [],
      usedKnowledgeBase: false,
    };
  }

  const workflowId = workflowFromIntent(intent);
  if (workflowId) {
    try {
      const result = await runAssistantWorkflow({
        flowId: workflowId,
        answers: answersFromState(merged),
        sessionId: intentContext?.sessionId,
      });

      return {
        answer: result.answer,
        state: merged,
        sources: result.sources,
        usedKnowledgeBase: result.usedKnowledgeBase,
        recommendation: result.recommendation,
        quoteIntentDetected: workflowId === "quote",
      };
    } catch {
      return {
        answer: buildMissingQuestion(merged),
        state: merged,
        sources: [],
        usedKnowledgeBase: false,
      };
    }
  }

  const result = await generateAssistantChatReply(messages);
  return {
    ...result,
    state: merged,
  };
}
