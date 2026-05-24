import { createClient } from "@supabase/supabase-js";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const supabaseUrl = sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseServerConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function createSupabaseServerClient() {
  if (!isSupabaseServerConfigured) {
    throw new Error("Supabase server client is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
