import type { BatterySizingInput, BatterySizingResult } from "@/lib/engineering/types";

export function calculateBatteryNeed(input: BatterySizingInput): BatterySizingResult {
  const requiredWh = input.loadWatts * input.backupHours;
  const adjustedWh = requiredWh / input.efficiency;
  const requiredKwh = adjustedWh / input.usableDod / 1000;
  const requiredContinuousCurrentA =
    input.inverterVoltage && input.inverterVoltage > 0
      ? adjustedWh / input.backupHours / input.inverterVoltage
      : null;

  return {
    requiredWh,
    adjustedWh,
    requiredKwh,
    requiredContinuousCurrentA,
  };
}
