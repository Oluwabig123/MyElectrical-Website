import React, { useEffect, useRef, useState } from "react";

const IDLE_REVEAL_TIMEOUT_MS = 2400;
const VIEWPORT_MARGIN = "320px 0px";

export default function DeferredSection({ children, fallback = null }) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(() => typeof window === "undefined");

  useEffect(() => {
    if (shouldRender) return undefined;

    let cancelled = false;
    let idleHandle = null;
    let observer = null;

    const reveal = () => {
      if (cancelled) return;
      setShouldRender(true);
    };

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(reveal, { timeout: IDLE_REVEAL_TIMEOUT_MS });
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
        { rootMargin: VIEWPORT_MARGIN }
      );

      observer.observe(containerRef.current);
    } else {
      reveal();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();

      if (typeof idleHandle !== "number" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
        return;
      }

      window.clearTimeout(idleHandle);
    };
  }, [shouldRender]);

  if (shouldRender) return children;

  return <div ref={containerRef}>{fallback}</div>;
}
