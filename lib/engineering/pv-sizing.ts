import type { PvConfiguration, PvSizingInput, PvSizingResult } from "@/lib/engineering/types";

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function buildColdFactor(temperatureCoefficientVoc: number | null) {
  if (typeof temperatureCoefficientVoc === "number" && Number.isFinite(temperatureCoefficientVoc)) {
    return 1 + Math.abs(temperatureCoefficientVoc) * 10;
  }

  return 1.1;
}

export function calculatePvConfigurations(input: PvSizingInput): PvSizingResult {
  const warnings: string[] = [];

  if (
    !input.panelWatts ||
    !input.panelVoc ||
    !input.panelVmp ||
    !input.panelIsc ||
    !input.panelImp ||
    !input.inverterMaxVoc ||
    !input.inverterMpptMin ||
    !input.inverterMpptMax
  ) {
    return {
      configurations: [],
      recommended: null,
      warnings: ["Verified panel and inverter PV input specifications are required for string validation."],
    };
  }

  const coldFactor = buildColdFactor(input.temperatureCoefficientVoc);
  const maxSeriesByVoc = Math.floor(input.inverterMaxVoc / (input.panelVoc * coldFactor));
  const maxSeriesByMppt = Math.floor(input.inverterMpptMax / input.panelVmp);
  const minSeriesByMppt = Math.max(1, Math.ceil(input.inverterMpptMin / input.panelVmp));
  const maxSeries = Math.min(maxSeriesByVoc, maxSeriesByMppt);
  const maxParallel =
    input.inverterMaxPvCurrent && input.inverterMaxPvCurrent > 0
      ? Math.max(1, Math.floor(input.inverterMaxPvCurrent / input.panelIsc))
      : 6;

  if (maxSeries < minSeriesByMppt) {
    return {
      configurations: [],
      recommended: null,
      warnings: ["The panel voltage window does not fit safely inside the inverter MPPT and max Voc limits."],
    };
  }

  const configurations: PvConfiguration[] = [];
  const targetPanelsByPower =
    input.targetArrayW && input.targetArrayW > 0 ? Math.ceil(input.targetArrayW / input.panelWatts) : null;
  const desiredTotalPanels = input.desiredPanelCount || targetPanelsByPower || minSeriesByMppt;

  for (let series = minSeriesByMppt; series <= maxSeries; series += 1) {
    for (let parallel = 1; parallel <= maxParallel; parallel += 1) {
      const totalPanels = series * parallel;
      const totalPowerW = totalPanels * input.panelWatts;
      const totalVoc = series * input.panelVoc;
      const coldAdjustedVoc = totalVoc * coldFactor;
      const totalVmp = series * input.panelVmp;
      const totalIsc = parallel * input.panelIsc;
      const totalImp = parallel * input.panelImp;

      if (coldAdjustedVoc >= input.inverterMaxVoc) continue;
      if (totalVmp < input.inverterMpptMin || totalVmp > input.inverterMpptMax) continue;
      if (input.inverterMaxPvCurrent && totalIsc > input.inverterMaxPvCurrent) continue;
      if (input.inverterMaxPvPower && totalPowerW > input.inverterMaxPvPower) continue;

      configurations.push({
        series,
        parallel,
        totalPanels,
        totalVoc: round(totalVoc),
        coldAdjustedVoc: round(coldAdjustedVoc),
        totalVmp: round(totalVmp),
        totalIsc: round(totalIsc),
        totalImp: round(totalImp),
        totalPowerW: round(totalPowerW),
      });
    }
  }

  if (!configurations.length) {
    warnings.push("No safe PV string configuration was found with the verified inverter and panel limits.");
  }

  const recommended =
    configurations
      .sort((left, right) => {
        const panelDistance =
          Math.abs(left.totalPanels - desiredTotalPanels) - Math.abs(right.totalPanels - desiredTotalPanels);
        if (panelDistance !== 0) return panelDistance;

        const powerDistance =
          Math.abs((input.targetArrayW || left.totalPowerW) - left.totalPowerW) -
          Math.abs((input.targetArrayW || right.totalPowerW) - right.totalPowerW);
        if (powerDistance !== 0) return powerDistance;

        return right.totalVmp - left.totalVmp;
      })[0] || null;

  return { configurations, recommended, warnings };
}
