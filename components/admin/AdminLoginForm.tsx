"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type AdminLoginFormProps = {
  nextPath: string;
  isConfigured: boolean;
};

export default function AdminLoginForm({
  nextPath,
  isConfigured,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfigured || !supabase) {
      setStatus({
        type: "error",
        message:
          "Admin auth is not configured. Add Supabase env keys plus ADMIN_EMAILS and ADMIN_SESSION_SECRET.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload?.error || "Admin sign-in failed.",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        await fetch("/api/admin/logout", { method: "POST" });
        setStatus({
          type: "error",
          message: error.message || "Could not create the browser admin session.",
        });
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message: "Could not complete admin sign-in right now.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Admin email</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@email.com"
          autoComplete="email"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your admin password"
          autoComplete="current-password"
        />
      </label>

      <div className="formActions">
        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </div>

      {status.message ? <p className={`formStatus ${status.type}`}>{status.message}</p> : null}
    </form>
  );
}
