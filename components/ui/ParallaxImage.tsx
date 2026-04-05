"use client";

import { useEffect, useRef, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";

type ParallaxImageProps = {
  src: string;
  alt: string;
  height?: number;
  intensity?: number;
};

export default function ParallaxImage({
  src,
  alt,
  height = 360,
  intensity = 60,
}: ParallaxImageProps) {
  const frameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(Boolean(entry?.isIntersecting));
      },
      {
        root: null,
        rootMargin: "160px 0px 160px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    const layer = layerRef.current;
    if (!node || !layer || typeof window === "undefined") return undefined;

    const applyTransform = () => {
      frameRef.current = null;

      if (prefersReducedMotion || !isInView) {
        layer.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const distanceFromCenter = rect.top + (rect.height / 2) - (viewportHeight / 2);
      const maxDistance = (viewportHeight / 2) + (rect.height / 2);
      const progress = maxDistance > 0 ? distanceFromCenter / maxDistance : 0;
      const clampedProgress = Math.max(-1, Math.min(1, progress));
      const translateY = clampedProgress * intensity;

      layer.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    };

    const queueTransform = () => {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(applyTransform);
    };

    queueTransform();
    window.addEventListener("scroll", queueTransform, { passive: true });
    window.addEventListener("resize", queueTransform);

    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("scroll", queueTransform);
      window.removeEventListener("resize", queueTransform);
    };
  }, [intensity, isInView, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="media" style={{ height }}>
      <div ref={layerRef} className="parallaxMediaLayer">
        <SmartImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{
            objectFit: "cover",
          }}
        />
      </div>
      <div className="mediaOverlay" />
      <div className="mediaNoise" />
    </div>
  );
}
