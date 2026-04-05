import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "oduzz_admin_session";
const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function getAdminSessionSecret() {
  return (
    sanitizeText(process.env.ADMIN_SESSION_SECRET) ||
    sanitizeText(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function signPayload(payload: string) {
  const secret = getAdminSessionSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function getAllowedAdminEmails() {
  return [
    sanitizeText(process.env.ADMIN_EMAIL),
    ...sanitizeText(process.env.ADMIN_EMAILS)
      .split(",")
      .map((value) => sanitizeText(value)),
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

export function isAuthorizedAdminEmail(email: string) {
  const allowedEmails = getAllowedAdminEmails();
  if (allowedEmails.length === 0) return false;
  return allowedEmails.includes(sanitizeText(email).toLowerCase());
}

export function hasAdminAuthConfig() {
  return Boolean(getAdminSessionSecret() && getAllowedAdminEmails().length > 0);
}

export function createAdminSessionToken(email: string) {
  const normalizedEmail = sanitizeText(email).toLowerCase();
  const payload: AdminSessionPayload = {
    email: normalizedEmail,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_DURATION_SECONDS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  if (!signature) return "";

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string) {
  const trimmedToken = sanitizeText(token);
  if (!trimmedToken) return null;

  const [encodedPayload, signature] = trimmedToken.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!expectedSignature) return null;

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!isAuthorizedAdminEmail(payload.email)) return null;

    return {
      email: payload.email,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token || "");
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  };
}

export function sanitizeNextPath(value: string) {
  const trimmedValue = sanitizeText(value);
  if (!trimmedValue.startsWith("/")) return "/admin/products";
  if (trimmedValue.startsWith("//")) return "/admin/products";
  return trimmedValue;
}
