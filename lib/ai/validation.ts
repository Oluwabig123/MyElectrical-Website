import { extractConsultationEntities } from "@/lib/ai/entity-extraction";

export type InputValidationCategory =
  | "GREETING"
  | "CONSULTATION_DATA"
  | "QUESTION"
  | "SMALL_TALK"
  | "INVALID"
  | "OFF_TOPIC";

export type InputValidationResult = {
  category: InputValidationCategory;
  reason: string;
};

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function validateInput(input: unknown): InputValidationResult {
  const value = normalize(input);

  if (!value || value.length <= 1 || /^[^a-z0-9]+$/i.test(value)) {
    return { category: "INVALID", reason: "No meaningful sizing information was found." };
  }

  if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|morning|afternoon|evening)\b/.test(value)) {
    return { category: "GREETING", reason: "Greeting detected." };
  }

  if (/^(thanks|thank you|ok|okay|alright|nice|cool)\b/.test(value)) {
    return { category: "SMALL_TALK", reason: "Small talk detected." };
  }

  if (/\b(company|about you|about your business|who are you|what do you do|your services|contact|address)\b/.test(value)) {
    return { category: "OFF_TOPIC", reason: "General company or service question during consultation." };
  }

  const entities = extractConsultationEntities(value);
  if (Object.keys(entities).length > 0) {
    return { category: "CONSULTATION_DATA", reason: "Consultation entities detected." };
  }

  if (/[?]$/.test(value) || /^(what|how|why|can|should|is|are|do|does|tell me)\b/.test(value)) {
    return { category: "QUESTION", reason: "Question detected." };
  }

  if (value.length < 3) {
    return { category: "INVALID", reason: "Message is too short." };
  }

  return { category: "INVALID", reason: "Message does not contain actionable consultation data." };
}
