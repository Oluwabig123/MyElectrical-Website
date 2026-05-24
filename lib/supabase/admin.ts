import { createClient } from "@supabase/supabase-js";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const supabaseUrl =
  sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_URL) || sanitizeText(process.env.SUPABASE_URL);
const serviceRoleKey = sanitizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function getSupabaseAdminClientOrThrow() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabaseAdmin;
}
