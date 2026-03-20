import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import { oduzzAssistantDoc } from "../data/oduzzAssistantDoc";
import {
  buildFallbackAssistantReply,
  buildSolarRecommendation,
  clampMessage,
  INITIAL_ASSISTANT_MESSAGE,
  isSolarQuestion,
  MAX_INPUT_CHARS,
  MAX_MESSAGES,
  normalize,
  toNumber,
} from "../lib/assistantCore.js";

const QUICK_PROMPTS = [
  "Size my solar system",
  "Cancel current flow",
  "Explain wiring safety steps",
  "Lighting quote checklist",
  "What details do you need for a quote?",
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
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("");
  const bodyRef = useRef(null);

  const headerMeta = useMemo(
    () => `${oduzzAssistantDoc.company} Doc v${oduzzAssistantDoc.version}`,
    []
  );

  const stageLabel = useMemo(() => {
    if (stage === "solar-loads") return "Solar sizing: load";
    if (stage === "solar-location") return "Solar sizing: location";
    if (stage === "solar-backup") return "Solar sizing: backup";
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

  async function handleGeneralIntent(history, raw) {
    if (isSolarQuestion(raw)) {
      setStage("solar-loads");
      setAssistantStatus("");
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
          title="Oduzz Assistant Chat"
          subtitle="Ask about solar sizing, wiring, lighting, and quote preparation."
        />

        <div className="assistantLayout">
          <aside className="card assistantGuide">
            <h3 className="assistantGuideTitle">Quick prompts</h3>
            <div className="assistantQuickList">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="assistantQuickBtn"
                  onClick={() => onQuickPrompt(prompt)}
                  disabled={isResponding}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="assistantGuidePanel">
              <p className="assistantGuideText">
                Need detailed project pricing?
                <Link className="assistantGuideLink" to="/quote"> Open the quote form.</Link>
              </p>
            </div>
          </aside>

          <div className="oduzzAssistantPanel assistantPagePanel">
            <div className="oduzzAssistantHead">
              <div className="assistantHeadMeta">
                <strong>Oduzz</strong>
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
                  className={`oduzzMsg ${message.role === "user" ? "user" : "assistant"}`}
                >
                  {message.text}
                </div>
              ))}
              {isResponding ? (
                <div className="oduzzMsg assistant assistantTyping" aria-label="Assistant is typing">
                  Oduzz is thinking...
                </div>
              ) : null}
            </div>

            <div className="oduzzAssistantComposer assistantPageComposer">
              <div className="assistantComposerRow">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_CHARS))}
                  onKeyDown={onKeyDown}
                  placeholder="Ask Oduzz about solar sizing, wiring, lighting..."
                  rows={2}
                  maxLength={MAX_INPUT_CHARS}
                  aria-label="Ask Oduzz a question"
                  disabled={isResponding}
                />
                <button type="button" className="btn primary" onClick={onSend} disabled={isResponding}>
                  {isResponding ? "Replying..." : "Send"}
                </button>
              </div>
              <p className="assistantHint">{input.length}/{MAX_INPUT_CHARS} characters</p>
              {assistantStatus ? <p className="assistantStatus">{assistantStatus}</p> : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
