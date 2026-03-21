import { CONTACT } from "../data/contact.js";
import { oduzzAssistantDoc } from "../data/oduzzAssistantDoc.js";
import { services } from "../data/services.js";

const blogSummary = [
  "- 5 Electrical Wiring Mistakes That Create Hidden Risks [Safety]: A practical guide to common wiring shortcuts and their risk signals.",
  "- How to Think About Solar and Inverter Sizing Before You Buy [Solar]: A beginner-friendly guide to loads, backup hours, and sizing expectations.",
  "- What Good CCTV Installation Looks Like in Homes and Small Businesses [CCTV]: Placement, backup power, and cable discipline for security systems.",
  "- Before You Install POP Lights or Chandeliers, Plan These 4 Things [Lighting]: A planning guide for switching zones, mounting, and brightness balance.",
  "- How to Prepare for a Faster Electrical Quote [Planning]: The details clients should share for quicker and more accurate quote conversations.",
  "- 7 Early Signs Your Property Needs Electrical Maintenance [Safety]: Early warning signs that should be inspected before faults worsen.",
].join("\n");

const academySummary = [
  "- Home Electrical Safety Basics (Homeowners, Starter): Basic household electrical risk awareness and safe usage habits.",
  "- Solar and Inverter Planning Fundamentals (Homeowners, Core): Critical loads, backup expectations, and battery sizing thinking.",
  "- Electrical Trade Readiness (Learners, Foundation): Beginner-friendly exposure to site discipline, safety culture, and neat execution.",
].join("\n");

const resourceSummary = [
  "- Pre-quote project checklist (Checklist): Helps clients gather location, service type, photos, and load notes before asking for a quote.",
  "- Homeowner safety starter guide (Guide): Basic overload warning signs, safe appliance behavior, and maintenance timing.",
  "- Solar sizing explained simply (Mini class): Plain-language teaching for first-time solar buyers.",
  "- Beginner electrical workshop announcements (Workshop): A future slot for short training or workshop updates.",
].join("\n");

const serviceSummary = services.map((service) => `- ${service.title}: ${service.desc}`).join("\n");
const productSummary = [
  "- Product availability is managed online and can change with current stock.",
  "- For a specific item, buyers should request current availability, price, and quantity.",
  "- The product page reflects only online-managed stock entries.",
].join("\n");

export const ASSISTANT_SYSTEM_INSTRUCTIONS = [
  `You are the website assistant for ${oduzzAssistantDoc.company}.`,
  "Respond like a practical electrical advisor for a real business, not a generic AI bot.",
  "Be concise, grounded, and clear. Prefer direct answers over long explanations.",
  "Default to 2 to 4 short sentences or 3 short bullets. Keep most replies under 90 words.",
  "Only go longer when the user explicitly asks for detail or when safety steps need extra clarity.",
  "Do not invent exact prices, inspection results, or guarantees.",
  "If pricing depends on site conditions, say it depends on inspection and ask for the key missing details.",
  "If the user wants a quote, ask for service type, location, urgency, and photos or load details where relevant.",
  "If the question is outside the business scope, say so briefly and redirect to the services that are relevant.",
  "Never claim a site visit happened. Never say you completed work. Never pretend to access private company systems.",
  "When the question touches safety, encourage proper inspection instead of overconfidence.",
  "When useful, end with one practical next step, not a long checklist.",
].join("\n");

export const ASSISTANT_KNOWLEDGE_CONTEXT = [
  `Company: ${oduzzAssistantDoc.company}`,
  `Support hours: ${CONTACT.businessHours}`,
  `Typical WhatsApp response: ${CONTACT.whatsappResponseTime}`,
  `Phone: ${CONTACT.phoneDisplay}`,
  `Email: ${CONTACT.email}`,
  "",
  "Services:",
  serviceSummary,
  "",
  "Product highlights:",
  productSummary,
  "",
  "Blog content available:",
  blogSummary,
  "",
  "Academy tracks:",
  academySummary,
  "",
  "Academy resources:",
  resourceSummary,
  "",
  `Policy note: ${oduzzAssistantDoc.policy.note}`,
].join("\n");
