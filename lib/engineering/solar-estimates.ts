export type BatteryBankEstimateInput = {
  loadWatts: number;
  backupHours: number;
  batteryVoltage?: number | null;
  inverterEfficiency?: number;
  usableDod?: number;
};

export type PanelArrayEstimateInput = {
  dailyEnergyWh: number;
  peakSunHours?: number;
  systemLossFactor?: number;
  panelWattage?: number | null;
};

export type RuntimeEstimateInput = {
  batteryKwh: number;
  loadWatts: number;
  inverterEfficiency?: number;
  usableDod?: number;
};

export const PRACTICAL_INVERTER_EFFICIENCY = 0.9;
export const PRACTICAL_LITHIUM_DOD = 0.8;
export const PRACTICAL_GEL_DOD = 0.5;
export const PRACTICAL_SOLAR_LOSS_FACTOR = 1.3;
export const DEFAULT_PEAK_SUN_HOURS = 4.5;

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function estimateBatteryBank({
  loadWatts,
  backupHours,
  batteryVoltage = 48,
  inverterEfficiency = PRACTICAL_INVERTER_EFFICIENCY,
  usableDod = PRACTICAL_LITHIUM_DOD,
}: BatteryBankEstimateInput) {
  const energyWh = loadWatts * backupHours;
  const requiredBatteryWh = energyWh / inverterEfficiency / usableDod;
  const requiredAh = batteryVoltage && batteryVoltage > 0 ? requiredBatteryWh / batteryVoltage : null;

  return {
    loadWatts,
    backupHours,
    energyWh: round(energyWh, 0),
    requiredBatteryWh: round(requiredBatteryWh, 0),
    requiredBatteryKwh: round(requiredBatteryWh / 1000, 2),
    batteryVoltage,
    requiredAh: requiredAh === null ? null : round(requiredAh, 0),
    inverterEfficiency,
    usableDod,
  };
}

export function estimatePanelArray({
  dailyEnergyWh,
  peakSunHours = DEFAULT_PEAK_SUN_HOURS,
  systemLossFactor = PRACTICAL_SOLAR_LOSS_FACTOR,
  panelWattage = 550,
}: PanelArrayEstimateInput) {
  const targetArrayW = (dailyEnergyWh * systemLossFactor) / peakSunHours;
  const panelCount = panelWattage && panelWattage > 0 ? Math.ceil(targetArrayW / panelWattage) : null;

  return {
    dailyEnergyWh: round(dailyEnergyWh, 0),
    peakSunHours,
    systemLossFactor,
    targetArrayW: round(targetArrayW, 0),
    panelWattage,
    panelCount,
  };
}

export function estimateInverterSize(loadWatts: number, surgeAllowance = 1.25) {
  const continuousWatts = Math.ceil(loadWatts * 1.2);
  const surgeWatts = Math.ceil(continuousWatts * surgeAllowance);

  return {
    loadWatts,
    continuousWatts,
    surgeWatts,
    surgeAllowance,
  };
}

export function estimateChargeCurrent(arrayWatts: number, batteryVoltage = 48, chargeEfficiency = 0.92) {
  const currentA = batteryVoltage > 0 ? arrayWatts / batteryVoltage / chargeEfficiency : null;

  return {
    arrayWatts,
    batteryVoltage,
    chargeEfficiency,
    currentA: currentA === null ? null : round(currentA, 1),
  };
}

export function estimateRuntime({
  batteryKwh,
  loadWatts,
  inverterEfficiency = PRACTICAL_INVERTER_EFFICIENCY,
  usableDod = PRACTICAL_LITHIUM_DOD,
}: RuntimeEstimateInput) {
  const usableWh = batteryKwh * 1000 * usableDod * inverterEfficiency;
  const runtimeHours = loadWatts > 0 ? usableWh / loadWatts : null;

  return {
    batteryKwh,
    loadWatts,
    usableWh: round(usableWh, 0),
    runtimeHours: runtimeHours === null ? null : round(runtimeHours, 1),
    inverterEfficiency,
    usableDod,
  };
}
