import type { ConsultationEntities } from "@/lib/ai/entity-extraction";
import type { ConsultationIntent } from "@/lib/ai/intent-context";

export type ConsultationState = {
  intent?: ConsultationIntent;
  workflow: "consultation";
  collected: ConsultationEntities;
  missing: string[];
  paused: boolean;
  confidence: number;
};

export function createConsultationState(intent?: ConsultationIntent): ConsultationState {
  return {
    intent,
    workflow: "consultation",
    collected: {},
    missing: [],
    paused: false,
    confidence: 0,
  };
}

export function normalizeConsultationState(
  state: Partial<ConsultationState> | null | undefined,
  intent?: ConsultationIntent,
): ConsultationState {
  return {
    intent: intent || state?.intent,
    workflow: "consultation",
    collected: state?.collected || {},
    missing: state?.missing || [],
    paused: Boolean(state?.paused),
    confidence: Number.isFinite(state?.confidence) ? Number(state?.confidence) : 0,
  };
}
