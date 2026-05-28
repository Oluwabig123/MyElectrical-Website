import { buildWorkflowAnswer } from "@/lib/ai/prompts";
import { findBestProductMatch, findFelicityProductsForSizing, findSolarProducts, matchKnowledgeChunks } from "@/lib/ai/rag";
import { calculateBatteryNeed } from "@/lib/engineering/battery-sizing";
import { estimateInverterNeed } from "@/lib/engineering/inverter-sizing";
import { calculatePvConfigurations } from "@/lib/engineering/pv-sizing";
import { buildProtectionRecommendations } from "@/lib/engineering/protection-sizing";
import { buildElectricalSafetyNotice } from "@/lib/engineering/safety-rules";
import {
  estimateBatteryBank,
  estimateChargeCurrent,
  estimateInverterSize,
  estimatePanelArray,
  estimateRuntime,
} from "@/lib/engineering/solar-estimates";
import type {
  ConfidenceLevel,
  ProductSpecMatch,
  ProjectSummary,
  SizingRecommendation,
} from "@/lib/engineering/types";
import { getSupabaseAdminClientOrThrow } from "@/lib/supabase/admin";

export type WorkflowFlowId =
  | "solar"
  | "battery"
  | "inverter"
  | "panels"
  | "protection"
  | "safety"
  | "materials"
  | "wiring"
  | "lighting"
  | "cctv"
  | "quote"
  | "whatsapp";

export type WorkflowRequest = {
  flowId: WorkflowFlowId;
  answers: Record<string, string>;
  sessionId?: string;
  customerName?: string;
  phone?: string;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: digits,
  }).format(value);
}

function parseNumericValue(text: unknown) {
  const value = sanitizeText(text);
  if (!value) return null;

  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePowerWatts(text: unknown) {
  const value = sanitizeText(text).replace(/,/g, "");
  if (!value) return null;

  const match = value.match(/(\d+(?:\.\d+)?)\s*(kva|kw|va|w)\b/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2].toLowerCase();
  if (unit === "kw" || unit === "kva") return amount * 1000;
  return amount;
}

function parseHours(text: string) {
  return parseNumericValue(text);
}

function parsePanelDetails(text: string) {
  const quantity =
    text.match(/(\d+)\s*(?:x|panels?)/i)?.[1] ||
    text.match(/quantity[:\s]+(\d+)/i)?.[1] ||
    "";

  return {
    quantity: quantity ? Number(quantity) : null,
    wattage: parseLabeledNumber(text, ["w", "wattage", "watts"]),
    voc: parseLabeledNumber(text, ["voc"]),
    vmp: parseLabeledNumber(text, ["vmp"]),
    isc: parseLabeledNumber(text, ["isc"]),
    imp: parseLabeledNumber(text, ["imp"]),
  };
}

function parseLabeledNumber(text: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:=]?\\s*(-?\\d+(?:\\.\\d+)?)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function estimateApplianceLoads(text: string) {
  const rows = [
    { key: "tv", watts: 120, aliases: /\btv\b|\btelevision\b/i },
    { key: "fan", watts: 75, aliases: /\bfan\b/i },
    { key: "freezer", watts: 180, aliases: /\bfreezer\b|\bfridge\b|\brefrigerator\b/i },
    { key: "bulb", watts: 12, aliases: /\bbulb\b|\blight\b/i },
    { key: "laptop", watts: 65, aliases: /\blaptop\b/i },
    { key: "decoder", watts: 30, aliases: /\bdecoder\b/i },
    { key: "pump", watts: 750, aliases: /\bpump\b/i },
    { key: "ac", watts: 1500, aliases: /\bac\b|\bair ?conditioner\b/i },
  ];

  const assumptions: string[] = [];
  let totalWatts = 0;

  for (const row of rows) {
    if (!row.aliases.test(text)) continue;
    const quantityMatch = text.match(new RegExp(`(\\d+)\\s+${row.key}`, "i"));
    const quantity = quantityMatch?.[1] ? Number(quantityMatch[1]) : 1;
    totalWatts += quantity * row.watts;
    assumptions.push(`${titleCase(row.key)} assumed at ${row.watts}W x ${quantity}`);
  }

  return {
    totalWatts,
    assumptions,
  };
}

function getConfidenceLevel({
  missingInformation,
  verifiedMatches,
}: {
  missingInformation: string[];
  verifiedMatches: Array<ProductSpecMatch | null>;
}): ConfidenceLevel {
  const exactMatches = verifiedMatches.filter((item) => item?.matchedBy === "exact_model").length;
  if (missingInformation.length === 0 && exactMatches >= 2) return "high";
  if (missingInformation.length <= 2 && verifiedMatches.some(Boolean)) return "medium";
  return "low";
}

function buildProjectSummary({
  service,
  answers,
  recommendedSetup,
  protectionComponents,
  missingInformation,
  confidence,
  nextStep,
}: {
  service: string;
  answers: Record<string, string>;
  recommendedSetup: string;
  protectionComponents: string;
  missingInformation: string[];
  confidence: ConfidenceLevel;
  nextStep: string;
}): ProjectSummary {
  return {
    service,
    location: sanitizeText(answers.location || answers.installation_location) || "Not provided",
    appliances: sanitizeText(answers.appliances || answers.load_profile) || "Not provided",
    backupTarget: sanitizeText(answers.backup_hours || answers.backup_target) || "Not provided",
    existingInverter: sanitizeText(answers.existing_inverter || answers.inverter_details) || "Not provided",
    existingBattery: sanitizeText(answers.existing_battery || answers.battery_details) || "Not provided",
    solarPanels: sanitizeText(answers.panel_details || answers.existing_panels) || "Not provided",
    budget: sanitizeText(answers.budget) || "Not provided",
    recommendedSetup,
    protectionComponents,
    missingInformation: missingInformation.length ? missingInformation.join("; ") : "None",
    confidence,
    nextStep,
  };
}

function buildQuoteSummary(summary: ProjectSummary) {
  return [
    "PROJECT SUMMARY",
    `Service: ${summary.service}`,
    `Location: ${summary.location}`,
    `Appliances: ${summary.appliances}`,
    `Backup target: ${summary.backupTarget}`,
    `Existing inverter: ${summary.existingInverter}`,
    `Existing battery: ${summary.existingBattery}`,
    `Solar panels: ${summary.solarPanels}`,
    `Budget: ${summary.budget}`,
    `Recommended setup: ${summary.recommendedSetup}`,
    `Protection components: ${summary.protectionComponents}`,
    `Missing information: ${summary.missingInformation}`,
    `Confidence: ${titleCase(summary.confidence)}`,
    `Next step: ${summary.nextStep}`,
  ].join("\n");
}

function sourceFromMatch(match: ProductSpecMatch | null) {
  if (!match) return null;
  return {
    title: [match.manufacturer, match.model].filter(Boolean).join(" ") || match.model || match.productType,
    manufacturer: match.manufacturer,
    model: match.model,
    productType: match.productType,
    source: match.source,
  };
}

async function persistConsultation(request: WorkflowRequest, recommendation: SizingRecommendation) {
  try {
    const supabase = getSupabaseAdminClientOrThrow();
    const { error } = await supabase.from("ai_consultations").insert({
      session_id: sanitizeText(request.sessionId) || null,
      consultation_type: request.flowId,
      customer_name: sanitizeText(request.customerName) || null,
      phone: sanitizeText(request.phone) || null,
      location: recommendation.projectSummary.location,
      collected_inputs: request.answers,
      recommendation,
      confidence_level: recommendation.confidenceLevel,
      quote_summary: recommendation.quoteSummary,
    });

    if (error) {
      console.warn("Could not persist ai consultation:", error.message);
    }
  } catch (error) {
    console.warn("Skipping ai consultation persistence:", error);
  }
}

function ensureDecisionLines(lines: string[]) {
  return lines.filter(Boolean).slice(0, 6);
}

async function safeFindBestProductMatch(parameters: Parameters<typeof findBestProductMatch>[0]) {
  try {
    return await findBestProductMatch(parameters);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown product match error";
    console.warn("Skipping product match:", message);
    return null;
  }
}

async function safeFindFelicityProducts(parameters: Parameters<typeof findFelicityProductsForSizing>[0]) {
  try {
    return await findFelicityProductsForSizing(parameters);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Felicity product lookup error";
    console.warn("Skipping Felicity product lookup:", message);
    return [];
  }
}

function specNumber(match: ProductSpecMatch | null | undefined, key: string) {
  const parsed = Number(match?.specs?.[key]);
  return Number.isFinite(parsed) ? parsed : null;
}

function describeProduct(match: ProductSpecMatch | null | undefined) {
  if (!match) return "";
  return [match.manufacturer, match.model].filter(Boolean).join(" ").trim() || match.model || match.productType;
}

async function runSolarWorkflow(request: WorkflowRequest) {
  const serviceMap: Record<WorkflowFlowId, string> = {
    solar: "Solar sizing",
    battery: "Battery sizing",
    inverter: "Inverter recommendation",
    panels: "Solar panel recommendation",
    protection: "Protection recommendation",
    safety: "Safety review",
    materials: "Materials recommendation",
    wiring: "Wiring help",
    lighting: "Lighting recommendation",
    cctv: "CCTV / smart home",
    quote: "Quote request",
    whatsapp: "WhatsApp handoff",
  };
  const appliances = sanitizeText(request.answers.appliances);
  const backupHours = parseHours(request.answers.backup_hours);
  const inverterText = sanitizeText(request.answers.existing_inverter || request.answers.inverter_details);
  const batteryText = sanitizeText(request.answers.existing_battery || request.answers.battery_details);
  const panelText = sanitizeText(request.answers.panel_details || request.answers.existing_panels);
  const loadEstimate = estimateApplianceLoads(appliances);
  const inverterTextWatts = parsePowerWatts(inverterText);
  const planningLoadWatts = loadEstimate.totalWatts || (inverterTextWatts ? Math.round(inverterTextWatts * 0.75) : 0);
  const inverterNeed = planningLoadWatts > 0 ? estimateInverterNeed({ loadWatts: planningLoadWatts, appliancesText: appliances }) : null;
  const inverterMatch = inverterText
    ? await safeFindBestProductMatch({ productTypes: ["inverter", "hybrid_inverter"], text: inverterText })
    : null;
  const batteryMatch = batteryText
    ? await safeFindBestProductMatch({ productTypes: ["battery"], text: batteryText })
    : null;
  const panelMatch = panelText
    ? await safeFindBestProductMatch({ productTypes: ["solar_panel"], text: panelText })
    : null;
  const panelManual = parsePanelDetails(panelText);

  const inverterVoltage =
    toNumber(inverterMatch?.specs.battery_voltage) ||
    toNumber(inverterMatch?.specs.nominal_voltage) ||
    parseLabeledNumber(inverterText, ["24v", "48v"]) ||
    null;

  const batteryNeed =
    planningLoadWatts > 0 && backupHours
      ? calculateBatteryNeed({
          loadWatts: planningLoadWatts,
          backupHours,
          inverterVoltage,
          efficiency: 0.92,
          usableDod: 0.8,
        })
      : null;

  const missingInformation: string[] = [];
  if (!appliances) missingInformation.push("Appliance list");
  if (!backupHours) missingInformation.push("Backup hours");
  if (!inverterMatch && !inverterText) missingInformation.push("Exact inverter model");
  if (appliances && /\bac\b|\bfreezer\b|\bpump\b/i.test(appliances) && !sanitizeText(request.answers.load_surge_details)) {
    missingInformation.push("AC, freezer, or pump nameplate/HP details");
  }

  const panelWatts = panelManual.wattage || toNumber(panelMatch?.specs.wattage) || toNumber(panelMatch?.specs.rated_power_w);
  const panelVoc = panelManual.voc || toNumber(panelMatch?.specs.voc);
  const panelVmp = panelManual.vmp || toNumber(panelMatch?.specs.vmp);
  const panelIsc = panelManual.isc || toNumber(panelMatch?.specs.isc);
  const panelImp = panelManual.imp || toNumber(panelMatch?.specs.imp);

  const targetArrayW =
    planningLoadWatts > 0 && backupHours ? Math.ceil((planningLoadWatts * backupHours * 1.35) / 4.5) : null;
  const practicalBatteryEstimate =
    planningLoadWatts > 0 && backupHours
      ? estimateBatteryBank({
          loadWatts: planningLoadWatts,
          backupHours,
          batteryVoltage: inverterVoltage || 48,
        })
      : null;
  const practicalInverterEstimate =
    planningLoadWatts > 0 ? estimateInverterSize(planningLoadWatts) : null;
  const practicalPanelEstimate =
    planningLoadWatts > 0 && backupHours
      ? estimatePanelArray({
          dailyEnergyWh: planningLoadWatts * backupHours,
          panelWattage: panelWatts || 550,
        })
      : null;
  const practicalChargeEstimate =
    practicalPanelEstimate?.targetArrayW
      ? estimateChargeCurrent(practicalPanelEstimate.targetArrayW, inverterVoltage || 48)
      : null;
  const fallbackBatteryKwhForInverter = inverterTextWatts
    ? inverterTextWatts <= 3000
      ? 4.8
      : inverterTextWatts <= 5000
        ? 9.6
        : 14
    : null;
  const felicityBatteryCandidates = practicalBatteryEstimate || fallbackBatteryKwhForInverter
    ? await safeFindFelicityProducts({
        productTypes: ["battery"],
        minCapacityKwh: practicalBatteryEstimate?.requiredBatteryKwh || fallbackBatteryKwhForInverter,
        limit: 4,
      })
    : [];
  const felicityInverterCandidates = practicalInverterEstimate
    ? await safeFindFelicityProducts({
        productTypes: ["hybrid_inverter", "inverter"],
        minRatedPowerW: practicalInverterEstimate.continuousWatts,
        limit: 4,
      })
    : [];
  const felicityPanelCandidates = await safeFindFelicityProducts({
    productTypes: ["solar_panel"],
    limit: 6,
  });
  const suggestedFelicityBattery = felicityBatteryCandidates[0] || null;
  const suggestedFelicityInverter = felicityInverterCandidates[0] || null;
  const suggestedFelicityPanel = felicityPanelCandidates[0] || null;
  const suggestedFelicityPanelWatts = specNumber(suggestedFelicityPanel, "wattage") || specNumber(suggestedFelicityPanel, "rated_power_w");
  const suggestedFelicityRuntime =
    suggestedFelicityBattery && planningLoadWatts > 0
      ? estimateRuntime({
          batteryKwh:
            specNumber(suggestedFelicityBattery, "capacity_kwh") ||
            (specNumber(suggestedFelicityBattery, "energy_wh") || 0) / 1000,
          loadWatts: planningLoadWatts,
          usableDod: /gel/i.test(String(suggestedFelicityBattery.specs.battery_type || ""))
            ? 0.5
            : 0.8,
        })
      : null;
  const suggestedFelicityPanelCount =
    practicalPanelEstimate?.targetArrayW && suggestedFelicityPanelWatts
      ? Math.ceil(practicalPanelEstimate.targetArrayW / suggestedFelicityPanelWatts)
      : null;

  const pvResult = calculatePvConfigurations({
    targetArrayW,
    desiredPanelCount: panelManual.quantity,
    panelWatts,
    panelVoc,
    panelVmp,
    panelIsc,
    panelImp,
    temperatureCoefficientVoc: toNumber(panelMatch?.specs.temperature_coefficient_voc),
    inverterMaxVoc: toNumber(inverterMatch?.specs.max_pv_voc),
    inverterMpptMin: toNumber(inverterMatch?.specs.mppt_min_v),
    inverterMpptMax: toNumber(inverterMatch?.specs.mppt_max_v),
    inverterMaxPvCurrent: toNumber(inverterMatch?.specs.max_pv_current_a),
    inverterMaxPvPower: toNumber(inverterMatch?.specs.max_pv_power_w),
  });

  if (panelText && !panelMatch && (!panelVoc || !panelVmp || !panelIsc || !panelImp)) {
    missingInformation.push("Verified panel datasheet values or exact panel model");
  }

  if (batteryText && !batteryMatch) {
    missingInformation.push("Verified battery model or manual");
  }

  const batteryNominalVoltage = toNumber(batteryMatch?.specs.nominal_voltage);
  const needsBatterySeriesSupport =
    Boolean(batteryMatch && inverterVoltage && batteryNominalVoltage) &&
    Number(inverterVoltage) > Number(batteryNominalVoltage);
  const batterySeriesSupport = needsBatterySeriesSupport
    ? toNumber(batteryMatch?.specs.supported_series)
    : null;

  if (
    needsBatterySeriesSupport &&
    (!batterySeriesSupport || batterySeriesSupport < 2)
  ) {
    missingInformation.push("Verified battery series support");
  }

  const batteryCableChart = await findSolarProducts({ productTypes: ["cable"], modelText: "battery", limit: 3 }).catch(() => []);
  const pvCableChart = await findSolarProducts({ productTypes: ["cable"], modelText: "pv", limit: 3 }).catch(() => []);
  const acCableChart = await findSolarProducts({ productTypes: ["cable"], modelText: "ac", limit: 3 }).catch(() => []);

  const confidenceLevel = getConfidenceLevel({
    missingInformation,
    verifiedMatches: [inverterMatch, batteryMatch, panelMatch],
  });

  const recommendedComponents = buildProtectionRecommendations({
    batteryVoltage: inverterVoltage,
    inverterContinuousWatts: inverterNeed?.recommendedContinuousWatts || null,
    batteryCableChartAvailable: batteryCableChart.length > 0,
    pvCableChartAvailable: pvCableChart.length > 0,
    acCableChartAvailable: acCableChart.length > 0,
  });

  const recommendedSetup = [
    inverterNeed
      ? `Inverter target around ${formatNumber(inverterNeed.recommendedContinuousWatts, 0)}W continuous`
      : "Inverter target pending load details",
    batteryNeed ? `battery storage around ${formatNumber(batteryNeed.requiredKwh)}kWh usable` : "battery sizing pending backup details",
    pvResult.recommended
      ? `${pvResult.recommended.totalPanels} panel(s) as ${pvResult.recommended.series}S${pvResult.recommended.parallel}P`
      : "PV string pending verified panel and inverter specs",
    suggestedFelicityBattery ? `candidate battery: ${describeProduct(suggestedFelicityBattery)}` : "",
    suggestedFelicityInverter ? `candidate inverter: ${describeProduct(suggestedFelicityInverter)}` : "",
  ].filter(Boolean).join(", ");

  const protectionSummary = recommendedComponents.map((item) => `${item.category}: ${item.recommendation}`).join(" | ");
  const nextStep =
    confidenceLevel === "high"
      ? "Review the recommendation, confirm site conditions, and proceed to quote or WhatsApp."
      : "Provide the missing model labels or send photos on WhatsApp so Oduzz can validate the final configuration.";

  const projectSummary = buildProjectSummary({
    service: serviceMap[request.flowId],
    answers: request.answers,
    recommendedSetup,
    protectionComponents: protectionSummary,
    missingInformation,
    confidence: confidenceLevel,
    nextStep,
  });

  const knowledgeEvidence = await matchKnowledgeChunks({
    query: [appliances, inverterText, batteryText, panelText].filter(Boolean).join(" | "),
    productType: panelMatch?.productType || inverterMatch?.productType || null,
    model: inverterMatch?.model || panelMatch?.model || null,
    matchCount: 4,
  }).catch(() => []);

  const recommendation: SizingRecommendation = {
    quickAnswer:
      confidenceLevel === "high"
        ? "I found enough verified data to recommend a practical starting setup."
        : "I can outline a practical starting setup, but final product matching still needs verified specs.",
    verifiedSpecs: [
      inverterMatch
        ? { label: "Inverter", value: `${inverterMatch.manufacturer || ""} ${inverterMatch.model || ""}`.trim() }
        : null,
      inverterMatch?.specs.max_pv_voc
        ? { label: "Max PV Voc", value: `${inverterMatch.specs.max_pv_voc}V` }
        : null,
      inverterMatch?.specs.mppt_min_v && inverterMatch?.specs.mppt_max_v
        ? {
            label: "MPPT range",
            value: `${inverterMatch.specs.mppt_min_v}V - ${inverterMatch.specs.mppt_max_v}V`,
          }
        : null,
      batteryMatch
        ? { label: "Battery", value: `${batteryMatch.manufacturer || ""} ${batteryMatch.model || ""}`.trim() }
        : null,
      panelMatch
        ? { label: "Panel", value: `${panelMatch.manufacturer || ""} ${panelMatch.model || ""}`.trim() }
        : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item)),
    calculations: [
      loadEstimate.totalWatts
        ? { label: "Estimated load", value: `${formatNumber(loadEstimate.totalWatts, 0)}W` }
        : null,
      backupHours ? { label: "Backup target", value: `${formatNumber(backupHours)} hour(s)` } : null,
      batteryNeed ? { label: "Required storage", value: `${formatNumber(batteryNeed.requiredKwh)}kWh usable` } : null,
      practicalBatteryEstimate
        ? {
            label: "Practical battery bank",
            value: `${formatNumber(practicalBatteryEstimate.requiredBatteryKwh)}kWh nominal, about ${formatNumber(practicalBatteryEstimate.requiredAh || 0, 0)}Ah @${formatNumber(practicalBatteryEstimate.batteryVoltage || 48, 0)}V`,
          }
        : null,
      inverterNeed
        ? { label: "Recommended inverter class", value: `${formatNumber(inverterNeed.recommendedContinuousWatts, 0)}W continuous` }
        : null,
      practicalPanelEstimate
        ? {
            label: "Panel array target",
            value: `${formatNumber(practicalPanelEstimate.targetArrayW, 0)}Wp before final MPPT string validation`,
          }
        : null,
      practicalChargeEstimate?.currentA
        ? {
            label: "Estimated charge current",
            value: `${formatNumber(practicalChargeEstimate.currentA)}A around ${formatNumber(practicalChargeEstimate.batteryVoltage, 0)}V`,
          }
        : null,
      suggestedFelicityBattery
        ? {
            label: "Felicity battery candidate",
            value: `${describeProduct(suggestedFelicityBattery)}${suggestedFelicityRuntime?.runtimeHours ? `, about ${formatNumber(suggestedFelicityRuntime.runtimeHours)}h at this load` : ""}`,
          }
        : null,
      suggestedFelicityInverter
        ? { label: "Felicity inverter candidate", value: describeProduct(suggestedFelicityInverter) }
        : null,
      suggestedFelicityPanel && suggestedFelicityPanelCount
        ? {
            label: "Felicity panel direction",
            value: `${suggestedFelicityPanelCount} x ${describeProduct(suggestedFelicityPanel)} before string checks`,
          }
        : null,
      pvResult.recommended
        ? {
            label: "PV string",
            value: `${pvResult.recommended.series}S${pvResult.recommended.parallel}P (${formatNumber(pvResult.recommended.totalPowerW, 0)}W)`,
          }
        : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item)),
    decision: ensureDecisionLines([
      loadEstimate.totalWatts
        ? `Estimated load is about ${formatNumber(loadEstimate.totalWatts, 0)}W based on the appliance list and standard working assumptions.`
        : "A final load estimate still needs clearer appliance ratings.",
      inverterNeed
        ? `A practical inverter target is around ${formatNumber(inverterNeed.recommendedContinuousWatts, 0)}W continuous with allowance for startup demand.`
        : "",
      batteryNeed
        ? `Battery storage target is about ${formatNumber(batteryNeed.requiredKwh)}kWh usable after efficiency and depth-of-discharge allowances.`
        : "",
      suggestedFelicityBattery
        ? `${describeProduct(suggestedFelicityBattery)} is a Felicity candidate to review because its stored capacity is closest above the calculated need.`
        : "",
      pvResult.recommended
        ? `The safest PV arrangement found is ${pvResult.recommended.series} in series and ${pvResult.recommended.parallel} string(s) in parallel.`
        : pvResult.warnings[0] || "",
      suggestedFelicityPanel && suggestedFelicityPanelCount
        ? `Using retrieved Felicity panel specs, start around ${suggestedFelicityPanelCount} panel(s), then validate series/parallel against inverter MPPT voltage, max PV Voc, PV current, and roof space.`
        : "",
      batterySeriesSupport
        ? `Battery series support appears available up to ${formatNumber(batterySeriesSupport, 0)} unit(s), but the final recommendation should still follow the manual.`
        : batteryText && batteryMatch
          ? "I do not have verified series support for this battery in the Oduzz knowledge base yet."
          : "",
    ]),
    safetyNote: buildElectricalSafetyNotice(appliances) || buildElectricalSafetyNotice(request.answers.issue),
    recommendedComponents,
    missingInformation,
    confidenceLevel,
    quoteSummary: buildQuoteSummary(projectSummary),
    projectSummary,
    sources: [
      sourceFromMatch(inverterMatch),
      sourceFromMatch(batteryMatch),
      sourceFromMatch(panelMatch),
      sourceFromMatch(suggestedFelicityBattery),
      sourceFromMatch(suggestedFelicityInverter),
      sourceFromMatch(suggestedFelicityPanel),
      ...knowledgeEvidence.map((item) => ({
        title: item.title || "Knowledge chunk",
        manufacturer: item.manufacturer,
        model: item.model,
        productType: item.product_type || "business",
        source: item.source,
      })),
    ].filter((item): item is NonNullable<ReturnType<typeof sourceFromMatch>> => Boolean(item)),
  };

  await persistConsultation(request, recommendation);
  return recommendation;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildGenericTechnicalRecommendation(request: WorkflowRequest, service: string): SizingRecommendation {
  const issue = sanitizeText(
    request.answers.issue ||
      request.answers.project_type ||
      request.answers.service ||
      request.answers.service_need ||
      request.answers.space ||
      request.answers.coverage,
  );
  const safetyNote = buildElectricalSafetyNotice(issue);
  const missingInformation = ["Exact model or verified technical specifications"];
  const projectSummary = buildProjectSummary({
    service,
    answers: request.answers,
    recommendedSetup: "Guided consultation captured. Final technical sizing needs verified product specs.",
    protectionComponents: "Confirm protection, cable, and earthing details after site or model review.",
    missingInformation,
    confidence: "low",
    nextStep: "Continue on WhatsApp or request a quote for technician review.",
  });

  return {
    quickAnswer:
      service === "Safety review"
        ? "I captured the safety concern. This should be handled as an inspection-first issue."
        : "I captured the consultation path, but I still need verified specs before making a technical recommendation.",
    verifiedSpecs: [],
    calculations: [],
    decision:
      service === "Safety review"
        ? [
            "Switch off the affected circuit where safe to do so, avoid touching exposed or hot parts, and arrange professional inspection before reuse.",
          ]
        : [
            "This workflow is using the guided consultation path while the solar decision engine stays the primary deep workflow in v1.",
          ],
    safetyNote,
    recommendedComponents: [],
    missingInformation,
    confidenceLevel: "low",
    quoteSummary: buildQuoteSummary(projectSummary),
    projectSummary,
    sources: [],
  };
}

export async function runAssistantWorkflow(request: WorkflowRequest) {
  let recommendation: SizingRecommendation;

  if (["solar", "battery", "inverter", "panels", "protection"].includes(request.flowId)) {
    recommendation = await runSolarWorkflow(request);
  } else {
    recommendation = buildGenericTechnicalRecommendation(
      request,
      request.flowId === "wiring"
        ? "Wiring help"
        : request.flowId === "safety"
          ? "Safety review"
          : titleCase(request.flowId),
    );
    await persistConsultation(request, recommendation);
  }

  return {
    answer: buildWorkflowAnswer(recommendation),
    recommendation,
    usedKnowledgeBase: recommendation.sources.length > 0,
    sources: recommendation.sources,
  };
}
