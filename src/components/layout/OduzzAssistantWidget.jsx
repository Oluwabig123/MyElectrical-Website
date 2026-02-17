import React, { useEffect, useMemo, useRef, useState } from "react";
import { oduzzAssistantDoc } from "../../data/oduzzAssistantDoc";

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

export default function OduzzAssistantWidget() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");
  const [draft, setDraft] = useState({ loadsWatts: null, location: "", backupHours: null });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello, I am Oduzz Assistant. I can guide solar sizing, wiring, lighting, and service questions.",
    },
  ]);

  const headerMeta = useMemo(
    () => `${oduzzAssistantDoc.company} Doc v${oduzzAssistantDoc.version}`,
    []
  );

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

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
      addAssistant(
        "For solar sizing, please provide your total load in watts. Example: 1800W."
      );
      return;
    }

    if (isWiring) {
      addAssistant(
        `${oduzzAssistantDoc.knowledge.services.wiring} Share your project location and I can suggest next steps.`
      );
      return;
    }

    if (isLighting) {
      addAssistant(
        `${oduzzAssistantDoc.knowledge.services.lighting} If you want, I can prepare a quick checklist before quote.`
      );
      return;
    }

    addAssistant(
      "I can help with solar sizing, wiring, lighting, and quote preparation. Ask for example: 'size my solar system'."
    );
  }

  function handleSolarFlow(raw) {
    if (stage === "solar-loads") {
      const watts = toNumber(raw);
      if (!Number.isFinite(watts) || watts <= 0) {
        addAssistant("Please enter a valid load in watts, for example 1200W or 2500.");
        return;
      }
      setDraft((d) => ({ ...d, loadsWatts: watts }));
      setStage("solar-location");
      addAssistant("Great. What is your installation location? Example: Ikorodu, Lagos.");
      return;
    }

    if (stage === "solar-location") {
      const location = String(raw || "").trim();
      if (!location) {
        addAssistant("Please provide a location so I can use the right sunlight assumptions.");
        return;
      }
      setDraft((d) => ({ ...d, location }));
      setStage("solar-backup");
      addAssistant("How many backup hours do you want daily?");
      return;
    }

    if (stage === "solar-backup") {
      const backupHours = toNumber(raw);
      if (!Number.isFinite(backupHours) || backupHours <= 0) {
        addAssistant("Please enter backup time in hours, for example 6 or 8.");
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
          `Preliminary sizing from company document rules:`,
          `Load: ${payload.loadsWatts}W`,
          `Location: ${payload.location} (peak sun hours used: ${rec.sunHours})`,
          `Backup: ${backupHours}h`,
          `Recommended inverter: ${rec.inverterKVA} kVA`,
          `Recommended solar array: ${rec.solarWp} Wp`,
          `Estimated battery bank: ${rec.batteryKWh} kWh (~${rec.batteryAhAt48V}Ah @48V)`,
          oduzzAssistantDoc.policy.note,
        ].join("\n")
      );

      setStage("idle");
      setDraft({ loadsWatts: null, location: "", backupHours: null });
      addAssistant("You can ask another sizing question or request a quote summary.");
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
    <div
      ref={rootRef}
      className="oduzzAssistant"
      role="region"
      aria-label="Oduzz customer assistant"
    >
      <button
        className="oduzzAssistantToggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Oduzz Assistant
      </button>

      {open ? (
        <div className="oduzzAssistantPanel">
          <div className="oduzzAssistantHead">
            <strong>Oduzz</strong>
            <span>{headerMeta}</span>
          </div>

          <div className="oduzzAssistantBody">
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
      ) : null}
    </div>
  );
}
