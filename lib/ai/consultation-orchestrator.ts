import {
  generateAssistantChatReply,
  type AssistantChatMessage,
  type ConsultationDeskContext,
} from "@/lib/assistant-rag";
import { extractConsultationEntities, type ConsultationEntities } from "@/lib/ai/entity-extraction";
import {
  analyzeConsultationState,
  answersFromState,
  applyConsultationAnalysis,
  buildConsultationGuide,
  isGeneralInfoQuery,
  isQuoteIntent,
  latestUserMessage,
  mergeConsultationState,
  normalizeConsultationMessages,
  resolveConsultationChildState,
  resolveConsultationIntent,
  summarizeConsultationState,
  type ConsultationGuide,
} from "@/lib/ai/consultation-engine";
import {
  createConsultationState,
  refreshConsultationStateIndexes,
  type ConsultationState,
} from "@/lib/ai/consultation-state";
import {
  getConsultationIntentLabel,
  type ConsultationIntent,
  type ConsultationIntentContext,
} from "@/lib/ai/intent-context";
import { buildPlanningSizing, getProtectionChecklist } from "@/lib/engineering/consultation-priority";
import type { SizingRecommendation } from "@/lib/engineering/types";
import { runAssistantWorkflow, type WorkflowFlowId } from "@/lib/ai/workflows";

export type ConsultationOrchestratorRequest = {
  messages: AssistantChatMessage[];
  intentContext?: ConsultationIntentContext | null;
  state?: ConsultationState | null;
};

export type ConsultationOrchestratorResult = {
  answer: string;
  state: ConsultationState;
  sources: unknown[];
  usedKnowledgeBase: boolean;
  recommendation?: SizingRecommendation | null;
  quoteIntentDetected?: boolean;
  consultationGuide: ConsultationGuide;
};

const TECHNICAL_WORKFLOWS: WorkflowFlowId[] = ["solar", "battery", "inverter", "panels", "protection"];

function activationPrompt(intent?: ConsultationIntent) {
  const label = intent ? getConsultationIntentLabel(intent).toLowerCase() : "consultation";
  return `Start a ${label} and ask for the next useful detail.`;
}

function ensureConversationHasUserMessage({
  messages,
  intentContext,
}: {
  messages: AssistantChatMessage[];
  intentContext?: ConsultationIntentContext | null;
}) {
  if (latestUserMessage(messages)) return messages;

  if (intentContext?.intent) {
    return [
      ...messages,
      {
        role: "user",
        content: activationPrompt(intentContext?.intent),
      } as AssistantChatMessage,
    ].slice(-12);
  }

  return messages;
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

function clearResolvedClarifications(state: ConsultationState, extracted: ConsultationEntities, message: string) {
  if (!state.pendingClarifications?.length) return state;

  const hasResolvedPowerContext =
    Boolean(extracted.total_load_watts) ||
    Boolean(extracted.panel_specs?.wattage) ||
    Boolean(extracted.appliance_wattage && Object.keys(extracted.appliance_wattage).length) ||
    (/\b(total load|panel|appliance|fan|bulb|freezer|fridge|laptop|tv|each|per)\b/i.test(message) &&
      /\b\d+(?:\.\d+)?\s*w(?:atts?)?\b/i.test(message));

  if (!hasResolvedPowerContext) return state;

  return refreshConsultationStateIndexes({
    ...state,
    pendingClarifications: [],
  });
}

function buildEngineeringNotes(state: ConsultationState) {
  const notes: string[] = [];
  const planning = buildPlanningSizing(state);

  if (planning) {
    const inverterContext = [
      state.collected.inverter_voltage,
      state.collected.inverter_size,
      state.collected.inverter_type,
    ]
      .filter(Boolean)
      .join(" ");
    const solarWp = Math.ceil(((planning.energyRequiredKwh * 1000 * 1.3) / 4.5) / 100) * 100;

    notes.push(
      planning.loadIsEstimated
        ? `Estimated connected load: about ${planning.loadWatts}W using appliance defaults (${planning.loadAssumptions.join("; ")}).`
        : `User-provided connected load: ${planning.loadWatts}W.`,
    );
    notes.push(`Planning energy need: ${planning.energyRequiredKwh.toFixed(1)}kWh.`);
    notes.push(`Recommended battery storage: about ${planning.batteryRequiredKwh.toFixed(1)}kWh (${planning.batteryRangeLabel} lithium).`);
    notes.push(
      inverterContext
        ? `Existing inverter context: ${inverterContext} inverter; the running load estimate is below it, but compressor surge and battery capacity still need confirmation.`
        : `Inverter direction: minimum ${Math.max(1, Math.ceil(planning.inverterRecommendedWatts / 1000))}kW, with surge allowance for compressor loads.`,
    );
    notes.push(`Solar panel direction: roughly ${solarWp}Wp as a first planning target before matching the actual inverter/charge-controller limits.`);
    notes.push(`Protection checklist: ${getProtectionChecklist().join(", ")}.`);
  }

  if (state.childState === "load_estimation" && !state.collected.appliances?.length) {
    notes.push("The user wants help estimating load from appliances before exact solar sizing.");
  }

  if (state.missing.includes("freezer/AC/pump wattage or type")) {
    notes.push("A compressor appliance is present, so the freezer/AC/pump rating should be confirmed before final inverter sizing.");
  }

  return notes;
}

async function buildRecommendationIfReady(state: ConsultationState, sessionId?: string) {
  const workflowId = workflowFromIntent(state.intent);

  if (!workflowId || !TECHNICAL_WORKFLOWS.includes(workflowId)) return null;
  const hasSizingBasis =
    Boolean(state.collected.appliances?.length) ||
    Boolean(state.collected.total_load_watts) ||
    Boolean(state.collected.inverter_size) ||
    Boolean(state.collected.inverter_voltage) ||
    Boolean(state.collected.battery_model) ||
    Boolean(state.collected.panel_model) ||
    Boolean(state.collected.panel_specs);

  if (!hasSizingBasis) return null;
  if (
    state.missing.length > 0 &&
    !state.missing.every((field) =>
      ["backup hours", "load or appliance list", "freezer/AC/pump wattage or type"].includes(field),
    )
  ) {
    return null;
  }

  try {
    const result = await runAssistantWorkflow({
      flowId: workflowId,
      answers: answersFromState(state),
      sessionId,
    });

    return result.recommendation;
  } catch {
    return null;
  }
}

function addPlanningIndexes(state: ConsultationState) {
  const planning = buildPlanningSizing(state);

  if (!planning) return state;

  return refreshConsultationStateIndexes({
    ...state,
    estimatedLoad: planning.loadWatts,
    protectionRecommendation: planning.protection,
  });
}

function applyTopicSwitchPolicy({
  state,
  userMessage,
}: {
  state: ConsultationState;
  userMessage: string;
}) {
  if (!state.intent) return state;

  const generalInfoTurn = isGeneralInfoQuery(userMessage);
  const isPowerFollowup =
    /\b(solar|inverter|battery|panel|load|backup|fan|bulb|freezer|fridge|laptop|tv|watt|protection)\b/i.test(
      userMessage,
    );

  if (generalInfoTurn && !isPowerFollowup) {
    return refreshConsultationStateIndexes({
      ...state,
      unrelatedTurnCount: Math.min(3, (state.unrelatedTurnCount || 0) + 1),
      guidedPaused: true,
    });
  }

  if (isPowerFollowup) {
    return refreshConsultationStateIndexes({
      ...state,
      unrelatedTurnCount: 0,
      guidedPaused: false,
    });
  }

  return state;
}

export async function runConsultationOrchestrator({
  messages: rawMessages,
  intentContext,
  state,
}: ConsultationOrchestratorRequest): Promise<ConsultationOrchestratorResult> {
  // Every assistant turn now passes through this single orchestration path.
  // The guided engine supplies context only; assistant-rag owns the final user-facing response.
  const normalizedMessages = normalizeConsultationMessages(rawMessages);
  const messages = ensureConversationHasUserMessage({
    messages: normalizedMessages as AssistantChatMessage[],
    intentContext,
  });

  if (!messages.length) {
    throw new Error("Empty chat messages.");
  }

  const userMessage = latestUserMessage(messages);
  if (!userMessage) {
    throw new Error("No user message found.");
  }

  const extracted = extractConsultationEntities(userMessage);
  const intent = resolveConsultationIntent({
    message: userMessage,
    intentContext,
    state,
    extracted,
  });
  const childState = resolveConsultationChildState({
    message: userMessage,
    state,
    intent,
  });
  const baseState = refreshConsultationStateIndexes({
    ...(state || createConsultationState(intent)),
    intent: intent || state?.intent,
    childState,
  });
  const merged = clearResolvedClarifications(
    mergeConsultationState(baseState, extracted, intent),
    extracted,
    userMessage,
  );
  const analysis = analyzeConsultationState(merged);
  const analyzedState = addPlanningIndexes({
    ...applyConsultationAnalysis(merged, analysis),
    conversationSummary: summarizeConsultationState(merged),
  });
  const switchedState = applyTopicSwitchPolicy({
    state: analyzedState,
    userMessage,
  });
  const consultationGuide = buildConsultationGuide(switchedState);
  const recommendation = await buildRecommendationIfReady(switchedState, intentContext?.sessionId);
  const consultationContext: ConsultationDeskContext = {
    intent: switchedState.intent,
    childState: switchedState.childState,
    requiredFields: consultationGuide.requiredFields,
    missingFields: consultationGuide.missingFields,
    nextRecommendedQuestion: consultationGuide.nextRecommendedQuestion,
    progress: consultationGuide.progress,
    pendingClarifications: switchedState.pendingClarifications,
    conversationSummary: switchedState.conversationSummary,
    collected: switchedState.collected,
    engineeringNotes: buildEngineeringNotes(switchedState),
    guidedPaused: switchedState.guidedPaused,
    recommendation,
  };

  const reply = await generateAssistantChatReply(messages, {
    consultation: consultationContext,
  });

  return {
    ...reply,
    state: switchedState,
    recommendation: recommendation || reply.recommendation || null,
    quoteIntentDetected: reply.quoteIntentDetected || isQuoteIntent(userMessage, analyzedState),
    consultationGuide,
  };
}
