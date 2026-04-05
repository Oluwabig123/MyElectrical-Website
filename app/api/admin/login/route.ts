import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  hasAdminAuthConfig,
  isAuthorizedAdminEmail,
} from "@/lib/admin-auth";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSupabaseAuthClient() {
  const supabaseUrl = sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: Request) {
  if (!hasAdminAuthConfig()) {
    return NextResponse.json(
      {
        error:
          "Admin access is not configured. Set ADMIN_EMAIL or ADMIN_EMAILS and ADMIN_SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  const supabase = buildSupabaseAuthClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = sanitizeText(body?.email).toLowerCase();
  const password = sanitizeText(body?.password);

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your admin email and password." }, { status: 400 });
  }

  if (!isAuthorizedAdminEmail(email)) {
    return NextResponse.json(
      { error: "This account is not allowed to access the admin area." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    return NextResponse.json(
      { error: error?.message || "Admin sign-in failed." },
      { status: 401 },
    );
  }

  if (!isAuthorizedAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account is not allowed to access the admin area." },
      { status: 403 },
    );
  }

  const token = createAdminSessionToken(data.user.email);
  if (!token) {
    return NextResponse.json(
      { error: "Admin session secret is missing." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    email: data.user.email,
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());
  return response;
}
