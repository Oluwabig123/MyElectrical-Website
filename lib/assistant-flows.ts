export type AssistantFlowId =
  | "solar"
  | "battery"
  | "inverter"
  | "panels"
  | "protection"
  | "safety"
  | "wiring"
  | "lighting"
  | "cctv"
  | "quote"
  | "whatsapp"
  | "materials";

export type AssistantFlowDefinition = {
  id: AssistantFlowId;
  label: string;
  chipLabel: string;
  intro: string;
  aliases: string[];
  quoteService: string;
  nextStep: string;
};

export const assistantFlows: Record<AssistantFlowId, AssistantFlowDefinition> = {
  solar: {
    id: "solar",
    label: "Solar sizing",
    chipLabel: "Size my solar system",
    intro: "Great. I will help you estimate the right solar setup.",
    aliases: ["size my solar system", "solar sizing", "solar quote", "solar setup"],
    quoteService: "Solar / inverter installation",
    nextStep: "Next step: request a proper load review and send site photos on WhatsApp for confirmation.",
  },
  battery: {
    id: "battery",
    label: "Battery sizing",
    chipLabel: "Recommend battery size",
    intro: "Sure. I will help you size the battery storage properly.",
    aliases: ["recommend battery size", "battery size", "battery sizing", "battery recommendation"],
    quoteService: "Battery recommendation",
    nextStep: "Next step: confirm the battery model, usable energy target, and installation arrangement before quote approval.",
  },
  inverter: {
    id: "inverter",
    label: "Inverter recommendation",
    chipLabel: "Recommend inverter",
    intro: "Good. I will help you select a practical inverter class.",
    aliases: ["recommend inverter", "inverter recommendation", "which inverter", "inverter size"],
    quoteService: "Inverter recommendation",
    nextStep: "Next step: confirm the exact model, battery voltage, and compressor loads before final quote.",
  },
  panels: {
    id: "panels",
    label: "Solar panel recommendation",
    chipLabel: "Recommend solar panels",
    intro: "Great. I will help validate a safe panel arrangement.",
    aliases: ["recommend solar panels", "solar panels", "panel recommendation", "panel configuration", "panel string"],
    quoteService: "Solar panel recommendation",
    nextStep: "Next step: confirm the inverter model and the exact panel datasheet before installation.",
  },
  protection: {
    id: "protection",
    label: "Protection recommendation",
    chipLabel: "Recommend protection components",
    intro: "Sure. I will help outline the protection and cable requirements.",
    aliases: ["protection components", "breaker size", "spd", "dc breaker", "protection recommendation"],
    quoteService: "Protection recommendation",
    nextStep: "Next step: validate the final current levels and cable charts before procurement.",
  },
  safety: {
    id: "safety",
    label: "Safety review",
    chipLabel: "Check if my setup is safe",
    intro: "Okay. I will check the situation with safety first.",
    aliases: ["check if my setup is safe", "is this safe", "safety review", "safe setup"],
    quoteService: "Safety review",
    nextStep: "Next step: isolate hazards, send clear photos or labels, and request inspection if risk signs are present.",
  },
  wiring: {
    id: "wiring",
    label: "Wiring help",
    chipLabel: "Wiring help",
    intro: "I can guide you safely.",
    aliases: ["i need wiring help", "wiring help", "fault", "breaker", "socket", "tripping", "burnt socket"],
    quoteService: "Fault diagnosis / maintenance",
    nextStep: "Next step: arrange inspection so Oduzz can confirm the fault safely before repair.",
  },
  lighting: {
    id: "lighting",
    label: "Lighting recommendation",
    chipLabel: "Lighting recommendation",
    intro: "Good. I will help recommend suitable lighting.",
    aliases: ["lighting recommendation", "lighting", "chandelier", "pop lighting", "lights"],
    quoteService: "Lighting / POP / chandeliers",
    nextStep: "Next step: share a space photo or request a quote so the lighting layout can be confirmed properly.",
  },
  cctv: {
    id: "cctv",
    label: "CCTV / smart home",
    chipLabel: "CCTV / smart home",
    intro: "I will help you plan a CCTV or smart home setup.",
    aliases: ["cctv", "smart home", "camera", "security setup", "remote viewing"],
    quoteService: "CCTV / security setup",
    nextStep: "Next step: confirm the site layout and request a quote for the right camera or automation scope.",
  },
  quote: {
    id: "quote",
    label: "Quote request",
    chipLabel: "Request a quote",
    intro: "Sure. I will collect the basic details for a proper quote.",
    aliases: ["request a quote", "quote", "start quote", "quote request", "estimate"],
    quoteService: "General electrical project",
    nextStep: "Next step: review the summary, send it on WhatsApp, or open the quote page for final submission.",
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp handoff",
    chipLabel: "Continue on WhatsApp",
    intro: "No problem. I will prepare a short WhatsApp handoff.",
    aliases: ["continue on whatsapp", "whatsapp", "chat on whatsapp"],
    quoteService: "General electrical project",
    nextStep: "Next step: continue the conversation on WhatsApp with the prepared handoff.",
  },
  materials: {
    id: "materials",
    label: "Materials recommendation",
    chipLabel: "Recommend electrical materials",
    intro: "Sure. I will help you choose safer and better materials.",
    aliases: ["recommend electrical materials", "materials", "electrical materials", "cables", "wires"],
    quoteService: "Residential / commercial wiring",
    nextStep: "Next step: confirm the project scope or request a quote for a practical material list.",
  },
};

export const assistantFlowOrder: AssistantFlowId[] = [
  "solar",
  "battery",
  "inverter",
  "panels",
  "protection",
  "safety",
  "wiring",
  "cctv",
  "quote",
  "whatsapp",
  "lighting",
  "materials",
];
