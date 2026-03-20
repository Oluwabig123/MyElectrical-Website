import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import { buildWhatsAppUrl, CONTACT, CONTACT_LINKS } from "../data/contact.js";
import { oduzzAssistantDoc } from "../data/oduzzAssistantDoc";
import {
  buildFallbackAssistantReply,
  buildSolarRecommendation,
  clampMessage,
  INITIAL_ASSISTANT_MESSAGE,
  isQuoteQuestion,
  isSolarQuestion,
  MAX_INPUT_CHARS,
  MAX_MESSAGES,
  normalize,
  toNumber,
} from "../lib/assistantCore.js";
import {
  BUDGET_OPTIONS,
  createQuoteReference,
  buildQuotePrefillSearch,
  buildQuoteSummary,
  buildQuoteWhatsAppMessage,
  INITIAL_QUOTE_FORM,
  isValidPhone,
  matchQuoteBudget,
  matchQuoteService,
  matchQuoteUrgency,
  sanitizePhoneInput,
  SERVICE_OPTIONS,
  URGENCY_OPTIONS,
} from "../lib/quoteRequest.js";
import {
  canUploadQuoteImages,
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  saveQuoteLead,
  uploadQuoteLeadImages,
} from "../lib/quoteLeadStorage.js";

const QUICK_PROMPTS = [
  "Start quote intake",
  "Size my solar system",
  "Cancel current flow",
  "Explain wiring safety steps",
  "Lighting quote checklist",
  "What details do you need for a quote?",
];

const ASSISTANT_CAPABILITIES = [
  {
    title: "Solar planning",
    text: "Start with a quick load estimate, battery reserve, and a practical next step before site inspection.",
  },
  {
    title: "Electrical guidance",
    text: "Use it for wiring safety, fault questions, cable direction, and cleaner project scoping.",
  },
  {
    title: "Quote readiness",
    text: "Prepare the exact details Oduzz needs so pricing discussions start from a clearer brief.",
  },
];

const ASSISTANT_SIGNALS = [
  "Structured reply style",
  "Fast sizing workflow",
  "Quote-ready handoff",
];

const QUOTE_STAGE_ORDER = [
  "quote-service",
  "quote-location",
  "quote-details",
  "quote-urgency",
  "quote-budget",
  "quote-name",
  "quote-phone",
];

async function requestAssistantReply(messages) {
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

export default function Assistant() {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");
  const [draft, setDraft] = useState({ loadsWatts: null, location: "", backupHours: null });
  const [quoteDraft, setQuoteDraft] = useState(() => ({ ...INITIAL_QUOTE_FORM, imageUrls: [] }));
  const [quoteResult, setQuoteResult] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [isUploadingQuoteImage, setIsUploadingQuoteImage] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");
  const bodyRef = useRef(null);

  const headerMeta = useMemo(
    () => `${oduzzAssistantDoc.company} Doc v${oduzzAssistantDoc.version}`,
    []
  );
  const lastUpdatedLabel = useMemo(
    () =>
      new Date(oduzzAssistantDoc.lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );
  const isQuoteFlow = stage.startsWith("quote-");
  const quoteStageIndex = isQuoteFlow ? QUOTE_STAGE_ORDER.indexOf(stage) + 1 : 0;
  const quotePrefillSearch = useMemo(
    () => (quoteResult ? buildQuotePrefillSearch(quoteResult) : ""),
    [quoteResult]
  );
  const quoteWhatsAppUrl = useMemo(() => {
    if (!quoteResult) return "";
    return buildWhatsAppUrl(
      encodeURIComponent(buildQuoteWhatsAppMessage(quoteResult, { source: "assistant" }))
    );
  }, [quoteResult]);
  const quoteFlowOptions = useMemo(() => {
    if (stage === "quote-service") return SERVICE_OPTIONS;
    if (stage === "quote-urgency") return URGENCY_OPTIONS;
    if (stage === "quote-budget") return BUDGET_OPTIONS;
    return [];
  }, [stage]);

  const stageLabel = useMemo(() => {
    if (stage === "solar-loads") return "Solar sizing: load";
    if (stage === "solar-location") return "Solar sizing: location";
    if (stage === "solar-backup") return "Solar sizing: backup";
    if (stage === "quote-service") return "Quote intake: service";
    if (stage === "quote-location") return "Quote intake: location";
    if (stage === "quote-details") return "Quote intake: project brief";
    if (stage === "quote-urgency") return "Quote intake: urgency";
    if (stage === "quote-budget") return "Quote intake: budget";
    if (stage === "quote-name") return "Quote intake: contact name";
    if (stage === "quote-phone") return "Quote intake: phone";
    if (isResponding) return "AI assistant: replying";
    return "General assistant";
  }, [isResponding, stage]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages, isResponding]);

  function addAssistant(text) {
    const safeText = clampMessage(text);
    setMessages((prev) => [...prev, { role: "assistant", text: safeText }].slice(-MAX_MESSAGES));
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
        `I can prepare a quote brief for ${inferredService}. What location is this project in?`
      );
      return;
    }

    setStage("quote-service");
    addAssistant(
      [
        "I can turn this into a quote-ready brief.",
        "First, what service do you need?",
        SERVICE_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n"),
      ].join("\n")
    );
  }

  async function finishQuoteFlow(finalDraft, history) {
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
      ].join("\n")
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
        : "Quote intake ready. Lead storage is unavailable, but handoff still works."
    );
  }

  async function handleQuoteImageChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (!isQuoteFlow) {
      setAssistantStatus("Start a quote intake first if you want to attach project photos.");
      return;
    }

    if (!canUploadQuoteImages()) {
      setAssistantStatus(
        "Image uploads need Supabase configuration. To keep costs down, images are stored only for human review."
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
      `${imageUrls.length} image(s) uploaded. They will be included in the saved lead and handoff summary.`
    );
  }

  async function handleGeneralIntent(history, raw) {
    if (/cancel|stop|start over|reset|exit/.test(normalize(raw))) {
      setAssistantStatus("");
      addAssistant("No guided flow is active right now. Ask a question or start a quote intake.");
      return;
    }

    if (isQuoteQuestion(raw)) {
      startQuoteFlow(raw);
      return;
    }

    if (isSolarQuestion(raw)) {
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
      addAssistant(buildFallbackAssistantReply(raw));
      setAssistantStatus(
        /configured/i.test(String(error.message || ""))
          ? "AI reply is not configured yet, so the assistant used local guidance."
          : "AI reply was unavailable, so the assistant used local guidance."
      );
    } finally {
      setIsResponding(false);
    }
  }

  function handleSolarFlow(raw) {
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
        loadsWatts: draft.loadsWatts,
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
        ].join("\n")
      );

      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      addAssistant("Ask another sizing question or request a quote summary.");
    }
  }

  async function handleQuoteFlow(raw, history) {
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
        "Briefly describe the job scope. Include the property type, current setup, or what needs to be installed or fixed."
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
        ].join("\n")
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
        ].join("\n")
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

  async function sendMessage(raw) {
    const safeRaw = String(raw || "").trim().slice(0, MAX_INPUT_CHARS);
    if (!safeRaw) return;

    const userMessage = { role: "user", text: clampMessage(safeRaw) };
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

  function onQuickPrompt(prompt) {
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

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <section className="section assistantPage">
      <Container>
        <SectionHeader
          kicker="Assistant"
          title="A more polished way to plan electrical work"
          subtitle="Ask about solar sizing, wiring, lighting, and quote preparation in one guided workspace."
        />

        <div className="assistantLayout">
          <aside className="card assistantGuide">
            <div className="assistantGuideHero">
              <span className="assistantGuideEyebrow">Concierge mode</span>
              <h3 className="assistantGuideTitle">Built for cleaner project conversations</h3>
              <p className="assistantGuideLead">
                Use the assistant for early planning, then move into a proper quote with the same
                context in mind.
              </p>
            </div>

            <div className="assistantSignalRow" aria-label="Assistant highlights">
              {ASSISTANT_SIGNALS.map((signal) => (
                <span key={signal} className="assistantSignalChip">
                  {signal}
                </span>
              ))}
            </div>

            <div className="assistantCapabilityList">
              {ASSISTANT_CAPABILITIES.map((item, index) => (
                <div key={item.title} className="assistantCapabilityCard">
                  <span className="assistantCapabilityIndex">0{index + 1}</span>
                  <div>
                    <h4 className="assistantCapabilityTitle">{item.title}</h4>
                    <p className="assistantCapabilityText">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {isQuoteFlow || quoteResult ? (
              <div className="assistantQuoteTracker">
                <div className="assistantQuoteTrackerHead">
                  <div>
                    <p className="assistantQuoteTrackerLabel">Guided quote intake</p>
                    <h4 className="assistantQuoteTrackerTitle">
                      {isQuoteFlow
                        ? `Step ${quoteStageIndex} of ${QUOTE_STAGE_ORDER.length}`
                        : "Quote brief ready"}
                    </h4>
                  </div>
                  <span className="assistantQuoteTrackerState">
                    {isQuoteFlow ? "In progress" : "Ready"}
                  </span>
                </div>
                <div className="assistantQuoteTrackerGrid">
                  <span>{(isQuoteFlow ? quoteDraft : quoteResult)?.service || "Service pending"}</span>
                  <span>{(isQuoteFlow ? quoteDraft : quoteResult)?.location || "Location pending"}</span>
                  <span>{(isQuoteFlow ? quoteDraft : quoteResult)?.urgency || "Urgency pending"}</span>
                  <span>{(isQuoteFlow ? quoteDraft : quoteResult)?.budget || "Budget pending"}</span>
                  <span>
                    Photos: {Array.isArray((isQuoteFlow ? quoteDraft : quoteResult)?.imageUrls)
                      ? (isQuoteFlow ? quoteDraft : quoteResult).imageUrls.length
                      : 0}
                    /{MAX_QUOTE_IMAGE_COUNT}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="assistantGuideBlock">
              <div className="assistantGuideBlockHead">
                <h4 className="assistantGuideBlockTitle">Quick prompts</h4>
                <span className="assistantGuideBlockMeta">Tap to start faster</span>
              </div>
              <div className="assistantQuickList">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="assistantQuickBtn"
                    onClick={() => onQuickPrompt(prompt)}
                    disabled={isResponding}
                  >
                    <span>{prompt}</span>
                    <span className="assistantQuickArrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="assistantGuidePanel">
              <div className="assistantGuidePanelTop">
                <div>
                  <p className="assistantGuidePanelLabel">Project handoff</p>
                  <p className="assistantGuideText">
                    Need detailed pricing or site coordination? Move into the structured quote
                    flow or WhatsApp.
                  </p>
                </div>
                <span className="assistantGuideResponse">{CONTACT.whatsappResponseTime}</span>
              </div>
              <div className="assistantGuideActions">
                <Link className="assistantGuideAction assistantGuideActionPrimary" to="/quote">
                  Open quote form
                </Link>
                <a
                  className="assistantGuideAction"
                  href={CONTACT_LINKS.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp Oduzz
                </a>
              </div>
            </div>

            <div className="assistantGuideFoot">
              <p className="assistantGuideFootText">
                Knowledge source updated {lastUpdatedLabel}. Recommendations remain preliminary
                until site inspection.
              </p>
            </div>
          </aside>

          <div className="oduzzAssistantPanel assistantPagePanel">
            <div className="oduzzAssistantHead">
              <div className="assistantHeadMeta">
                <span className="assistantHeadKicker">Oduzz Assistant</span>
                <strong>Project planning, with a sharper front desk feel</strong>
                <span>{headerMeta}</span>
              </div>
              <div className="assistantHeadActions">
                <span className="assistantStage">{stageLabel}</span>
                <Button type="button" variant="outline" className="assistantClearBtn" onClick={onReset}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="oduzzAssistantBody assistantPageBody" ref={bodyRef} role="log" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`assistantMessageRow ${message.role === "user" ? "user" : "assistant"}`}
                >
                  <div className="assistantMessageBadge" aria-hidden="true">
                    {message.role === "user" ? "You" : "OE"}
                  </div>
                  <div className="assistantMessageStack">
                    <div className="assistantMessageMeta">
                      <strong>{message.role === "user" ? "You" : "Oduzz Assistant"}</strong>
                      <span>
                        {message.role === "user" ? "Request received" : "Guided response"}
                      </span>
                    </div>
                    <div className={`oduzzMsg ${message.role === "user" ? "user" : "assistant"}`}>
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              {isResponding ? (
                <div className="assistantMessageRow assistant" aria-label="Assistant is typing">
                  <div className="assistantMessageBadge" aria-hidden="true">
                    OE
                  </div>
                  <div className="assistantMessageStack">
                    <div className="assistantMessageMeta">
                      <strong>Oduzz Assistant</strong>
                      <span>Preparing reply</span>
                    </div>
                    <div className="oduzzMsg assistant assistantTyping">Oduzz is thinking...</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="oduzzAssistantComposer assistantPageComposer">
              {isQuoteFlow ? (
                <div className="assistantUploadPanel">
                  <div>
                    <p className="assistantUploadLabel">Optional project photos</p>
                    <p className="assistantUploadHint">
                      Upload up to {MAX_QUOTE_IMAGE_COUNT} images, {Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB each.
                      They are stored for human review only.
                    </p>
                  </div>
                  <label className="assistantUploadButton">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleQuoteImageChange}
                      disabled={isUploadingQuoteImage || isResponding}
                    />
                    {isUploadingQuoteImage ? "Uploading..." : "Add images"}
                  </label>
                </div>
              ) : null}

              {quoteFlowOptions.length ? (
                <div className="assistantFlowOptions" aria-label="Current assistant suggestions">
                  {quoteFlowOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="assistantFlowOption"
                      onClick={() => onQuickPrompt(option)}
                      disabled={isResponding}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="assistantComposerRow">
                <div className="assistantInputShell">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_CHARS))}
                    onKeyDown={onKeyDown}
                    placeholder="Ask Oduzz about solar sizing, wiring, lighting..."
                    rows={3}
                    maxLength={MAX_INPUT_CHARS}
                    aria-label="Ask Oduzz a question"
                    disabled={isResponding}
                  />
                </div>
                <button
                  type="button"
                  className="btn primary assistantSendBtn"
                  onClick={onSend}
                  disabled={isResponding}
                >
                  {isResponding ? "Replying..." : "Send"}
                </button>
              </div>
              <div className="assistantComposerMeta">
                <p className="assistantHint">Press Enter to send. Use Shift+Enter for a new line.</p>
                <p className="assistantHint assistantHintCount">
                  {input.length}/{MAX_INPUT_CHARS} characters
                </p>
              </div>
              {assistantStatus ? <p className="assistantStatus">{assistantStatus}</p> : null}
              {quoteResult ? (
                <div className="assistantQuoteResult">
                  <div className="assistantQuoteResultHead">
                    <div>
                      <p className="assistantQuoteResultLabel">Qualified lead package</p>
                      <h4 className="assistantQuoteResultTitle">Send this quote brief into the next step</h4>
                    </div>
                    <span className="assistantQuoteResultMeta">{quoteResult.referenceId}</span>
                  </div>
                  <pre className="assistantQuoteResultSummary">{buildQuoteSummary(quoteResult)}</pre>
                  <div className="assistantQuoteResultActions">
                    <Link className="assistantGuideAction assistantGuideActionPrimary" to={`/quote${quotePrefillSearch}`}>
                      Review in quote form
                    </Link>
                    <a
                      className="assistantGuideAction"
                      href={quoteWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Send to WhatsApp
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
