"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildWhatsAppUrl } from "@/data/contact";
import {
  buildFlowCompletionMessage,
  createConsultationWhatsAppUrl,
  detectSafetyConcern,
  generateConsultationSummary,
  getAssistantFlow,
  getAssistantFlowChoices,
  resolveAssistantFlowId,
  startAssistantFlow,
  type ConsultationAnswerMap,
  type ConsultationSummary,
} from "@/lib/assistant-flow-helpers";
import { type AssistantFlowId } from "@/lib/assistant-flows";
import {
  buildFallbackAssistantReply,
  clampMessage,
  INITIAL_ASSISTANT_MESSAGE,
  MAX_INPUT_CHARS,
  MAX_MESSAGES,
} from "@/lib/assistant-core";
import { buildQuotePrefillSearch, buildQuoteSummary, createQuoteReference } from "@/lib/quote-request";
import {
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  canUploadQuoteImages,
  saveQuoteLead,
  uploadQuoteLeadImages,
} from "@/lib/quote-lead-storage";
import styles from "./AssistantClient.module.css";

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
  isSafety?: boolean;
  usedKnowledgeBase?: boolean;
};

type CompletedConsultation = {
  flowId: AssistantFlowId;
  summary: ConsultationSummary;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function renderMessageText(text: string) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, blockIndex) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const isListBlock =
        lines.length > 1 && lines.every((line) => /^(\d+\.\s|[-*]\s)/.test(line));

      if (isListBlock) {
        return (
          <ol key={`list-${blockIndex}`} className={styles.messageList}>
            {lines.map((line, lineIndex) => (
              <li key={`${blockIndex}-${lineIndex}`}>{line.replace(/^(\d+\.\s|[-*]\s)/, "")}</li>
            ))}
          </ol>
        );
      }

      return (
        <p key={`text-${blockIndex}`} className={styles.messageText}>
          {lines.map((line, lineIndex) => (
            <Fragment key={`${blockIndex}-${lineIndex}`}>
              {lineIndex > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </p>
      );
    });
}

async function requestAssistantReply(messages: AssistantMessage[]) {
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
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Assistant request failed.");
  }

  return {
    answer: String(payload.answer || payload.text || "").trim(),
    usedKnowledgeBase: Boolean(payload.usedKnowledgeBase),
  };
}

const FLOW_CHOICES = getAssistantFlowChoices();

export default function AssistantClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [activeFlowId, setActiveFlowId] = useState<AssistantFlowId | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ConsultationAnswerMap>({});
  const [completion, setCompletion] = useState<CompletedConsultation | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");
  const [quoteImageUrls, setQuoteImageUrls] = useState<string[]>([]);
  const [quoteReferenceId, setQuoteReferenceId] = useState("");
  const [isUploadingQuoteImage, setIsUploadingQuoteImage] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const activeFlow = activeFlowId ? getAssistantFlow(activeFlowId) : null;
  const totalQuestions = activeFlow?.questions.length || 0;
  const isBusy = isResponding || isUploadingQuoteImage;
  const headerState = useMemo(() => {
    if (isResponding) return "Replying";
    if (activeFlow) return `${activeFlow.label} ${currentQuestionIndex + 1}/${totalQuestions}`;
    if (completion) return "Summary ready";
    return "Consultation desk";
  }, [activeFlow, completion, currentQuestionIndex, isResponding, totalQuestions]);
  const showCharacterCount = input.length >= MAX_INPUT_CHARS - 80;
  const activeQuotePhotoCount = activeFlowId === "quote" ? quoteImageUrls.length : 0;
  const completionQuoteLink = completion
    ? `/quote${buildQuotePrefillSearch(completion.summary.quoteForm, { source: "assistant" })}`
    : "/quote";

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
    setActiveFlowId(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCompletion(null);
    setAssistantStatus("");
    setQuoteImageUrls([]);
    setQuoteReferenceId("");
    setMessages([{ role: "assistant", text: INITIAL_ASSISTANT_MESSAGE }]);
  }

  function startFlow(flowId: AssistantFlowId) {
    const { introMessage } = startAssistantFlow(flowId);
    setInput("");
    setAssistantStatus("");
    setActiveFlowId(flowId);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCompletion(null);
    setQuoteImageUrls([]);
    setQuoteReferenceId(flowId === "quote" ? createQuoteReference() : "");
    setMessages([{ role: "assistant", text: introMessage }]);
  }

  async function handleQuoteImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (activeFlowId !== "quote") {
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

  async function completeGuidedFlow(
    flowId: AssistantFlowId,
    nextAnswers: ConsultationAnswerMap,
    nextHistory: AssistantMessage[],
  ) {
    const summary = generateConsultationSummary(flowId, nextAnswers, {
      referenceId: flowId === "quote" ? quoteReferenceId || createQuoteReference() : "",
      imageUrls: flowId === "quote" ? quoteImageUrls : [],
    });

    setCompletion({ flowId, summary });
    setActiveFlowId(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuoteImageUrls([]);
    setQuoteReferenceId("");
    addAssistantMessage(buildFlowCompletionMessage(flowId));

    if (flowId !== "quote") {
      setAssistantStatus("Summary ready. Continue with a quote or WhatsApp below.");
      return;
    }

    setAssistantStatus("Quote summary ready. Saving the lead...");
    const { saved } = await saveQuoteLead({
      form: summary.quoteForm,
      source: "assistant",
      channel: "assistant-chat",
      summary: buildQuoteSummary(summary.quoteForm),
      conversation: nextHistory.slice(-12),
    });

    setAssistantStatus(
      saved
        ? "Quote summary saved. Continue with a quote or WhatsApp below."
        : "Quote summary ready. Lead storage is unavailable, but handoff still works.",
    );
  }

  async function handleGuidedReply(raw: string, nextHistory: AssistantMessage[]) {
    if (!activeFlowId || !activeFlow) return;

    const question = activeFlow.questions[currentQuestionIndex];
    if (!question) return;

    const nextAnswers = {
      ...answers,
      [question.id]: clampMessage(raw),
    };
    setAnswers(nextAnswers);

    const safetyMessage = detectSafetyConcern(raw);
    if (safetyMessage) {
      addAssistantMessage(safetyMessage, { isSafety: true });
    }

    const isLastQuestion = currentQuestionIndex >= activeFlow.questions.length - 1;
    if (isLastQuestion) {
      await completeGuidedFlow(activeFlowId, nextAnswers, nextHistory);
      return;
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextQuestionIndex);
    addAssistantMessage(activeFlow.questions[nextQuestionIndex].prompt);
  }

  async function handleFreeformReply(raw: string, nextHistory: AssistantMessage[]) {
    const matchedFlowId = resolveAssistantFlowId(raw);
    if (matchedFlowId) {
      startFlow(matchedFlowId);
      return;
    }

    const safetyMessage = detectSafetyConcern(raw);
    if (safetyMessage) {
      addAssistantMessage(safetyMessage, { isSafety: true });
      addAssistantMessage(buildFallbackAssistantReply(raw));
      setAssistantStatus("Safety first. Request inspection if the issue looks hazardous.");
      return;
    }

    setIsResponding(true);
    setAssistantStatus("");

    try {
      const reply = await requestAssistantReply(nextHistory);
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

    if (!activeFlowId && completion) {
      setCompletion(null);
    }

    const userMessage: AssistantMessage = { role: "user", text: clampMessage(safeRaw) };
    const nextHistory = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(nextHistory);

    if (activeFlowId) {
      await handleGuidedReply(safeRaw, nextHistory);
      return;
    }

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
    startFlow(flowId);
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
                <strong>Oduzz AI</strong>
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
            <h1>Electrical consultation desk</h1>
            <p>Choose a service or type your question. The assistant will guide the next step.</p>
          </div>

          <div className={styles.chatThread} ref={bodyRef} role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(styles.messageRow, message.role === "user" && styles.messageRowUser)}
              >
                <div
                  className={cn(
                    styles.messageContent,
                    message.role === "user" && styles.messageContentUser,
                  )}
                >
                  <span className={styles.srOnly}>
                    {message.role === "user" ? "You" : "Oduzz AI"}
                  </span>
                  <div
                    className={cn(
                      styles.messageBubble,
                      message.role === "user"
                        ? styles.messageBubbleUser
                        : styles.messageBubbleAssistant,
                      message.isSafety && styles.messageBubbleSafety,
                    )}
                  >
                    {renderMessageText(message.text)}
                  </div>
                  {message.usedKnowledgeBase ? (
                    <p className={styles.messageSourceTag}>Based on Oduzz knowledge base</p>
                  ) : null}
                </div>
              </div>
            ))}

            {isResponding ? (
              <div className={styles.messageRow} aria-label="Assistant is typing">
                <div className={styles.messageContent}>
                  <span className={styles.srOnly}>Oduzz AI</span>
                  <div
                    className={cn(
                      styles.messageBubble,
                      styles.messageBubbleAssistant,
                      styles.messageBubbleTyping,
                    )}
                    aria-hidden="true"
                  >
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </div>
            ) : null}

            {assistantStatus ? (
              <p className={styles.chatNotice} role="status">
                {assistantStatus}
              </p>
            ) : null}

            {completion ? (
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
                  {completion.summary.rows.map((row) => (
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

                <p className={styles.summaryNext}>{completion.summary.nextStep}</p>

                <div className={styles.summaryActions}>
                  <Link className={cn("btn", "primary", styles.summaryActionPrimary)} href={completionQuoteLink}>
                    Request Full Quote
                  </Link>
                  <a
                    className={cn("btn", "outline", styles.summaryActionSecondary)}
                    href={completion.summary.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Continue on WhatsApp
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.composerDock}>
            <div className={styles.quickChipRow} aria-label="Assistant services">
              {FLOW_CHOICES.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  className={cn(styles.quickChip, activeFlowId === flow.id && styles.quickChipActive)}
                  onClick={() => onQuickAction(flow.id)}
                  disabled={isBusy}
                >
                  {flow.chipLabel}
                </button>
              ))}
            </div>

            {activeFlowId === "quote" ? (
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
                  href={createConsultationWhatsAppUrl(completion.flowId, completion.summary.whatsappText)}
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
                    activeFlow
                      ? "Type your reply here..."
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
