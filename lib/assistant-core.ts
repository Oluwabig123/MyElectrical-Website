import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { oduzzAssistantDoc } from "@/data/oduzz-assistant-doc";

export const MAX_INPUT_CHARS = 600;
export const MAX_MESSAGE_CHARS = 1200;
export const MAX_MESSAGES = 40;
export const INITIAL_ASSISTANT_MESSAGE =
  "Hi, I can help with solar sizing, wiring, lighting, and quotes.";

export function normalize(text: unknown) {
  return String(text || "").trim().toLowerCase();
}

export function clampMessage(text: unknown) {
  const value = String(text || "").trim();
  if (value.length <= MAX_MESSAGE_CHARS) return value;
  return `${value.slice(0, MAX_MESSAGE_CHARS)}...`;
}

export function toNumber(text: unknown) {
  const parsed = Number(String(text || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function roundUpByTable(value: number, table: readonly number[]) {
  const found = table.find((item) => item >= value);
  return found || table[table.length - 1];
}

function getPeakSunHours(location: unknown) {
  const loc = normalize(location);
  const rows = oduzzAssistantDoc.solarSizing.peakSunHoursByLocation;
  const exact = rows.find((row) => row.match.some((key) => key !== "default" && loc.includes(key)));
  const fallback = rows.find((row) => row.match.some((key) => key === "default"));
  return (exact || fallback || { value: 4.5 }).value;
}

export function shouldStartSolarSizingFlow(text: unknown) {
  const value = normalize(text);
  return /(^|\b)(size my solar system|solar sizing|solar size|size system|calculate solar|solar calculator|solar load estimate)(\b|$)/.test(
    value,
  );
}

export function shouldStartQuoteFlow(text: unknown) {
  const value = normalize(text);
  return /(^|\b)(start quote intake|start quote|quote intake|prepare quote|request quote|help me with a quote)(\b|$)/.test(
    value,
  );
}

export function buildSolarRecommendation({
  loadsWatts,
  location,
  backupHours,
}: {
  loadsWatts: number;
  location: string;
  backupHours: number;
}) {
  const rules = oduzzAssistantDoc.solarSizing;
  const assumptions = rules.assumptions;
  const sunHours = getPeakSunHours(location);

  const inverterNeedKVA = (loadsWatts * assumptions.inverterSafetyFactor) / 1000;
  const inverterKVA = roundUpByTable(inverterNeedKVA, rules.outputRules.inverterRoundingKVA);

  const dailyEnergyKWh = (loadsWatts * backupHours) / 1000;
  const rawSolarWp = (dailyEnergyKWh * assumptions.systemLossFactor * 1000) / sunHours;
  const solarWp = roundUpByTable(rawSolarWp, rules.outputRules.panelRoundingWp);

  const batteryKWh = dailyEnergyKWh / assumptions.batteryDoD;
  const batteryAhAt48V = Math.ceil((batteryKWh * 1000) / assumptions.systemVoltage);

  return {
    inverterKVA,
    solarWp,
    batteryKWh: Number(batteryKWh.toFixed(1)),
    batteryAhAt48V,
    sunHours,
  };
}

export function buildFallbackAssistantReply(raw: unknown) {
  const text = normalize(raw);
  const isWiring = /wiring|conduit|fault|maintenance/.test(text);
  const isLighting = /lighting|chandelier|pop|interior/.test(text);
  const isQuote = /quote|estimate|cost|price|budget/.test(text);
  const isProducts = /product|cable|wire size|wire gauge/.test(text);
  const isContact = /call|phone|whatsapp|contact|email/.test(text);

  if (isWiring) {
    return `${oduzzAssistantDoc.knowledge.services.wiring} Share your location and the issue you are seeing for the next step.`;
  }

  if (isLighting) {
    return `${oduzzAssistantDoc.knowledge.services.lighting} If you want a faster quote, share the room type, fixture type, and location.`;
  }

  if (isProducts) {
    return "We currently highlight common cable sizes from 1mm to 16mm. Share the load type or intended use and I can guide you toward the right category.";
  }

  if (isQuote) {
    return "For a faster quote, share service type, location, urgency, and photos if available. You can also use the quote page for a guided form.";
  }

  if (isContact) {
    return `You can call ${CONTACT.phoneDisplay}, send WhatsApp at ${CONTACT_LINKS.whatsapp}, or email ${CONTACT.email}. Typical WhatsApp response is ${CONTACT.whatsappResponseTime}.`;
  }

  return "Ask about wiring, solar sizing, lighting, products, contact, or quote preparation. Example: 'What details do you need for a solar quote?'";
}
