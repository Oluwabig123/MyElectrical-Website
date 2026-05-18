"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { buildWhatsAppUrl } from "@/data/contact";
import { oduzzAssistantDoc } from "@/data/oduzz-assistant-doc";
import {
  buildFallbackAssistantReply,
  buildSolarRecommendation,
  clampMessage,
  INITIAL_ASSISTANT_MESSAGE,
  MAX_INPUT_CHARS,
  MAX_MESSAGES,
  normalize,
  shouldStartQuoteFlow,
  shouldStartSolarSizingFlow,
  toNumber,
} from "@/lib/assistant-core";
import {
  BUDGET_OPTIONS,
  INITIAL_QUOTE_FORM,
  SERVICE_OPTIONS,
  URGENCY_OPTIONS,
  buildQuotePrefillSearch,
  buildQuoteSummary,
  buildQuoteWhatsAppMessage,
  createQuoteReference,
  isValidPhone,
  matchQuoteBudget,
  matchQuoteService,
  matchQuoteUrgency,
  sanitizePhoneInput,
} from "@/lib/quote-request";
import {
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  canUploadQuoteImages,
  saveQuoteLead,
  uploadQuoteLeadImages,
} from "@/lib/quote-lead-storage";
import styles from "./AssistantClient.module.css";

const QUICK_STARTS = [
  { label: "Start quote", prompt: "Start quote intake" },
  { label: "Size my solar", prompt: "Size my solar system" },
  { label: "Lighting help", prompt: "Lighting quote checklist" },
  { label: "Wiring safety", prompt: "Explain wiring safety steps" },
] as const;

const QUOTE_STAGE_ORDER = [
  "quote-service",
  "quote-location",
  "quote-details",
  "quote-urgency",
  "quote-budget",
  "quote-name",
  "quote-phone",
] as const;

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
};

type Stage =
  | "idle"
  | "solar-loads"
  | "solar-location"
  | "solar-backup"
  | (typeof QUOTE_STAGE_ORDER)[number];

type SolarDraft = {
  loadsWatts: number | null;
  location: string;
  backupHours: number | null;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

async function requestAssistantReply(messages: AssistantMessage[]) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messages.slice(-10),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Assistant request failed.");
  }

  return String(payload.text || "").trim();
}

export default function AssistantClient() {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [draft, setDraft] = useState<SolarDraft>({
    loadsWatts: null,
    location: "",
    backupHours: null,
  });
  const [quoteDraft, setQuoteDraft] = useState({
    ...INITIAL_QUOTE_FORM,
    imageUrls: [] as string[],
  });
  const [quoteResult, setQuoteResult] = useState<typeof INITIAL_QUOTE_FORM | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [isUploadingQuoteImage, setIsUploadingQuoteImage] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const isQuoteFlow = stage.startsWith("quote-");
  const quoteStageIndex = isQuoteFlow
    ? QUOTE_STAGE_ORDER.findIndex((item) => item === stage) + 1
    : 0;
  const quotePrefillSearch = useMemo(
    () => (quoteResult ? buildQuotePrefillSearch(quoteResult, { source: "assistant" }) : ""),
    [quoteResult],
  );
  const quoteWhatsAppUrl = useMemo(() => {
    if (!quoteResult) return "";
    return buildWhatsAppUrl(
      encodeURIComponent(buildQuoteWhatsAppMessage(quoteResult, { source: "assistant" })),
    );
  }, [quoteResult]);
  const quoteFlowOptions = useMemo(() => {
    if (stage === "quote-service") return SERVICE_OPTIONS;
    if (stage === "quote-urgency") return URGENCY_OPTIONS;
    if (stage === "quote-budget") return BUDGET_OPTIONS;
    return [];
  }, [stage]);
  const headerStatus = useMemo(() => {
    if (isResponding) return "Replying";
    if (stage.startsWith("solar-")) return "Solar sizing";
    if (stage.startsWith("quote-")) return `Quote ${quoteStageIndex}/${QUOTE_STAGE_ORDER.length}`;
    return "";
  }, [isResponding, quoteStageIndex, stage]);
  const showWelcomePrompts = messages.length === 1 && messages[0]?.role === "assistant" && !isQuoteFlow && !quoteResult;
  const showCharacterCount = input.length >= MAX_INPUT_CHARS - 80;
  const activeQuoteData = isQuoteFlow ? quoteDraft : quoteResult;
  const activeQuoteChips = [
    activeQuoteData?.service ? `Service: ${activeQuoteData.service}` : "",
    activeQuoteData?.location ? `Location: ${activeQuoteData.location}` : "",
    activeQuoteData?.urgency ? `Urgency: ${activeQuoteData.urgency}` : "",
    activeQuoteData?.budget ? `Budget: ${activeQuoteData.budget}` : "",
    `Photos: ${Array.isArray(activeQuoteData?.imageUrls) ? activeQuoteData?.imageUrls.length : 0}/${MAX_QUOTE_IMAGE_COUNT}`,
  ].filter(Boolean);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages, isResponding]);

  function addAssistant(text: string) {
    const safeText = clampMessage(text);
    const nextMessage: AssistantMessage = { role: "assistant", text: safeText };
    setMessages((prev) => [...prev, nextMessage].slice(-MAX_MESSAGES));
  }

  function resetQuoteDraft() {
    setQuoteDraft({ ...INITIAL_QUOTE_FORM, imageUrls: [] });
  }

  function startQuoteFlow(raw = "") {
    const inferredService = matchQuoteService(raw);
    const referenceId = createQuoteReference();
    setAssistantStatus("");
    setQuoteResult(null);
    setQuoteDraft({
      ...INITIAL_QUOTE_FORM,
      imageUrls: [],
      referenceId,
      service: inferredService || "",
    });

    if (inferredService) {
      setStage("quote-location");
      addAssistant(
        `I can prepare a quote brief for ${inferredService}. What location is this project in?`,
      );
      return;
    }

    setStage("quote-service");
    addAssistant(
      [
        "I can turn this into a quote-ready brief.",
        "First, what service do you need?",
        SERVICE_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n"),
      ].join("\n"),
    );
  }

  async function finishQuoteFlow(
    finalDraft: typeof INITIAL_QUOTE_FORM,
    history: AssistantMessage[],
  ) {
    const completedDraft = {
      ...finalDraft,
      referenceId: finalDraft.referenceId || createQuoteReference(),
      imageUrls: Array.isArray(finalDraft.imageUrls) ? finalDraft.imageUrls : [],
    };

    setQuoteResult(completedDraft);
    setStage("idle");
    setQuoteDraft({ ...INITIAL_QUOTE_FORM, imageUrls: [] });
    setAssistantStatus("Quote intake ready. Saving the lead record...");
    addAssistant(
      [
        buildQuoteSummary(completedDraft),
        "",
        "Next step: open the quote form for review or send this summary straight to WhatsApp.",
      ].join("\n"),
    );

    const { saved } = await saveQuoteLead({
      form: completedDraft,
      source: "assistant",
      channel: "assistant-chat",
      summary: buildQuoteSummary(completedDraft),
      conversation: Array.isArray(history) ? history.slice(-12) : [],
    });

    setAssistantStatus(
      saved
        ? "Quote intake saved and ready for handoff."
        : "Quote intake ready. Lead storage is unavailable, but handoff still works.",
    );
  }

  async function handleQuoteImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (!isQuoteFlow) {
      setAssistantStatus("Start a quote intake first if you want to attach project photos.");
      return;
    }

    if (!canUploadQuoteImages()) {
      setAssistantStatus(
        "Image uploads need Supabase configuration. To keep costs down, images are stored only for human review.",
      );
      return;
    }

    const existingCount = Array.isArray(quoteDraft.imageUrls) ? quoteDraft.imageUrls.length : 0;
    const remainingSlots = MAX_QUOTE_IMAGE_COUNT - existingCount;

    if (remainingSlots <= 0) {
      setAssistantStatus(`You already added the maximum of ${MAX_QUOTE_IMAGE_COUNT} images.`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    setIsUploadingQuoteImage(true);
    setAssistantStatus("");

    const referenceId = quoteDraft.referenceId || createQuoteReference();
    const { imageUrls, error } = await uploadQuoteLeadImages({
      files: selectedFiles,
      referenceId,
    });

    setIsUploadingQuoteImage(false);

    if (error) {
      setAssistantStatus(error);
      return;
    }

    setQuoteDraft((current) => ({
      ...current,
      referenceId,
      imageUrls: [...(current.imageUrls || []), ...imageUrls].slice(0, MAX_QUOTE_IMAGE_COUNT),
    }));
    setAssistantStatus(
      `${imageUrls.length} image(s) uploaded. They will be included in the saved lead and handoff summary.`,
    );
  }

  async function handleGeneralIntent(history: AssistantMessage[], raw: string) {
    if (/cancel|stop|start over|reset|exit/.test(normalize(raw))) {
      setAssistantStatus("");
      addAssistant("No guided flow is active right now. Ask a question or start a quote intake.");
      return;
    }

    if (shouldStartQuoteFlow(raw)) {
      startQuoteFlow(raw);
      return;
    }

    if (shouldStartSolarSizingFlow(raw)) {
      setStage("solar-loads");
      setAssistantStatus("");
      setQuoteResult(null);
      addAssistant("Share your total load in watts, for example 1800W.");
      return;
    }

    setIsResponding(true);
    setAssistantStatus("");

    try {
      const reply = await requestAssistantReply(history);
      addAssistant(reply || buildFallbackAssistantReply(raw));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI reply was unavailable.";
      addAssistant(buildFallbackAssistantReply(raw));
      setAssistantStatus(
        /configured/i.test(String(message || ""))
          ? "AI reply is not configured yet, so the assistant used local guidance."
          : "AI reply was unavailable, so the assistant used local guidance.",
      );
    } finally {
      setIsResponding(false);
    }
  }

  function handleSolarFlow(raw: string) {
    const command = normalize(raw);
    if (/cancel|stop|start over|reset|exit/.test(command)) {
      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      setAssistantStatus("");
      addAssistant("Solar sizing flow cancelled. Ask another question anytime.");
      return;
    }

    if (stage === "solar-loads") {
      const watts = toNumber(raw);
      if (!Number.isFinite(watts) || watts <= 0) {
        addAssistant("Enter a valid load in watts, for example 1200W or 2500.");
        return;
      }
      setDraft((current) => ({ ...current, loadsWatts: watts }));
      setStage("solar-location");
      addAssistant("Great. What is your location? Example: Ikorodu, Lagos.");
      return;
    }

    if (stage === "solar-location") {
      const location = String(raw || "").trim();
      if (!location) {
        addAssistant("Please provide a location.");
        return;
      }
      setDraft((current) => ({ ...current, location }));
      setStage("solar-backup");
      addAssistant("How many backup hours do you need?");
      return;
    }

    if (stage === "solar-backup") {
      const backupHours = toNumber(raw);
      if (!Number.isFinite(backupHours) || backupHours <= 0) {
        addAssistant("Enter backup time in hours, for example 6 or 8.");
        return;
      }

      const payload = {
        loadsWatts: draft.loadsWatts || 0,
        location: draft.location,
        backupHours,
      };
      const recommendation = buildSolarRecommendation(payload);

      addAssistant(
        [
          "Preliminary sizing:",
          `Load: ${payload.loadsWatts}W`,
          `Location: ${payload.location} (sun hours used: ${recommendation.sunHours})`,
          `Backup: ${backupHours}h`,
          `Recommended inverter: ${recommendation.inverterKVA} kVA`,
          `Recommended solar array: ${recommendation.solarWp} Wp`,
          `Estimated battery bank: ${recommendation.batteryKWh} kWh (~${recommendation.batteryAhAt48V}Ah @48V)`,
          oduzzAssistantDoc.policy.note,
        ].join("\n"),
      );

      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      addAssistant("Ask another sizing question or request a quote summary.");
    }
  }

  async function handleQuoteFlow(raw: string, history: AssistantMessage[]) {
    const command = normalize(raw);
    if (/cancel|stop|start over|reset|exit/.test(command)) {
      setStage("idle");
      resetQuoteDraft();
      setAssistantStatus("");
      addAssistant("Quote intake cancelled. Ask another question anytime.");
      return;
    }

    if (stage === "quote-service") {
      const service = matchQuoteService(raw);
      if (!service) {
        addAssistant("Choose a service from the suggestions, or type the closest match.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, service }));
      setStage("quote-location");
      addAssistant(`Noted. What location is this ${service.toLowerCase()} project in?`);
      return;
    }

    if (stage === "quote-location") {
      const location = String(raw || "").trim();
      if (!location) {
        addAssistant("Please share the project location.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, location }));
      setStage("quote-details");
      addAssistant(
        "Briefly describe the job scope. Include the property type, current setup, or what needs to be installed or fixed.",
      );
      return;
    }

    if (stage === "quote-details") {
      const details = String(raw || "").trim();
      if (details.length < 8) {
        addAssistant("Add a bit more detail so the quote brief is actually useful.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, details }));
      setStage("quote-urgency");
      addAssistant(
        [
          "How urgent is this request?",
          URGENCY_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n"),
        ].join("\n"),
      );
      return;
    }

    if (stage === "quote-urgency") {
      const urgency = matchQuoteUrgency(raw);
      if (!urgency) {
        addAssistant("Choose an urgency option from the suggestions, or type the closest match.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, urgency }));
      setStage("quote-budget");
      addAssistant(
        [
          "What budget direction best fits this project?",
          BUDGET_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n"),
        ].join("\n"),
      );
      return;
    }

    if (stage === "quote-budget") {
      const budget = matchQuoteBudget(raw);
      if (!budget) {
        addAssistant("Choose a budget direction from the suggestions, or type the closest match.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, budget }));
      setStage("quote-name");
      addAssistant("Who should Oduzz address this quote to?");
      return;
    }

    if (stage === "quote-name") {
      const name = String(raw || "").trim();
      if (name.length < 2) {
        addAssistant("Please share the contact name for this quote.");
        return;
      }
      setQuoteDraft((current) => ({ ...current, name }));
      setStage("quote-phone");
      addAssistant("Finally, what phone number should Oduzz use for follow-up?");
      return;
    }

    if (stage === "quote-phone") {
      const phone = sanitizePhoneInput(raw);
      if (!isValidPhone(phone)) {
        addAssistant("Enter a valid phone number with 10 to 15 digits.");
        return;
      }

      const finalDraft = {
        ...quoteDraft,
        phone,
      };

      await finishQuoteFlow(finalDraft, history);
    }
  }

  function onSend() {
    const raw = input.trim().slice(0, MAX_INPUT_CHARS);
    if (!raw || isResponding) return;
    void sendMessage(raw);
    setInput("");
  }

  async function sendMessage(raw: string) {
    const safeRaw = String(raw || "").trim().slice(0, MAX_INPUT_CHARS);
    if (!safeRaw) return;

    const userMessage: AssistantMessage = { role: "user", text: clampMessage(safeRaw) };
    const nextHistory = [...messages, userMessage].slice(-MAX_MESSAGES);

    setMessages(nextHistory);

    if (stage.startsWith("solar-")) {
      handleSolarFlow(safeRaw);
      return;
    }

    if (stage.startsWith("quote-")) {
      await handleQuoteFlow(safeRaw, nextHistory);
      return;
    }

    await handleGeneralIntent(nextHistory, safeRaw);
  }

  function onQuickPrompt(prompt: string) {
    if (isResponding) return;
    setInput("");
    void sendMessage(prompt);
  }

  function onReset() {
    if (isResponding) return;
    setStage("idle");
    setDraft({ loadsWatts: null, location: "", backupHours: null });
    resetQuoteDraft();
    setQuoteResult(null);
    setInput("");
    setAssistantStatus("");
    setMessages([{ role: "assistant", text: INITIAL_ASSISTANT_MESSAGE }]);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
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
                <span>Electrical planning assistant</span>
              </div>
            </div>

            <div className={styles.chatHeaderActions}>
              {headerStatus ? <span className={styles.chatState}>{headerStatus}</span> : null}
              <button
                type="button"
                className={styles.chatClearBtn}
                onClick={onReset}
                disabled={isResponding}
              >
                Clear
              </button>
            </div>
          </header>

          <div
            className={styles.chatThread}
            ref={bodyRef}
            role="log"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(styles.messageRow, message.role === "user" && styles.messageRowUser)}
              >
                <div
                  className={cn(
                    styles.messageAvatar,
                    message.role === "user" ? styles.messageAvatarUser : styles.messageAvatarAssistant,
                  )}
                  aria-hidden="true"
                >
                  {message.role === "user" ? "You" : "AI"}
                </div>

                <div
                  className={cn(
                    styles.messageContent,
                    message.role === "user" && styles.messageContentUser,
                  )}
                >
                  <div
                    className={cn(
                      styles.messageBubble,
                      message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant,
                    )}
                  >
                    <p className={styles.messageText}>{message.text}</p>
                  </div>

                  {showWelcomePrompts && index === 0 ? (
                    <div className={styles.quickChipRow}>
                      {QUICK_STARTS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.quickChip}
                          onClick={() => onQuickPrompt(item.prompt)}
                          disabled={isResponding}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isResponding ? (
              <div className={styles.messageRow} aria-label="Assistant is typing">
                <div className={cn(styles.messageAvatar, styles.messageAvatarAssistant)} aria-hidden="true">
                  AI
                </div>
                <div className={styles.messageContent}>
                  <div className={cn(styles.messageBubble, styles.messageBubbleAssistant, styles.messageTyping)}>
                    Oduzz is thinking...
                  </div>
                </div>
              </div>
            ) : null}

            {assistantStatus ? <p className={styles.chatNotice}>{assistantStatus}</p> : null}

            {isQuoteFlow ? (
              <div className={styles.inlineCard}>
                <div className={styles.inlineCardHead}>
                  <div>
                    <p className={styles.inlineCardLabel}>Quote flow</p>
                    <h3 className={styles.inlineCardTitle}>
                      Step {quoteStageIndex} of {QUOTE_STAGE_ORDER.length}
                    </h3>
                  </div>
                </div>
                <div className={styles.inlineChipRow}>
                  {activeQuoteChips.map((chip) => (
                    <span key={chip} className={styles.inlineChip}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {quoteResult ? (
              <div className={styles.inlineCard}>
                <div className={styles.inlineCardHead}>
                  <div>
                    <p className={styles.inlineCardLabel}>Quote ready</p>
                    <h3 className={styles.inlineCardTitle}>Ready for a formal quote?</h3>
                  </div>
                  <span className={styles.inlineCardMeta}>{quoteResult.referenceId}</span>
                </div>
                <pre className={styles.quoteSummary}>{buildQuoteSummary(quoteResult)}</pre>
                <div className={styles.inlineActions}>
                  <Link className={cn("btn", "primary", styles.inlineActionPrimary)} href={`/quote${quotePrefillSearch}`}>
                    Open quote form
                  </Link>
                  <a
                    className={cn("btn", "outline", styles.inlineActionSecondary)}
                    href={quoteWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp Oduzz
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.composerDock}>
            {isQuoteFlow ? (
              <div className={styles.uploadRow}>
                <div className={styles.uploadCopy}>
                  <span className={styles.uploadLabel}>Project photos</span>
                  <p className={styles.uploadText}>
                    Optional. Up to {MAX_QUOTE_IMAGE_COUNT} images, {Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB each.
                  </p>
                </div>
                <label className={cn("assistantUploadButton", styles.uploadButton)}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleQuoteImageChange}
                    disabled={isUploadingQuoteImage || isResponding}
                  />
                  {isUploadingQuoteImage ? "Uploading..." : "Add photos"}
                </label>
              </div>
            ) : null}

            {quoteFlowOptions.length ? (
              <div className={styles.quickChipRow} aria-label="Current assistant suggestions">
                {quoteFlowOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.quickChip}
                    onClick={() => onQuickPrompt(option)}
                    disabled={isResponding}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            <div className={styles.composerRow}>
              <div className={styles.inputShell}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_CHARS))}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about solar sizing, wiring, lighting, or quotes..."
                  rows={1}
                  maxLength={MAX_INPUT_CHARS}
                  aria-label="Ask Oduzz a question"
                  disabled={isResponding}
                />
              </div>
              <button
                type="button"
                className={cn("btn", "primary", styles.sendBtn)}
                onClick={onSend}
                disabled={isResponding}
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
