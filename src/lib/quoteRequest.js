export const INITIAL_QUOTE_FORM = {
  name: "",
  phone: "",
  service: "",
  location: "",
  details: "",
  urgency: "",
  budget: "",
  referenceId: "",
  imageUrls: [],
};

export const SERVICE_OPTIONS = [
  "Residential / commercial wiring",
  "Solar / inverter installation",
  "CCTV / security setup",
  "Smart home systems",
  "Lighting / POP / chandeliers",
  "Fault diagnosis / maintenance",
];

export const URGENCY_OPTIONS = [
  "Emergency / ASAP",
  "Within a few days",
  "This week",
  "Just planning",
];

export const BUDGET_OPTIONS = [
  "Need site visit first",
  "Under N500k",
  "N500k - N2m",
  "Above N2m",
];

const SERVICE_MATCHERS = [
  {
    value: "Residential / commercial wiring",
    keywords: ["wiring", "wire", "conduit", "rewire", "electrical installation", "commercial", "residential"],
  },
  {
    value: "Solar / inverter installation",
    keywords: ["solar", "inverter", "panel", "battery", "backup power"],
  },
  {
    value: "CCTV / security setup",
    keywords: ["cctv", "camera", "security", "surveillance"],
  },
  {
    value: "Smart home systems",
    keywords: ["smart", "automation", "automated", "switch control", "smart home"],
  },
  {
    value: "Lighting / POP / chandeliers",
    keywords: ["lighting", "light", "chandelier", "pop", "interior", "fixture"],
  },
  {
    value: "Fault diagnosis / maintenance",
    keywords: ["fault", "maintenance", "repair", "tripping", "outage", "diagnosis"],
  },
];

const URGENCY_MATCHERS = [
  { value: "Emergency / ASAP", keywords: ["emergency", "urgent", "asap", "now", "today", "immediately"] },
  { value: "Within a few days", keywords: ["few days", "2 days", "3 days", "soon", "next few days"] },
  { value: "This week", keywords: ["this week", "week", "before weekend"] },
  { value: "Just planning", keywords: ["planning", "just planning", "research", "later", "next month"] },
];

const BUDGET_MATCHERS = [
  {
    value: "Need site visit first",
    keywords: ["site visit", "inspection first", "not sure", "dont know", "don't know", "assess first"],
  },
  { value: "Under N500k", keywords: ["under 500", "below 500", "500k", "budget 500"] },
  { value: "N500k - N2m", keywords: ["500k", "2m", "mid range", "midrange", "between"] },
  { value: "Above N2m", keywords: ["above 2m", "over 2m", "2 million", "premium budget"] },
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findExactOption(raw, options) {
  const value = normalizeText(raw);
  return options.find((option) => normalizeText(option) === value) || "";
}

function findByKeywords(raw, matchers) {
  const value = normalizeText(raw);
  if (!value) return "";
  const match = matchers.find((item) => item.keywords.some((keyword) => value.includes(keyword)));
  return match ? match.value : "";
}

export function sanitizePhoneInput(value) {
  return String(value || "").replace(/[^0-9+() -]/g, "");
}

export function isValidPhone(phone) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function matchQuoteService(raw) {
  return findExactOption(raw, SERVICE_OPTIONS) || findByKeywords(raw, SERVICE_MATCHERS);
}

export function matchQuoteUrgency(raw) {
  return findExactOption(raw, URGENCY_OPTIONS) || findByKeywords(raw, URGENCY_MATCHERS);
}

export function matchQuoteBudget(raw) {
  return findExactOption(raw, BUDGET_OPTIONS) || findByKeywords(raw, BUDGET_MATCHERS);
}

export function buildQuoteSummary(form) {
  const lines = [
    "Quote intake summary:",
    `Reference: ${form.referenceId || "Pending"}`,
    `Service: ${form.service || "N/A"}`,
    `Location: ${form.location || "N/A"}`,
    `Project brief: ${form.details || "N/A"}`,
    `Urgency: ${form.urgency || "N/A"}`,
    `Budget: ${form.budget || "N/A"}`,
    `Contact name: ${form.name || "N/A"}`,
    `Phone: ${form.phone || "N/A"}`,
    `Photos: ${Array.isArray(form.imageUrls) ? form.imageUrls.length : 0}`,
  ];

  return lines.join("\n");
}

export function buildQuoteWhatsAppMessage(form, { source = "website" } = {}) {
  const lines = [
    "Hello Oduzz, I want to request a quote.",
    `Source: ${source}`,
    `Reference: ${form.referenceId || "Pending"}`,
    `Name: ${form.name || "N/A"}`,
    `Phone: ${form.phone || "N/A"}`,
    `Service: ${form.service || "N/A"}`,
    `Location: ${form.location || "N/A"}`,
    `Urgency: ${form.urgency || "N/A"}`,
    `Budget: ${form.budget || "N/A"}`,
    `Brief: ${form.details || "N/A"}`,
    `Photo uploads: ${Array.isArray(form.imageUrls) ? form.imageUrls.length : 0}`,
  ];

  if (Array.isArray(form.imageUrls) && form.imageUrls.length) {
    lines.push("Photo links:");
    lines.push(...form.imageUrls.slice(0, 3));
  }

  return lines.join("\n");
}

export function validateQuoteForm(form) {
  const nextErrors = {};

  if (!String(form.name || "").trim()) nextErrors.name = "Enter your name.";
  if (!String(form.phone || "").trim()) nextErrors.phone = "Enter a phone number.";
  if (String(form.phone || "").trim() && !isValidPhone(form.phone)) {
    nextErrors.phone = "Enter a valid phone number (10 to 15 digits).";
  }
  if (!String(form.service || "").trim()) nextErrors.service = "Select a service.";
  if (!String(form.location || "").trim()) nextErrors.location = "Enter your location.";

  return nextErrors;
}

export function buildQuotePrefillSearch(form, { source = "assistant" } = {}) {
  const params = new URLSearchParams();

  Object.entries({
    source,
    referenceId: form.referenceId,
    name: form.name,
    phone: form.phone,
    service: form.service,
    location: form.location,
    details: form.details,
    urgency: form.urgency,
    budget: form.budget,
  }).forEach(([key, value]) => {
    if (String(value || "").trim()) params.set(key, String(value).trim());
  });

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function readQuotePrefill(search = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));

  return {
    source: params.get("source") || "",
    form: {
      ...INITIAL_QUOTE_FORM,
      referenceId: params.get("referenceId") || "",
      name: params.get("name") || "",
      phone: params.get("phone") || "",
      service: params.get("service") || "",
      location: params.get("location") || "",
      details: params.get("details") || "",
      urgency: params.get("urgency") || "",
      budget: params.get("budget") || "",
    },
  };
}

export function createQuoteReference(prefix = "ODQ") {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const token = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${token}`;
}
