"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/layout/SiteChrome.module.css";

export default function OduzzAssistantWidget() {
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const isHiddenRoute = pathname === "/assistant" || pathname === "/test-your-memory";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const storageKey = "oduzz-ai-prompt-seen";
    const hasSeenPrompt = window.sessionStorage.getItem(storageKey) === "true";

    if (hasSeenPrompt) return undefined;

    setShowPrompt(true);
    window.sessionStorage.setItem(storageKey, "true");

    const timer = window.setTimeout(() => {
      setShowPrompt(false);
    }, 3600);

    return () => window.clearTimeout(timer);
  }, []);

  if (isHiddenRoute) return null;

  return (
    <div className={styles.oduzzAssistant} role="region" aria-label="Oduzz customer assistant">
      {showPrompt ? (
        <Link className={styles.oduzzAssistantPrompt} href="/assistant" aria-label="Open Oduzz AI">
          Need help fast?
        </Link>
      ) : null}

      <Link className={styles.oduzzAssistantToggle} href="/assistant" aria-label="Open Oduzz AI">
        <span className={styles.oduzzAssistantToggleBadge} aria-hidden="true">
          AI
        </span>
        <span className={styles.oduzzAssistantToggleLabel}>Oduzz AI</span>
      </Link>
    </div>
  );
}
