const SAFETY_PATTERN =
  /spark|sparking|burning smell|melted socket|burnt socket|shock|exposed wire|exposed cable|tripping breaker|breaker is tripping|overheating cable|smoke|hot socket/i;

export function detectElectricalHazard(text: unknown) {
  const value = String(text || "").trim();
  if (!value || !SAFETY_PATTERN.test(value)) return false;
  return true;
}

export function buildElectricalSafetyNotice(text: unknown) {
  if (!detectElectricalHazard(text)) return null;

  return "For safety, switch off the affected circuit immediately, stop using the load, avoid touching exposed parts, and arrange inspection before any repair attempt.";
}
