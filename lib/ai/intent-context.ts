export type ConsultationIntent =
  | "battery_sizing"
  | "inverter_recommendation"
  | "panel_recommendation"
  | "solar_sizing"
  | "safety_check"
  | "wiring_help"
  | "cctv"
  | "quote"
  | "protection_recommendation"
  | "materials_recommendation"
  | "lighting_recommendation"
  | "whatsapp";

export type ConsultationWorkflow = "consultation";

export type ConsultationIntentContext = {
  intent: ConsultationIntent;
  workflow: ConsultationWorkflow;
  mode: ConsultationWorkflow;
  startedAt: string;
  sessionId: string;
};

export type SetConsultationIntentInput = {
  intent: ConsultationIntent;
  session?: string | { id?: string; sessionId?: string } | null;
};

function resolveSessionId(session: SetConsultationIntentInput["session"]) {
  if (typeof session === "string") return session.trim();
  if (session && typeof session === "object") {
    return String(session.sessionId || session.id || "").trim();
  }

  return "";
}

export function setConsultationIntent({
  intent,
  session,
}: SetConsultationIntentInput): ConsultationIntentContext {
  return {
    intent,
    workflow: "consultation",
    mode: "consultation",
    startedAt: new Date().toISOString(),
    sessionId: resolveSessionId(session),
  };
}

export function getConsultationIntentLabel(intent: ConsultationIntent) {
  const labels: Record<ConsultationIntent, string> = {
    battery_sizing: "Battery Sizing",
    inverter_recommendation: "Inverter Recommendation",
    panel_recommendation: "Solar Panel Recommendation",
    solar_sizing: "Solar Sizing",
    safety_check: "Safety Check",
    wiring_help: "Wiring Help",
    cctv: "CCTV / Smart Home",
    quote: "Quote Request",
    protection_recommendation: "Protection Recommendation",
    materials_recommendation: "Materials Recommendation",
    lighting_recommendation: "Lighting Recommendation",
    whatsapp: "WhatsApp Handoff",
  };

  return labels[intent];
}
