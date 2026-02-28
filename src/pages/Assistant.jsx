import React, { useMemo, useState } from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import { oduzzAssistantDoc } from "../data/oduzzAssistantDoc";

const MAX_INPUT_CHARS = 600;
const MAX_MESSAGE_CHARS = 1200;
const MAX_MESSAGES = 40;

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
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");
  const [draft, setDraft] = useState({ loadsWatts: null, location: "", backupHours: null });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help with solar sizing, wiring, lighting, and quotes.",
    },
  ]);

  const headerMeta = useMemo(
    () => `${oduzzAssistantDoc.company} Doc v${oduzzAssistantDoc.version}`,
    []
  );

  function addAssistant(text) {
    const safeText = clampMessage(text);
    setMessages((prev) => [...prev, { role: "assistant", text: safeText }].slice(-MAX_MESSAGES));
  }

  function handleGeneralIntent(raw) {
    const text = normalize(raw);
    const isSolar = /solar|inverter|sizing|size system|panel/.test(text);
    const isWiring = /wiring|conduit|fault|maintenance/.test(text);
    const isLighting = /lighting|chandelier|pop|interior/.test(text);

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

    addAssistant(
      "Ask about solar sizing, wiring, lighting, or quote prep. Example: 'size my solar system'."
    );
  }

  function handleSolarFlow(raw) {
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

  function onSend() {
    const raw = input.trim().slice(0, MAX_INPUT_CHARS);
    if (!raw) return;

    setMessages((prev) => [...prev, { role: "user", text: clampMessage(raw) }].slice(-MAX_MESSAGES));
    setInput("");

    if (stage.startsWith("solar-")) {
      handleSolarFlow(raw);
      return;
    }

    handleGeneralIntent(raw);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Assistant"
          title="Oduzz Assistant Chat"
          subtitle="Ask about solar sizing, wiring, lighting, and quotes."
        />

        <div className="oduzzAssistantPanel assistantPagePanel">
          <div className="oduzzAssistantHead">
            <strong>Oduzz</strong>
            <span>{headerMeta}</span>
          </div>

          <div className="oduzzAssistantBody assistantPageBody">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`oduzzMsg ${m.role === "user" ? "user" : "assistant"}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="oduzzAssistantComposer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
              onKeyDown={onKeyDown}
              placeholder="Ask Oduzz about solar sizing, wiring, lighting..."
              rows={2}
              maxLength={MAX_INPUT_CHARS}
            />
            <button type="button" className="btn primary" onClick={onSend}>
              Send
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
