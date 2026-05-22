import { buildWhatsAppUrl } from "@/data/contact";
import { createQuoteReference, type QuoteForm } from "@/lib/quote-request";
import {
  assistantFlows,
  assistantFlowOrder,
  type AssistantFlowDefinition,
  type AssistantFlowId,
} from "@/lib/assistant-flows";

export type ConsultationAnswerMap = Record<string, string>;

export type ConsultationSummary = {
  title: string;
  service: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
  nextStep: string;
  quoteForm: QuoteForm;
  whatsappUrl: string;
  whatsappText: string;
};

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function startAssistantFlow(flowId: AssistantFlowId) {
  const flow = assistantFlows[flowId];
  const firstQuestion = flow.questions[0]?.prompt || "";

  return {
    flow,
    introMessage: firstQuestion ? `${flow.intro} ${firstQuestion}` : flow.intro,
  };
}

export function getAssistantFlow(flowId: AssistantFlowId) {
  return assistantFlows[flowId];
}

export function getAssistantFlowChoices() {
  return assistantFlowOrder.map((flowId) => assistantFlows[flowId]);
}

export function resolveAssistantFlowId(text: unknown) {
  const value = normalizeText(text);
  if (!value) return null;

  const match = assistantFlowOrder.find((flowId) =>
    assistantFlows[flowId].aliases.some((alias) => value.includes(normalizeText(alias))),
  );

  return match || null;
}

export function detectSafetyConcern(text: unknown) {
  const value = normalizeText(text);
  if (!value) return null;

  const hasConcern =
    /spark|sparking|burning smell|burnt socket|burnt|heat|hot socket|shock|tripping|trip|exposed wire|exposed cable|smoke/.test(
      value,
    );

  if (!hasConcern) return null;

  return "For safety, please switch off the affected circuit if you notice sparks, burning smell, heat, shock, or frequent tripping. Avoid touching exposed wires and request inspection.";
}

function buildConsultationDetails(flow: AssistantFlowDefinition, answers: ConsultationAnswerMap) {
  const rows = flow.questions
    .map((question) => {
      const value = String(answers[question.id] || "").trim();
      if (!value) return "";
      return `${question.summaryLabel}: ${value}`;
    })
    .filter(Boolean);

  return rows.join(" | ");
}

function buildQuoteForm(
  flow: AssistantFlowDefinition,
  answers: ConsultationAnswerMap,
  {
    referenceId = "",
    imageUrls = [],
  }: {
    referenceId?: string;
    imageUrls?: string[];
  } = {},
) {
  const location =
    answers.location ||
    answers.installation_location ||
    answers.project_location ||
    "";
  const budget = answers.budget || "";
  const service = flow.id === "quote" ? answers.service || flow.quoteService : flow.quoteService;
  const urgency = flow.id === "quote" ? answers.urgency || "" : "";
  const details =
    flow.id === "quote"
      ? [answers.work_brief, answers.media].filter(Boolean).join(" | ")
      : buildConsultationDetails(flow, answers);

  return {
    name: "",
    phone: "",
    service,
    location,
    details,
    urgency,
    budget,
    referenceId: referenceId || (flow.id === "quote" ? createQuoteReference() : ""),
    imageUrls,
  } satisfies QuoteForm;
}

function buildWhatsAppText(flow: AssistantFlowDefinition, rows: ConsultationSummary["rows"], nextStep: string) {
  const lines = [
    `Hello Oduzz, I need help with ${flow.label.toLowerCase()}.`,
    "Consultation summary:",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    nextStep,
  ];

  return lines.join("\n");
}

export function generateConsultationSummary(
  flowId: AssistantFlowId,
  answers: ConsultationAnswerMap,
  options?: {
    referenceId?: string;
    imageUrls?: string[];
  },
): ConsultationSummary {
  const flow = assistantFlows[flowId];
  const rows = flow.questions
    .map((question) => {
      const value = String(answers[question.id] || "").trim();
      if (!value) return null;
      return {
        label: question.summaryLabel,
        value,
      };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
  const nextStep = flow.nextStep;
  const quoteForm = buildQuoteForm(flow, answers, options);
  const whatsappText = buildWhatsAppText(flow, rows, nextStep);

  return {
    title: "Consultation Summary",
    service: flow.label,
    rows,
    nextStep,
    quoteForm,
    whatsappText,
    whatsappUrl: createConsultationWhatsAppUrl(flowId, whatsappText),
  };
}

export function createConsultationWhatsAppUrl(flowId: AssistantFlowId, summaryText: string) {
  const flow = assistantFlows[flowId];
  const prefix = flow.id === "whatsapp" ? "Hello Oduzz," : "";
  const message = prefix && !summaryText.startsWith(prefix) ? `${prefix}\n${summaryText}` : summaryText;
  return buildWhatsAppUrl(encodeURIComponent(message));
}

export function buildFlowCompletionMessage(flowId: AssistantFlowId) {
  const flow = assistantFlows[flowId];
  if (flow.id === "whatsapp") {
    return "Your WhatsApp handoff is ready. Continue with the prepared message below.";
  }

  return `Your ${flow.label.toLowerCase()} summary is ready. Continue with a quote or WhatsApp below.`;
}
