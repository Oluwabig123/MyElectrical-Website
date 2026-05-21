"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminLoginForm.module.css";
import { supabase } from "@/lib/supabase-client";

type AdminLoginFormProps = {
  nextPath: string;
  isConfigured: boolean;
};

function getNextDestinationLabel(nextPath: string) {
  if (nextPath.startsWith("/admin/assistant-knowledge")) {
    return "Assistant knowledge workspace";
  }

  if (nextPath.startsWith("/admin/products")) {
    return "Product workspace";
  }

  return "Admin workspace";
}

export default function AdminLoginForm({
  nextPath,
  isConfigured,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextDestinationLabel = useMemo(() => getNextDestinationLabel(nextPath), [nextPath]);

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
    <div className={styles.shell}>
      <div className={styles.intro}>
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}>Protected Route</p>
          <h2 className={styles.title}>Sign in with an approved admin account.</h2>
          <p className={styles.lead}>
            This workspace controls your live product catalog and the assistant knowledge base, so
            access stays limited to trusted Oduzz operators.
          </p>
        </div>

        <div className={styles.metaCard}>
          <p className={styles.hintLabel}>Next destination</p>
          <p className={styles.hintValue}>{nextDestinationLabel}</p>
        </div>
      </div>

      {!isConfigured ? (
        <p className="formStatus error">
          Admin access is not configured. Add `NEXT_PUBLIC_SUPABASE_URL`,
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL` or `ADMIN_EMAILS`, and
          `ADMIN_SESSION_SECRET`.
        </p>
      ) : null}

      <form className={`form ${styles.formBody}`} onSubmit={handleSubmit}>
        <label className="field">
          <span>Admin email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@email.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your admin password"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className={styles.helperRow}>
          <p className={`${styles.helperText} ${isSubmitting ? styles.submittingText : ""}`}>
            {isSubmitting
              ? "Checking credentials and creating your browser session..."
              : "Use the same email and password tied to your approved Supabase admin account."}
          </p>
        </div>

        <div className="formActions">
          <button type="submit" className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </div>

        {status.message ? <p className={`formStatus ${status.type}`}>{status.message}</p> : null}
      </form>
    </div>
  );
}
