"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LOAD_MORE_DELAY_MS = 520;
const DEFAULT_TRIGGER_OFFSET_PX = 320;

type UseInfiniteBatchingOptions = {
  totalCount: number;
  batchSize: number;
  initialVisibleCount?: number;
  resetKeys: readonly unknown[];
  loadMoreDelayMs?: number;
  triggerOffsetPx?: number;
};

function buildResetSignature(resetKeys: readonly unknown[]) {
  try {
    return JSON.stringify(resetKeys);
  } catch {
    return resetKeys.map((item) => String(item)).join("|");
  }
}

export function useInfiniteBatching({
  totalCount,
  batchSize,
  initialVisibleCount = batchSize,
  resetKeys,
  loadMoreDelayMs = DEFAULT_LOAD_MORE_DELAY_MS,
  triggerOffsetPx = DEFAULT_TRIGGER_OFFSET_PX,
}: UseInfiniteBatchingOptions) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const resetSignature = buildResetSignature(resetKeys);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(Math.max(initialVisibleCount, 0), totalCount),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMoreItems = visibleCount < totalCount;

  const requestLoadMore = useCallback(() => {
    setIsLoadingMore((current) => {
      if (current || visibleCount >= totalCount) return current;
      return true;
    });
  }, [totalCount, visibleCount]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisibleCount(Math.min(Math.max(initialVisibleCount, 0), totalCount));
      setIsLoadingMore(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialVisibleCount, totalCount, resetSignature]);

  useEffect(() => {
    if (!hasMoreItems || isLoadingMore) return undefined;
    const node = loadMoreRef.current;
    if (!node) return undefined;

    const isNearViewport = () =>
      node.getBoundingClientRect().top <= window.innerHeight + triggerOffsetPx;

    const maybeLoadMore = () => {
      if (isNearViewport()) requestLoadMore();
    };

    const frame = window.requestAnimationFrame(maybeLoadMore);

    if (typeof IntersectionObserver === "undefined") {
      window.addEventListener("scroll", maybeLoadMore, { passive: true });
      window.addEventListener("resize", maybeLoadMore);

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("scroll", maybeLoadMore);
        window.removeEventListener("resize", maybeLoadMore);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        requestLoadMore();
      },
      {
        root: null,
        rootMargin: `0px 0px ${triggerOffsetPx}px 0px`,
        threshold: 0,
      },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [hasMoreItems, isLoadingMore, requestLoadMore, triggerOffsetPx]);

  useEffect(() => {
    if (!isLoadingMore) return undefined;

    const timeout = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + batchSize, totalCount));
      setIsLoadingMore(false);
    }, loadMoreDelayMs);

    return () => window.clearTimeout(timeout);
  }, [batchSize, isLoadingMore, loadMoreDelayMs, totalCount]);

  return {
    hasMoreItems,
    isLoadingMore,
    loadMoreRef,
    requestLoadMore,
    visibleCount,
  };
}
