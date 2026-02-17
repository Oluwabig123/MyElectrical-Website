const DEFAULT_ALLOWED_PROTOCOLS = ["https:"];

export function safeExternalUrl(url, { protocols = DEFAULT_ALLOWED_PROTOCOLS } = {}) {
  if (typeof url !== "string" || !url.trim()) return null;

  try {
    const parsed = new URL(url, window.location.origin);
    if (!protocols.includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
