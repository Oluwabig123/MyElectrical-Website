"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_REVEAL_TIMEOUT_MS = 2400;
const VIEWPORT_MARGIN = "320px 0px";

type DeferredSectionProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function DeferredSection({
  children,
  fallback = null,
}: DeferredSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep the server render and initial client render aligned, then reveal on idle/intersection.
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return undefined;

    let cancelled = false;
    let idleHandle: number | null = null;
    let usedIdleCallback = false;
    let observer: IntersectionObserver | null = null;
    const windowWithIdleCallbacks = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const reveal = () => {
      if (cancelled) return;
      setShouldRender(true);
    };

    if (typeof windowWithIdleCallbacks.requestIdleCallback === "function") {
      usedIdleCallback = true;
      idleHandle = windowWithIdleCallbacks.requestIdleCallback(reveal, {
        timeout: IDLE_REVEAL_TIMEOUT_MS,
      });
    } else {
      idleHandle = window.setTimeout(reveal, IDLE_REVEAL_TIMEOUT_MS);
    }

    if ("IntersectionObserver" in window && containerRef.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          reveal();
          observer?.disconnect();
        },
        { rootMargin: VIEWPORT_MARGIN },
      );

      observer.observe(containerRef.current);
    } else {
      reveal();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();

      if (
        usedIdleCallback &&
        idleHandle != null &&
        typeof windowWithIdleCallbacks.cancelIdleCallback === "function"
      ) {
        windowWithIdleCallbacks.cancelIdleCallback(idleHandle);
        return;
      }

      if (idleHandle != null) {
        window.clearTimeout(idleHandle);
      }
    };
  }, [shouldRender]);

  if (shouldRender) return <>{children}</>;

  return <div ref={containerRef}>{fallback}</div>;
}
