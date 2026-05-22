export type AssistantFlowId =
  | "solar"
  | "materials"
  | "wiring"
  | "lighting"
  | "cctv"
  | "quote"
  | "whatsapp";

export type AssistantFlowQuestion = {
  id: string;
  prompt: string;
  summaryLabel: string;
};

export type AssistantFlowDefinition = {
  id: AssistantFlowId;
  label: string;
  chipLabel: string;
  intro: string;
  aliases: string[];
  quoteService: string;
  nextStep: string;
  questions: AssistantFlowQuestion[];
};

export const assistantFlows: Record<AssistantFlowId, AssistantFlowDefinition> = {
  solar: {
    id: "solar",
    label: "Solar sizing",
    chipLabel: "Size my solar system",
    intro: "Great. I will help you estimate the right solar setup.",
    aliases: [
      "size my solar system",
      "solar sizing",
      "solar quote",
      "inverter sizing",
      "solar setup",
    ],
    quoteService: "Solar / inverter installation",
    nextStep: "Next step: request a proper load review and send site photos on WhatsApp for confirmation.",
    questions: [
      {
        id: "appliances",
        prompt:
          "What appliances do you want to power? For example: TV, fans, freezer, bulbs, laptop, AC, pumping machine.",
        summaryLabel: "User need",
      },
      {
        id: "backup_hours",
        prompt: "How many hours of backup do you want?",
        summaryLabel: "Backup target",
      },
      {
        id: "existing_setup",
        prompt: "Do you already have an inverter or battery?",
        summaryLabel: "Existing setup",
      },
      {
        id: "usage_mode",
        prompt: "Is this for backup only or full solar use?",
        summaryLabel: "Usage mode",
      },
      {
        id: "budget",
        prompt: "What is your estimated budget range?",
        summaryLabel: "Budget",
      },
      {
        id: "location",
        prompt: "Where is the installation location?",
        summaryLabel: "Location",
      },
      {
        id: "site_media",
        prompt: "Can you send site photos on WhatsApp for proper confirmation?",
        summaryLabel: "Site media",
      },
    ],
  },
  materials: {
    id: "materials",
    label: "Materials recommendation",
    chipLabel: "Recommend electrical materials",
    intro: "Sure. I will help you choose safer and better materials.",
    aliases: [
      "recommend electrical materials",
      "materials",
      "electrical materials",
      "cables",
      "wires",
    ],
    quoteService: "Residential / commercial wiring",
    nextStep: "Next step: confirm the project scope or request a quote for a practical material list.",
    questions: [
      {
        id: "project_type",
        prompt:
          "What project are the materials for? For example: house wiring, lighting, sockets, DB, solar, CCTV.",
        summaryLabel: "Project type",
      },
      {
        id: "job_state",
        prompt: "Is this for a new installation, repair, upgrade, or replacement?",
        summaryLabel: "Job stage",
      },
      {
        id: "scale",
        prompt: "What quantity or area are you working on?",
        summaryLabel: "Scale",
      },
      {
        id: "quality_tier",
        prompt: "Do you prefer standard quality or premium quality materials?",
        summaryLabel: "Quality",
      },
      {
        id: "budget",
        prompt: "What is your budget range?",
        summaryLabel: "Budget",
      },
      {
        id: "location",
        prompt: "Where is the project location?",
        summaryLabel: "Location",
      },
    ],
  },
  wiring: {
    id: "wiring",
    label: "Wiring help",
    chipLabel: "I need wiring help",
    intro: "I can guide you safely.",
    aliases: [
      "i need wiring help",
      "wiring help",
      "fault",
      "breaker",
      "socket",
      "tripping",
      "burnt socket",
    ],
    quoteService: "Fault diagnosis / maintenance",
    nextStep: "Next step: arrange inspection so Oduzz can confirm the fault safely before repair.",
    questions: [
      {
        id: "issue",
        prompt:
          "What wiring issue are you experiencing? For example: tripping breaker, burnt socket, no power, extension, renovation, new wiring.",
        summaryLabel: "Issue",
      },
      {
        id: "affected_area",
        prompt: "Is it affecting one point, one room, or the whole building?",
        summaryLabel: "Affected area",
      },
      {
        id: "issue_timing",
        prompt: "When did the issue start?",
        summaryLabel: "When it started",
      },
      {
        id: "danger_signs",
        prompt: "Have you noticed sparks, burning smell, heat, or frequent tripping?",
        summaryLabel: "Danger signs",
      },
      {
        id: "power_state",
        prompt: "Is the power supply currently switched off?",
        summaryLabel: "Supply status",
      },
      {
        id: "location",
        prompt: "Where is the location for inspection?",
        summaryLabel: "Location",
      },
    ],
  },
  lighting: {
    id: "lighting",
    label: "Lighting recommendation",
    chipLabel: "Lighting recommendation",
    intro: "Good. I will help recommend suitable lighting.",
    aliases: [
      "lighting recommendation",
      "lighting",
      "chandelier",
      "pop lighting",
      "lights",
    ],
    quoteService: "Lighting / POP / chandeliers",
    nextStep: "Next step: share a space photo or request a quote so the lighting layout can be confirmed properly.",
    questions: [
      {
        id: "space",
        prompt:
          "What space do you want to light? For example: sitting room, bedroom, shop, office, compound, event space.",
        summaryLabel: "Space",
      },
      {
        id: "ceiling_type",
        prompt: "Is the ceiling POP, PVC, concrete, open ceiling, or outdoor?",
        summaryLabel: "Ceiling",
      },
      {
        id: "lighting_mood",
        prompt: "Do you want bright white, warm white, decorative, or premium ambience lighting?",
        summaryLabel: "Lighting mood",
      },
      {
        id: "existing_fittings",
        prompt: "Do you already have fittings installed?",
        summaryLabel: "Existing fittings",
      },
      {
        id: "budget",
        prompt: "What is your budget range?",
        summaryLabel: "Budget",
      },
      {
        id: "space_media",
        prompt: "Can you send a photo or short video of the space on WhatsApp?",
        summaryLabel: "Space media",
      },
    ],
  },
  cctv: {
    id: "cctv",
    label: "CCTV / smart home",
    chipLabel: "CCTV / smart home",
    intro: "I will help you plan a CCTV or smart home setup.",
    aliases: [
      "cctv",
      "smart home",
      "camera",
      "security setup",
      "remote viewing",
    ],
    quoteService: "CCTV / security setup",
    nextStep: "Next step: confirm the site layout and request a quote for the right camera or automation scope.",
    questions: [
      {
        id: "coverage",
        prompt: "How many areas do you want to monitor?",
        summaryLabel: "Coverage",
      },
      {
        id: "environment",
        prompt: "Is it indoor, outdoor, or both?",
        summaryLabel: "Environment",
      },
      {
        id: "remote_viewing",
        prompt: "Do you want remote viewing on your phone?",
        summaryLabel: "Remote viewing",
      },
      {
        id: "internet",
        prompt: "Do you have internet or WiFi available at the location?",
        summaryLabel: "Internet",
      },
      {
        id: "recording_days",
        prompt: "How many days of recording backup do you want?",
        summaryLabel: "Recording",
      },
      {
        id: "property_type",
        prompt: "Is this for home, office, shop, school, church, or estate?",
        summaryLabel: "Property type",
      },
      {
        id: "location",
        prompt: "Where is the installation location?",
        summaryLabel: "Location",
      },
    ],
  },
  quote: {
    id: "quote",
    label: "Quote request",
    chipLabel: "Request a quote",
    intro: "Sure. I will collect the basic details for a proper quote.",
    aliases: ["request a quote", "quote", "start quote", "quote request", "estimate"],
    quoteService: "General electrical project",
    nextStep: "Next step: review the summary, send it on WhatsApp, or open the quote page for final submission.",
    questions: [
      {
        id: "service",
        prompt: "What service do you need?",
        summaryLabel: "Service",
      },
      {
        id: "location",
        prompt: "Where is the project location?",
        summaryLabel: "Location",
      },
      {
        id: "urgency",
        prompt: "How urgent is it?",
        summaryLabel: "Urgency",
      },
      {
        id: "budget",
        prompt: "What is your budget direction?",
        summaryLabel: "Budget",
      },
      {
        id: "work_brief",
        prompt: "Can you briefly describe the work?",
        summaryLabel: "Work brief",
      },
      {
        id: "media",
        prompt: "Do you have photos or videos to help us understand the job?",
        summaryLabel: "Media",
      },
    ],
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp handoff",
    chipLabel: "Continue on WhatsApp",
    intro: "No problem. I will prepare a short WhatsApp handoff.",
    aliases: ["continue on whatsapp", "whatsapp", "chat on whatsapp"],
    quoteService: "General electrical project",
    nextStep: "Next step: continue the conversation on WhatsApp with the prepared handoff.",
    questions: [
      {
        id: "service_need",
        prompt: "What do you need help with? For example: solar, wiring, lighting, CCTV, or quote support.",
        summaryLabel: "Service",
      },
      {
        id: "location",
        prompt: "What location or project area should we note?",
        summaryLabel: "Location",
      },
    ],
  },
};

export const assistantFlowOrder: AssistantFlowId[] = [
  "solar",
  "materials",
  "wiring",
  "lighting",
  "cctv",
  "quote",
  "whatsapp",
];
