"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
};

export default function Reveal({ children, delay = 0 }: RevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clearMotionClasses = () => {
      node.classList.remove("is-pending", "is-visible", "is-reduced-motion");
    };

    const showImmediately = () => {
      clearMotionClasses();
      node.classList.add("is-visible");
    };

    if (mediaQuery.matches) {
      clearMotionClasses();
      node.classList.add("is-reduced-motion");
    } else {
      node.classList.add("is-pending");

      if (typeof IntersectionObserver === "undefined") {
        showImmediately();
      } else {
        const observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (!entry?.isIntersecting) return;
            showImmediately();
            observer.disconnect();
          },
          {
            root: null,
            rootMargin: "0px 0px -80px 0px",
            threshold: 0.12,
          },
        );

        observer.observe(node);

        const syncPreference = () => {
          if (mediaQuery.matches) {
            clearMotionClasses();
            node.classList.add("is-reduced-motion");
            observer.disconnect();
            return;
          }

          if (!node.classList.contains("is-visible")) {
            node.classList.add("is-pending");
          }
        };

        if (typeof mediaQuery.addEventListener === "function") {
          mediaQuery.addEventListener("change", syncPreference);
          return () => {
            observer.disconnect();
            mediaQuery.removeEventListener("change", syncPreference);
          };
        }

        mediaQuery.addListener(syncPreference);
        return () => {
          observer.disconnect();
          mediaQuery.removeListener(syncPreference);
        };
      }
    }

    const syncReducedMotion = () => {
      if (!mediaQuery.matches) return;
      clearMotionClasses();
      node.classList.add("is-reduced-motion");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncReducedMotion);
      return () => mediaQuery.removeEventListener("change", syncReducedMotion);
    }

    mediaQuery.addListener(syncReducedMotion);
    return () => mediaQuery.removeListener(syncReducedMotion);
  }, []);

  const style = {
    transitionDelay: `${delay}s`,
  } satisfies CSSProperties;

  return (
    <div
      ref={containerRef}
      className="reveal"
      style={style}
    >
      {children}
    </div>
  );
}
