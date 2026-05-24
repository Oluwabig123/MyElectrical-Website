import type { InverterSizingInput, InverterSizingResult } from "@/lib/engineering/types";

const SURGE_KEYWORDS = [
  { pattern: /\bac\b|\bair ?conditioner\b/i, multiplier: 1.55, reason: "AC compressor startup" },
  { pattern: /\bfreezer\b|\bfridge\b|\brefrigerator\b/i, multiplier: 1.35, reason: "refrigeration startup" },
  { pattern: /\bpump\b|\bpressing iron\b/i, multiplier: 1.3, reason: "high startup or heating load" },
];

export function estimateInverterNeed(input: InverterSizingInput): InverterSizingResult {
  const reasons: string[] = [];
  let surgeMultiplier = 1.15;

  for (const item of SURGE_KEYWORDS) {
    if (item.pattern.test(input.appliancesText)) {
      surgeMultiplier = Math.max(surgeMultiplier, item.multiplier);
      reasons.push(item.reason);
    }
  }

  const recommendedContinuousWatts = Math.ceil(input.loadWatts * 1.2);
  const estimatedSurgeWatts = Math.ceil(recommendedContinuousWatts * surgeMultiplier);

  return {
    recommendedContinuousWatts,
    estimatedSurgeWatts,
    surgeReason: reasons,
  };
}
