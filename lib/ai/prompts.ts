import type { ConfidenceLevel, SizingRecommendation } from "@/lib/engineering/types";

export function confidenceLabel(level: ConfidenceLevel) {
  if (level === "high") return "High confidence";
  if (level === "medium") return "Medium confidence";
  return "Low confidence";
}

export function buildWorkflowAnswer(recommendation: SizingRecommendation) {
  const firstDecision = recommendation.decision[0] || "I reviewed the available inputs.";
  const missing =
    recommendation.missingInformation.length > 0
      ? ` Missing data: ${recommendation.missingInformation.join("; ")}.`
      : "";

  return `${firstDecision} ${confidenceLabel(recommendation.confidenceLevel)}.${missing}`.trim();
}
