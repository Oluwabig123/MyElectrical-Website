import { calculateBatteryNeed } from "@/lib/engineering/battery-sizing";
import { estimateInverterNeed } from "@/lib/engineering/inverter-sizing";
import { buildProtectionRecommendations } from "@/lib/engineering/protection-sizing";
import type { ConsultationState } from "@/lib/ai/consultation-state";

export const CONSULTATION_DECISION_ORDER = [
  "Load",
  "Energy requirement",
  "Battery sizing",
  "Inverter validation",
  "Solar panels",
  "Protection components",
  "Quote summary",
] as const;

export const DEFAULT_EFFICIENCY = 0.85;
export const DEFAULT_USABLE_DOD = 0.8;

const DEFAULT_LOADS_W: Record<string, number> = {
  TV: 120,
  freezer: 180,
  fridge: 150,
  laptop: 65,
  fan: 75,
  bulb: 12,
  AC: 1500,
  pump: 750,
  decoder: 30,
  router: 15,
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function estimateLoadWatts(state: ConsultationState) {
  const collected = state.collected;
  if (collected.total_load_watts) {
    return {
      watts: collected.total_load_watts,
      assumptions: [`User provided total load: ${collected.total_load_watts}W`],
      estimated: false,
    };
  }

  const rows = collected.appliance_details || [];
  if (!rows.length) {
    return {
      watts: null,
      assumptions: [],
      estimated: false,
    };
  }

  const missingQuantities = rows.filter((item) => !item.quantity).map((item) => item.name);
  if (missingQuantities.length) {
    return {
      watts: null,
      assumptions: [`Missing quantities for: ${missingQuantities.join(", ")}`],
      estimated: false,
    };
  }

  const assumptions: string[] = [];
  const watts = rows.reduce((total, item) => {
    const itemWatts = item.wattage || DEFAULT_LOADS_W[item.name] || 0;
    const quantity = item.quantity || 0;
    if (!itemWatts) return total;
    assumptions.push(`${item.label}: ${itemWatts}W x ${quantity}`);
    return total + itemWatts * quantity;
  }, 0);

  return {
    watts: watts || null,
    assumptions,
    estimated: true,
  };
}

export function buildPlanningSizing(state: ConsultationState) {
  const load = estimateLoadWatts(state);
  const backupHours = state.collected.backup_hours || null;

  if (!load.watts || !backupHours) return null;

  const inverterVoltage = state.collected.inverter_voltage
    ? Number(String(state.collected.inverter_voltage).replace(/[^\d.]/g, ""))
    : null;
  const battery = calculateBatteryNeed({
    loadWatts: load.watts,
    backupHours,
    inverterVoltage,
    efficiency: DEFAULT_EFFICIENCY,
    usableDod: DEFAULT_USABLE_DOD,
  });
  const inverter = estimateInverterNeed({
    loadWatts: load.watts,
    appliancesText: state.collected.appliances?.join(", ") || "",
  });
  const protection = buildProtectionRecommendations({
    batteryVoltage: inverterVoltage,
    inverterContinuousWatts: inverter.recommendedContinuousWatts,
    batteryCableChartAvailable: false,
    pvCableChartAvailable: false,
    acCableChartAvailable: false,
  });

  return {
    loadWatts: load.watts,
    loadIsEstimated: load.estimated,
    loadAssumptions: load.assumptions,
    energyRequiredWh: battery.requiredWh,
    energyRequiredKwh: battery.requiredWh / 1000,
    batteryRequiredKwh: battery.requiredKwh,
    inverterRecommendedWatts: inverter.recommendedContinuousWatts,
    inverterSurgeWatts: inverter.estimatedSurgeWatts,
    protection,
    batteryRangeLabel: `${round(battery.requiredKwh, 0)}-${round(battery.requiredKwh + 1, 0)}kWh`,
  };
}

export function getProtectionChecklist() {
  return [
    "Battery cable",
    "Battery DC breaker",
    "PV cable",
    "DC breaker",
    "DC SPD",
    "AC breaker",
    "AC SPD",
    "Earthing",
    "MC4 connectors",
    "Lugs",
  ];
}
