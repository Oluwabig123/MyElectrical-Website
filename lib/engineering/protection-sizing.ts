import type { ConfidenceLevel, RecommendedComponent } from "@/lib/engineering/types";

function chooseConfidence(hasVerifiedChart: boolean): ConfidenceLevel {
  return hasVerifiedChart ? "medium" : "low";
}

export function buildProtectionRecommendations({
  batteryVoltage,
  inverterContinuousWatts,
  batteryCableChartAvailable,
  pvCableChartAvailable,
  acCableChartAvailable,
}: {
  batteryVoltage: number | null;
  inverterContinuousWatts: number | null;
  batteryCableChartAvailable: boolean;
  pvCableChartAvailable: boolean;
  acCableChartAvailable: boolean;
}) {
  const components: RecommendedComponent[] = [];
  const batteryCurrent =
    batteryVoltage && inverterContinuousWatts ? (inverterContinuousWatts / batteryVoltage) * 1.25 : null;
  const acCurrent = inverterContinuousWatts ? (inverterContinuousWatts / 230) * 1.25 : null;

  if (batteryCurrent) {
    components.push({
      category: "Battery DC breaker/fuse",
      recommendation: `Use a DC-rated battery breaker or fuse above ${Math.ceil(batteryCurrent)}A, then match to the verified inverter and battery current limits.`,
      confidence: "medium",
    });
  } else {
    components.push({
      category: "Battery DC breaker/fuse",
      recommendation: "Battery current sizing needs the inverter power and battery voltage.",
      confidence: "low",
    });
  }

  components.push({
    category: "PV protection",
    recommendation: "Use a DC isolator or DC breaker on the PV side together with a DC SPD sized from the verified PV string voltage.",
    confidence: "medium",
  });

  components.push({
    category: "AC protection",
    recommendation: acCurrent
      ? `Use an AC output breaker above ${Math.ceil(acCurrent)}A and an AC SPD on the output/distribution side.`
      : "Use an AC output breaker and AC SPD after confirming inverter output current.",
    confidence: acCurrent ? "medium" : "low",
  });

  components.push({
    category: "Battery cable",
    recommendation: batteryCableChartAvailable
      ? "Select battery cable from the verified battery cable chart using the design current and run length."
      : "Exact battery cable size is pending a verified battery cable chart in the knowledge base.",
    confidence: chooseConfidence(batteryCableChartAvailable),
  });

  components.push({
    category: "PV cable",
    recommendation: pvCableChartAvailable
      ? "Select PV cable from the verified PV cable chart using string current and route length."
      : "Exact PV cable size is pending a verified PV cable chart in the knowledge base.",
    confidence: chooseConfidence(pvCableChartAvailable),
  });

  components.push({
    category: "AC cable",
    recommendation: acCableChartAvailable
      ? "Select AC cable from the verified AC cable chart using output current, route length, and installation method."
      : "Exact AC cable size is pending a verified AC cable chart in the knowledge base.",
    confidence: chooseConfidence(acCableChartAvailable),
  });

  components.push({
    category: "Earthing and SPD",
    recommendation: "Provide earth continuity, bond exposed metal parts, and fit AC/DC SPDs where the final layout requires them.",
    confidence: "medium",
  });

  components.push({
    category: "Connectors and lugs",
    recommendation: "Use MC4 connectors for PV strings and correctly crimped lugs sized to the final cable selection.",
    confidence: "medium",
  });

  return components;
}
