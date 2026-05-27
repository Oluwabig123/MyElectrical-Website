import type { ConsultationEntities } from "@/lib/ai/entity-extraction";
import type { ConsultationIntent } from "@/lib/ai/intent-context";

export type ConsultationChildState =
  | "load_estimation"
  | "battery_sizing"
  | "inverter_validation"
  | "panel_sizing"
  | "protection_sizing";

export type ConsultationState = {
  intent?: ConsultationIntent;
  intentHint?: ConsultationIntent;
  childState?: ConsultationChildState;
  workflow: "consultation";
  collected: ConsultationEntities;
  missing: string[];
  missingFields: string[];
  pendingClarifications: string[];
  conversationSummary?: string;
  appliances?: string[];
  quantities?: Record<string, number>;
  backupHours?: number;
  estimatedLoad?: number;
  existingInverter?: Record<string, unknown>;
  existingBattery?: Record<string, unknown>;
  batteryVoltage?: number;
  panelRecommendation?: unknown;
  protectionRecommendation?: unknown;
  unrelatedTurnCount: number;
  guidedPaused: boolean;
  paused: boolean;
  confidence: number;
};

function voltageToNumber(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildExistingInverter(collected: ConsultationEntities) {
  const inverter = {
    voltage: collected.inverter_voltage,
    size: collected.inverter_size,
    type: collected.inverter_type,
  };

  return Object.values(inverter).some(Boolean) ? inverter : undefined;
}

function buildExistingBattery(collected: ConsultationEntities) {
  const battery = {
    voltage: collected.battery_voltage,
    model: collected.battery_model,
  };

  return Object.values(battery).some(Boolean) ? battery : undefined;
}

export function refreshConsultationStateIndexes(state: ConsultationState): ConsultationState {
  const collected = state.collected || {};
  const batteryVoltage = voltageToNumber(collected.battery_voltage || collected.inverter_voltage);

  return {
    ...state,
    collected,
    missingFields: state.missing || [],
    pendingClarifications: state.pendingClarifications || [],
    appliances: collected.appliance_details?.length
      ? collected.appliance_details.map((item) => item.label || item.name)
      : collected.appliances || [],
    quantities: collected.appliance_quantity || {},
    backupHours: collected.backup_hours,
    estimatedLoad: collected.total_load_watts || state.estimatedLoad,
    existingInverter: buildExistingInverter(collected),
    existingBattery: buildExistingBattery(collected),
    batteryVoltage,
  };
}

export function createConsultationState(intent?: ConsultationIntent): ConsultationState {
  return refreshConsultationStateIndexes({
    intent,
    intentHint: intent,
    childState: undefined,
    workflow: "consultation",
    collected: {},
    missing: [],
    missingFields: [],
    pendingClarifications: [],
    unrelatedTurnCount: 0,
    guidedPaused: false,
    paused: false,
    confidence: 0,
  });
}

export function normalizeConsultationState(
  state: Partial<ConsultationState> | null | undefined,
  intent?: ConsultationIntent,
): ConsultationState {
  return refreshConsultationStateIndexes({
    intent: intent || state?.intent,
    intentHint: state?.intentHint || intent || state?.intent,
    childState: state?.childState,
    workflow: "consultation",
    collected: state?.collected || {},
    missing: state?.missing || [],
    missingFields: state?.missingFields || state?.missing || [],
    pendingClarifications: state?.pendingClarifications || [],
    conversationSummary: state?.conversationSummary,
    appliances: state?.appliances,
    quantities: state?.quantities,
    backupHours: state?.backupHours,
    estimatedLoad: state?.estimatedLoad,
    existingInverter: state?.existingInverter,
    existingBattery: state?.existingBattery,
    batteryVoltage: state?.batteryVoltage,
    panelRecommendation: state?.panelRecommendation,
    protectionRecommendation: state?.protectionRecommendation,
    unrelatedTurnCount: Number.isFinite(state?.unrelatedTurnCount)
      ? Number(state?.unrelatedTurnCount)
      : 0,
    guidedPaused: Boolean(state?.guidedPaused),
    paused: Boolean(state?.paused),
    confidence: Number.isFinite(state?.confidence) ? Number(state?.confidence) : 0,
  });
}
