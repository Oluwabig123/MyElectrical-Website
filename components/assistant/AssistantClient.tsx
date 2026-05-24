"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import AssistantChat, { type AssistantMessage } from "@/components/assistant/AssistantChat";
import QuickActions from "@/components/assistant/QuickActions";
import { buildWhatsAppUrl } from "@/data/contact";
import { createConsultationWhatsAppUrl, type ConsultationSummary } from "@/lib/assistant-flow-helpers";
import { assistantFlows, assistantFlowOrder, type AssistantFlowId } from "@/lib/assistant-flows";
import {
  getConsultationIntentLabel,
  setConsultationIntent,
  type ConsultationIntent,
  type ConsultationIntentContext,
} from "@/lib/ai/intent-context";
import { createConsultationState, type ConsultationState } from "@/lib/ai/consultation-state";
import type { SizingRecommendation } from "@/lib/engineering/types";
import {
  buildFallbackAssistantReply,
  clampMessage,
  INITIAL_ASSISTANT_MESSAGE,
  MAX_INPUT_CHARS,
  MAX_MESSAGES,
} from "@/lib/assistant-core";
import { buildQuotePrefillSearch, createQuoteReference } from "@/lib/quote-request";
import {
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  canUploadQuoteImages,
  uploadQuoteLeadImages,
} from "@/lib/quote-lead-storage";
import styles from "./AssistantClient.module.css";

type CompletedConsultation = {
  flowId: AssistantFlowId;
  summary: ConsultationSummary;
  recommendation?: SizingRecommendation | null;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

async function requestAssistantReply(messages: AssistantMessage[]) {
  return requestConsultationReply({
    messages,
  });
}

async function requestConsultationReply({
  messages,
  intentContext,
  consultationState,
  mode,
}: {
  messages: AssistantMessage[];
  intentContext?: ConsultationIntentContext | null;
  consultationState?: ConsultationState | null;
  mode?: "activate_consultation";
}) {
  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.text,
      })),
      intentContext,
      consultationState,
      mode,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Assistant request failed.");
  }

  return {
    answer: String(payload.answer || payload.text || "").trim(),
    usedKnowledgeBase: Boolean(payload.usedKnowledgeBase),
    consultationState: (payload.consultationState || null) as ConsultationState | null,
    recommendation: (payload.recommendation || null) as SizingRecommendation | null,
  };
}

function buildRecommendationWhatsAppText(recommendation: SizingRecommendation) {
  return [
    "Hello Oduzz Electrical Concepts, I need help with this setup:",
    "",
    recommendation.quoteSummary,
    "",
    "Please advise and quote.",
  ].join("\n");
}

const FLOW_INTENTS: Record<AssistantFlowId, ConsultationIntent> = {
  solar: "solar_sizing",
  battery: "battery_sizing",
  inverter: "inverter_recommendation",
  panels: "panel_recommendation",
  protection: "protection_recommendation",
  safety: "safety_check",
  wiring: "wiring_help",
  lighting: "lighting_recommendation",
  cctv: "cctv",
  quote: "quote",
  whatsapp: "whatsapp",
  materials: "materials_recommendation",
};

function resolveAssistantFlowId(text: unknown) {
  const value = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!value) return null;

  return (
    assistantFlowOrder.find((flowId) =>
      assistantFlows[flowId].aliases.some((alias) => value.includes(alias.toLowerCase())),
    ) || null
  );
}

export default function AssistantClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [intentContext, setIntentContext] = useState<ConsultationIntentContext | null>(null);
  const [consultationState, setConsultationState] = useState<ConsultationState | null>(null);
  const [completion, setCompletion] = useState<CompletedConsultation | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");
  const [quoteImageUrls, setQuoteImageUrls] = useState<string[]>([]);
  const [quoteReferenceId, setQuoteReferenceId] = useState("");
  const [isUploadingQuoteImage, setIsUploadingQuoteImage] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef(`assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const activeIntent = intentContext?.intent || consultationState?.intent || null;
  const isBusy = isResponding || isUploadingQuoteImage;
  const headerState = useMemo(() => {
    if (isResponding) return "Replying";
    if (activeIntent) return getConsultationIntentLabel(activeIntent);
    if (completion) return "Summary ready";
    return "Consultation desk";
  }, [activeIntent, completion, isResponding]);
  const showCharacterCount = input.length >= MAX_INPUT_CHARS - 80;
  const activeQuotePhotoCount = activeIntent === "quote" ? quoteImageUrls.length : 0;
  const completionQuoteLink = completion
    ? `/quote${buildQuotePrefillSearch(completion.summary.quoteForm, { source: "assistant" })}`
    : "/quote";
  const completionWhatsAppUrl = completion
    ? completion.recommendation
      ? buildWhatsAppUrl(encodeURIComponent(buildRecommendationWhatsAppText(completion.recommendation)))
      : createConsultationWhatsAppUrl(completion.flowId, completion.summary.whatsappText)
    : buildWhatsAppUrl();

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [assistantStatus, completion, isResponding, messages]);

  function addAssistantMessage(
    text: string,
    metadata?: {
      isSafety?: boolean;
      usedKnowledgeBase?: boolean;
    },
  ) {
    const safeText = clampMessage(text);
    const nextMessage: AssistantMessage = {
      role: "assistant",
      text: safeText,
      isSafety: Boolean(metadata?.isSafety),
      usedKnowledgeBase: Boolean(metadata?.usedKnowledgeBase),
    };
    setMessages((prev) => [
      ...prev,
      nextMessage,
    ].slice(-MAX_MESSAGES));
  }

  function resetAssistant() {
    if (isBusy) return;
    setInput("");
    setIntentContext(null);
    setConsultationState(null);
    setCompletion(null);
    setAssistantStatus("");
    setQuoteImageUrls([]);
    setQuoteReferenceId("");
    setMessages([{ role: "assistant", text: INITIAL_ASSISTANT_MESSAGE }]);
  }

  async function startFlow(flowId: AssistantFlowId) {
    const nextIntentContext = setConsultationIntent({
      intent: FLOW_INTENTS[flowId],
      session: sessionIdRef.current,
    });
    const nextConsultationState = createConsultationState(nextIntentContext.intent);
    setInput("");
    setAssistantStatus("");
    setIntentContext(nextIntentContext);
    setConsultationState(nextConsultationState);
    setCompletion(null);
    setQuoteImageUrls([]);
    setQuoteReferenceId(flowId === "quote" ? createQuoteReference() : "");
    setIsResponding(true);

    try {
      const reply = await requestConsultationReply({
        messages,
        intentContext: nextIntentContext,
        consultationState: nextConsultationState,
        mode: "activate_consultation",
      });

      if (reply.consultationState) {
        setConsultationState(reply.consultationState);
      }

      addAssistantMessage(reply.answer, {
        usedKnowledgeBase: reply.usedKnowledgeBase,
      });
    } catch {
      addAssistantMessage(assistantFlows[flowId].intro);
      setAssistantStatus("The consultation is active. Tell me what you want to power.");
    } finally {
      setIsResponding(false);
    }
  }

  async function handleQuoteImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (activeIntent !== "quote") {
      setAssistantStatus("Photo upload is only available during the quote flow.");
      return;
    }

    if (!canUploadQuoteImages()) {
      setAssistantStatus(
        "Image uploads need Supabase configuration. You can still send photos on WhatsApp.",
      );
      return;
    }

    const remainingSlots = MAX_QUOTE_IMAGE_COUNT - quoteImageUrls.length;

    if (remainingSlots <= 0) {
      setAssistantStatus(`You already added the maximum of ${MAX_QUOTE_IMAGE_COUNT} photos.`);
      return;
    }

    const referenceId = quoteReferenceId || createQuoteReference();
    setQuoteReferenceId(referenceId);
    setIsUploadingQuoteImage(true);
    setAssistantStatus("");

    const { imageUrls, error } = await uploadQuoteLeadImages({
      files: files.slice(0, remainingSlots),
      referenceId,
    });

    setIsUploadingQuoteImage(false);

    if (error) {
      setAssistantStatus(error);
      return;
    }

    setQuoteImageUrls((current) => [...current, ...imageUrls].slice(0, MAX_QUOTE_IMAGE_COUNT));
    setAssistantStatus(
      `${imageUrls.length} photo(s) uploaded. They will be included in the quote handoff.`,
    );
  }

  async function handleFreeformReply(raw: string, nextHistory: AssistantMessage[]) {
    const matchedFlowId = resolveAssistantFlowId(raw);
    if (matchedFlowId && !intentContext) {
      void startFlow(matchedFlowId);
      return;
    }

    setIsResponding(true);
    setAssistantStatus("");

    try {
      const reply =
        intentContext || consultationState
          ? await requestConsultationReply({
              messages: nextHistory,
              intentContext,
              consultationState,
            })
          : await requestAssistantReply(nextHistory);

      if (reply.consultationState) {
        setConsultationState(reply.consultationState);
      }

      addAssistantMessage(reply.answer || buildFallbackAssistantReply(raw), {
        usedKnowledgeBase: reply.usedKnowledgeBase,
      });
    } catch {
      addAssistantMessage(buildFallbackAssistantReply(raw));
      setAssistantStatus(
        "Sorry, I could not complete that request right now. Please try again or continue on WhatsApp.",
      );
    } finally {
      setIsResponding(false);
    }
  }

  async function sendMessage(raw: string) {
    const safeRaw = String(raw || "").trim().slice(0, MAX_INPUT_CHARS);
    if (!safeRaw) return;
    const command = safeRaw.toLowerCase();

    if (/^(cancel|stop|reset|clear|start over)$/i.test(command)) {
      resetAssistant();
      return;
    }

    if (!activeIntent && completion) {
      setCompletion(null);
    }

    const userMessage: AssistantMessage = { role: "user", text: clampMessage(safeRaw) };
    const nextHistory = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(nextHistory);

    await handleFreeformReply(safeRaw, nextHistory);
  }

  function onSend() {
    if (!input.trim() || isBusy) return;
    const raw = input;
    setInput("");
    void sendMessage(raw);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  function onQuickAction(flowId: AssistantFlowId) {
    if (isBusy) return;
    void startFlow(flowId);
  }

  return (
    <section className={cn("section", styles.assistantPage)}>
      <Container className={styles.assistantContainer}>
        <div className={styles.chatShell}>
          <header className={styles.chatHeader}>
            <div className={styles.chatBrand}>
              <div className={styles.chatLogoWrap}>
                <Image
                  src="/oduzz-logo-transparent.webp"
                  alt="Oduzz Electrical Concept"
                  width={120}
                  height={42}
                  className={styles.chatLogo}
                  priority
                />
              </div>
              <div className={styles.chatBrandCopy}>
                <strong>Oduzz AI Electrical Consultant</strong>
                <span>{headerState}</span>
              </div>
            </div>

            <div className={styles.chatHeaderActions}>
              <button
                type="button"
                className={styles.chatClearBtn}
                onClick={resetAssistant}
                disabled={isBusy}
              >
                Clear
              </button>
            </div>
          </header>

          <div className={styles.chatIntro}>
            <h1>Guided electrical consultation</h1>
            <p>Choose a service. The assistant will collect the essentials and validate the next step.</p>
          </div>

          <AssistantChat
            messages={messages}
            isResponding={isResponding}
            assistantStatus={assistantStatus}
            bodyRef={bodyRef}
          >
            {completion ? (
              <>
                {completion.recommendation ? (
                  <div className={styles.recommendationCard}>
                    <div className={styles.recommendationHead}>
                      <div>
                        <p className={styles.summaryLabel}>Recommended setup</p>
                        <h2 className={styles.summaryTitle}>Oduzz AI Electrical Consultant</h2>
                      </div>
                      <span className={styles.confidenceBadge}>
                        {completion.recommendation.confidenceLevel} confidence
                      </span>
                    </div>

                    {completion.recommendation.safetyNote ? (
                      <div className={styles.safetyCard}>
                        <p className={styles.safetyTitle}>Safety note</p>
                        <p className={styles.safetyText}>{completion.recommendation.safetyNote}</p>
                      </div>
                    ) : null}

                    {completion.recommendation.verifiedSpecs.length ? (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationLabel}>Verified specs used</p>
                        <div className={styles.recommendationGrid}>
                          {completion.recommendation.verifiedSpecs.map((row) => (
                            <div key={`${row.label}-${row.value}`} className={styles.recommendationItem}>
                              <span>{row.label}</span>
                              <strong>{row.value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {completion.recommendation.calculations.length ? (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationLabel}>Calculation</p>
                        <div className={styles.recommendationGrid}>
                          {completion.recommendation.calculations.map((row) => (
                            <div key={`${row.label}-${row.value}`} className={styles.recommendationItem}>
                              <span>{row.label}</span>
                              <strong>{row.value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {completion.recommendation.decision.length ? (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationLabel}>Decision</p>
                        <ul className={styles.recommendationList}>
                          {completion.recommendation.decision.map((item, index) => (
                            <li key={`${index}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {completion.recommendation.recommendedComponents.length ? (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationLabel}>Recommended components</p>
                        <div className={styles.componentList}>
                          {completion.recommendation.recommendedComponents.map((item) => (
                            <div key={`${item.category}-${item.recommendation}`} className={styles.componentItem}>
                              <div className={styles.componentHead}>
                                <strong>{item.category}</strong>
                                <span>{item.confidence}</span>
                              </div>
                              <p>{item.recommendation}</p>
                              {item.note ? <small>{item.note}</small> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {completion.recommendation.missingInformation.length ? (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationLabel}>Missing information</p>
                        <ul className={styles.recommendationList}>
                          {completion.recommendation.missingInformation.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className={styles.summaryCard}>
                  <div className={styles.summaryHead}>
                    <div>
                      <p className={styles.summaryLabel}>{completion.summary.title}</p>
                      <h2 className={styles.summaryTitle}>{completion.summary.service}</h2>
                    </div>
                    {completion.summary.quoteForm.referenceId ? (
                      <span className={styles.summaryMeta}>
                        {completion.summary.quoteForm.referenceId}
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.summaryGrid}>
                    {completion.recommendation
                      ? [
                          { label: "Service", value: completion.recommendation.projectSummary.service },
                          { label: "Location", value: completion.recommendation.projectSummary.location },
                          { label: "Appliances", value: completion.recommendation.projectSummary.appliances },
                          { label: "Backup target", value: completion.recommendation.projectSummary.backupTarget },
                          {
                            label: "Recommended setup",
                            value: completion.recommendation.projectSummary.recommendedSetup,
                          },
                          { label: "Confidence", value: completion.recommendation.projectSummary.confidence },
                        ].map((row) => (
                          <div key={`${row.label}-${row.value}`} className={styles.summaryItem}>
                            <span>{row.label}</span>
                            <strong>{row.value}</strong>
                          </div>
                        ))
                      : completion.summary.rows.map((row) => (
                          <div key={`${row.label}-${row.value}`} className={styles.summaryItem}>
                            <span>{row.label}</span>
                            <strong>{row.value}</strong>
                          </div>
                        ))}
                    {completion.summary.quoteForm.imageUrls.length ? (
                      <div className={styles.summaryItem}>
                        <span>Uploads</span>
                        <strong>{completion.summary.quoteForm.imageUrls.length} photo(s)</strong>
                      </div>
                    ) : null}
                  </div>

                  <p className={styles.summaryNext}>
                    {completion.recommendation
                      ? completion.recommendation.projectSummary.nextStep
                      : completion.summary.nextStep}
                  </p>

                  <div className={styles.summaryActions}>
                    <Link className={cn("btn", "primary", styles.summaryActionPrimary)} href={completionQuoteLink}>
                      Request Full Quote
                    </Link>
                    <a
                      className={cn("btn", "outline", styles.summaryActionSecondary)}
                      href={completionWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Continue on WhatsApp
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </AssistantChat>

          <div className={styles.composerDock}>
            <QuickActions
              activeIntent={activeIntent}
              flowIntents={FLOW_INTENTS}
              disabled={isBusy}
              onSelect={onQuickAction}
            />

            {activeIntent === "quote" ? (
              <div className={styles.uploadRow}>
                <div className={styles.uploadCopy}>
                  <span className={styles.uploadLabel}>Optional photos</span>
                  <p className={styles.uploadText}>
                    {activeQuotePhotoCount}/{MAX_QUOTE_IMAGE_COUNT} uploaded. Up to{" "}
                    {Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB each.
                  </p>
                </div>
                <label className={cn("assistantUploadButton", styles.uploadButton)}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleQuoteImageChange}
                    disabled={isBusy}
                  />
                  {isUploadingQuoteImage ? "Uploading..." : "Add photos"}
                </label>
              </div>
            ) : null}

            {completion ? (
              <div className={styles.inlineWhatsAppRow}>
                <a
                  className={cn("btn", "outline", styles.inlineWhatsAppBtn)}
                  href={completionWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share summary on WhatsApp
                </a>
                <a
                  className={cn("btn", "outline", styles.inlineWhatsAppBtn)}
                  href={buildWhatsAppUrl(
                    encodeURIComponent("Hello Oduzz, I need help with the next step for my project."),
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  General WhatsApp
                </a>
              </div>
            ) : null}

            <div className={styles.composerRow}>
              <div className={styles.inputShell}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_CHARS))}
                  onKeyDown={onKeyDown}
                  placeholder={
                    activeIntent
                      ? "Share your setup, question, or next detail..."
                      : "Ask a question or choose a service..."
                  }
                  rows={1}
                  maxLength={MAX_INPUT_CHARS}
                  aria-label="Ask Oduzz a question"
                  disabled={isBusy}
                />
              </div>
              <button
                type="button"
                className={cn("btn", "primary", styles.sendBtn)}
                onClick={onSend}
                disabled={isBusy}
              >
                {isResponding ? "Replying..." : "Send"}
              </button>
            </div>

            {showCharacterCount ? (
              <div className={styles.composerMeta}>
                <span>
                  {input.length}/{MAX_INPUT_CHARS}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
