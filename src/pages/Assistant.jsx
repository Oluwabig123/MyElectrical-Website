import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import { oduzzAssistantDoc } from "../data/oduzzAssistantDoc";

const MAX_INPUT_CHARS = 600;
const MAX_MESSAGE_CHARS = 1200;
const MAX_MESSAGES = 40;
const INITIAL_ASSISTANT_MESSAGE = "Hi, I can help with solar sizing, wiring, lighting, and quotes.";

// Shortcut prompts for common conversations the assistant supports.
const QUICK_PROMPTS = [
  "Size my solar system",
  "Cancel current flow",
  "Explain wiring safety steps",
  "Lighting quote checklist",
  "What details do you need for a quote?",
];

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function clampMessage(text) {
  const value = String(text || "").trim();
  if (value.length <= MAX_MESSAGE_CHARS) return value;
  return `${value.slice(0, MAX_MESSAGE_CHARS)}...`;
}

function toNumber(text) {
  const n = Number(String(text || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function roundUpByTable(value, table) {
  const found = table.find((n) => n >= value);
  return found || table[table.length - 1];
}

function getPeakSunHours(location) {
  const loc = normalize(location);
  const rows = oduzzAssistantDoc.solarSizing.peakSunHoursByLocation;
  const exact = rows.find((r) => r.match.some((k) => k !== "default" && loc.includes(k)));
  const fallback = rows.find((r) => r.match.includes("default"));
  return (exact || fallback || { value: 4.5 }).value;
}

// Converts user-provided load details into a rough solar system recommendation.
function buildSolarRecommendation({ loadsWatts, location, backupHours }) {
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

export default function Assistant() {
  // Chat state and solar-sizing flow state live together in this page component.
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");
  const [draft, setDraft] = useState({ loadsWatts: null, location: "", backupHours: null });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const bodyRef = useRef(null);

  const headerMeta = useMemo(
    () => `${oduzzAssistantDoc.company} Doc v${oduzzAssistantDoc.version}`,
    []
  );

  // UI label shown above the chat to reflect the current assistant mode.
  const stageLabel = useMemo(() => {
    if (stage === "solar-loads") return "Solar sizing: load";
    if (stage === "solar-location") return "Solar sizing: location";
    if (stage === "solar-backup") return "Solar sizing: backup";
    return "General assistant";
  }, [stage]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [messages]);

  // Adds an assistant reply while enforcing the page-level message cap.
  function addAssistant(text) {
    const safeText = clampMessage(text);
    setMessages((prev) => [...prev, { role: "assistant", text: safeText }].slice(-MAX_MESSAGES));
  }

  // Routes general questions into a simple intent-based response flow.
  function handleGeneralIntent(raw) {
    const text = normalize(raw);
    const isSolar = /solar|inverter|sizing|size system|panel/.test(text);
    const isWiring = /wiring|conduit|fault|maintenance/.test(text);
    const isLighting = /lighting|chandelier|pop|interior/.test(text);
    const isQuote = /quote|estimate|cost|price|budget/.test(text);

    if (isSolar) {
      setStage("solar-loads");
      addAssistant("Share your total load in watts, for example 1800W.");
      return;
    }

    if (isWiring) {
      addAssistant(
        `${oduzzAssistantDoc.knowledge.services.wiring} Share your location for next steps.`
      );
      return;
    }

    if (isLighting) {
      addAssistant(
        `${oduzzAssistantDoc.knowledge.services.lighting} I can also share a quick pre-quote checklist.`
      );
      return;
    }

    if (isQuote) {
      addAssistant(
        "For a faster quote, share service type, location, and urgency. You can also use the quote page for a guided form."
      );
      return;
    }

    addAssistant(
      "Ask about solar sizing, wiring, lighting, or quote prep. Example: 'size my solar system'."
    );
  }

  // Handles the multi-step solar sizing conversation.
  function handleSolarFlow(raw) {
    const command = normalize(raw);
    if (/cancel|stop|start over|reset|exit/.test(command)) {
      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      addAssistant("Solar sizing flow cancelled. Ask another question anytime.");
      return;
    }

    if (stage === "solar-loads") {
      const watts = toNumber(raw);
      if (!Number.isFinite(watts) || watts <= 0) {
        addAssistant("Enter a valid load in watts, for example 1200W or 2500.");
        return;
      }
      setDraft((d) => ({ ...d, loadsWatts: watts }));
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
      setDraft((d) => ({ ...d, location }));
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
      const rec = buildSolarRecommendation(payload);

      addAssistant(
        [
          "Preliminary sizing:",
          `Load: ${payload.loadsWatts}W`,
          `Location: ${payload.location} (sun hours used: ${rec.sunHours})`,
          `Backup: ${backupHours}h`,
          `Recommended inverter: ${rec.inverterKVA} kVA`,
          `Recommended solar array: ${rec.solarWp} Wp`,
          `Estimated battery bank: ${rec.batteryKWh} kWh (~${rec.batteryAhAt48V}Ah @48V)`,
          oduzzAssistantDoc.policy.note,
        ].join("\n")
      );

      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      addAssistant("Ask another sizing question or request a quote summary.");
    }
  }

  // Submit from the current input box value.
  function onSend() {
    const raw = input.trim().slice(0, MAX_INPUT_CHARS);
    if (!raw) return;
    sendMessage(raw);
    setInput("");
  }

  // Shared send path used by both manual input and quick prompts.
  function sendMessage(raw) {
    const safeRaw = String(raw || "").trim().slice(0, MAX_INPUT_CHARS);
    if (!safeRaw) return;

    setMessages((prev) => [...prev, { role: "user", text: clampMessage(safeRaw) }].slice(-MAX_MESSAGES));

    if (stage.startsWith("solar-")) {
      handleSolarFlow(safeRaw);
      return;
    }

    handleGeneralIntent(safeRaw);
  }

  function onQuickPrompt(prompt) {
    setInput("");
    sendMessage(prompt);
  }

  // Resets the assistant back to the initial state.
  function onReset() {
    setStage("idle");
    setDraft({ loadsWatts: null, location: "", backupHours: null });
    setInput("");
    setMessages([{ role: "assistant", text: INITIAL_ASSISTANT_MESSAGE }]);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

        {/* Two-column layout with prompt shortcuts and the live chat panel. */}
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

          {/* Chat transcript, status header, and composer controls. */}
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
              {messages.map((m, i) => (
                <div key={`${m.role}-${i}`} className={`oduzzMsg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="oduzzAssistantComposer assistantPageComposer">
              <div className="assistantComposerRow">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
                  onKeyDown={onKeyDown}
                  placeholder="Ask Oduzz about solar sizing, wiring, lighting..."
                  rows={2}
                  maxLength={MAX_INPUT_CHARS}
                  aria-label="Ask Oduzz a question"
                />
                <button type="button" className="btn primary" onClick={onSend}>
                  Send
                </button>
              </div>
              <p className="assistantHint">{input.length}/{MAX_INPUT_CHARS} characters</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
