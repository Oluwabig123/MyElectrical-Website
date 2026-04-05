"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import BlogCard from "@/components/blog/BlogCard";
import Reveal from "@/components/ui/Reveal";
import { type BlogPost } from "@/lib/blog-shared";
import { useInfiniteBatching } from "@/lib/use-infinite-batching";
import chipStyles from "@/components/ui/FilterChips.module.css";
import skeletonStyles from "@/components/ui/ContentSkeleton.module.css";
import styles from "./BlogListingClient.module.css";

const BLOG_BATCH_SIZE = 4;
const ALL_BLOG_CATEGORIES = "All";

type BlogListingClientProps = {
  posts: BlogPost[];
  batchSize?: number;
  initialQuery?: string;
  initialCategory?: string;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function buildBlogSearchCorpus(post: BlogPost) {
  return [
    post.title,
    post.excerpt,
    post.category,
    post.readingTime,
    ...(post.tags ?? []),
    post.content,
  ]
    .join(" ")
    .toLowerCase();
}

export default function BlogListingClient({
  posts,
  batchSize = BLOG_BATCH_SIZE,
  initialQuery = "",
  initialCategory = "",
}: BlogListingClientProps) {
  const categories = useMemo(
    () => [
      ALL_BLOG_CATEGORIES,
      ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean))),
    ],
    [posts],
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [rawActiveCategory, setRawActiveCategory] = useState(
    categories.includes(initialCategory) ? initialCategory : ALL_BLOG_CATEGORIES,
  );
  const activeCategory = categories.includes(rawActiveCategory)
    ? rawActiveCategory
    : ALL_BLOG_CATEGORIES;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    else params.delete("q");

    if (activeCategory !== ALL_BLOG_CATEGORIES) params.set("category", activeCategory);
    else params.delete("category");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeCategory, searchQuery]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeCategory !== ALL_BLOG_CATEGORIES && post.category !== activeCategory) return false;
      if (!normalizedQuery) return true;
      return buildBlogSearchCorpus(post).includes(normalizedQuery);
    });
  }, [activeCategory, normalizedQuery, posts]);

  const { hasMoreItems, isLoadingMore, loadMoreRef, requestLoadMore, visibleCount } =
    useInfiniteBatching({
      totalCount: filteredPosts.length,
      batchSize,
      resetKeys: [filteredPosts.length, activeCategory, normalizedQuery],
    });
  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const loadingSkeletonCount = isLoadingMore
    ? Math.min(batchSize, Math.max(0, filteredPosts.length - visibleCount))
    : 0;

  if (posts.length === 0) return null;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <p className={styles.summary}>
            {filteredPosts.length} article{filteredPosts.length === 1 ? "" : "s"} shown
            {activeCategory !== ALL_BLOG_CATEGORIES ? ` in ${activeCategory}` : ""}
            {normalizedQuery ? ` for "${searchQuery.trim()}"` : ""}.
          </p>
          <div className={styles.searchField}>
            <label className={styles.searchLabel} htmlFor="blog-search">
              Search articles
            </label>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search wiring, solar, CCTV..."
            />
          </div>
        </div>

        <div className={chipStyles.filters} aria-label="Filter blog posts by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={cn(chipStyles.chip, category === activeCategory && chipStyles.active)}
              onClick={() => setRawActiveCategory(category)}
              aria-pressed={category === activeCategory}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <article className={`routeFallbackCard ${styles.emptyState}`}>
          <h3 className="cardTitle">No articles match your search yet</h3>
          <p className="p">Try another keyword or category to widen the archive.</p>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                setSearchQuery("");
                setRawActiveCategory(ALL_BLOG_CATEGORIES);
              }}
            >
              Clear search
            </button>
          </div>
        </article>
      ) : (
        <div className={styles.grid}>
          {displayedPosts.map((post, index) => (
            <Reveal key={post.slug} delay={index * 0.04}>
              <BlogCard post={post} />
            </Reveal>
          ))}

          {Array.from({ length: loadingSkeletonCount }).map((_, index) => (
            <article key={`blog-card-skeleton-${index}`} className={styles.skeletonCard} aria-hidden="true">
              <div className={styles.skeletonMedia}>
                <div className={skeletonStyles.shimmer} />
              </div>
              <div className={styles.skeletonBody}>
                <span className={cn(skeletonStyles.line, skeletonStyles.title)} />
                <span className={cn(skeletonStyles.line, skeletonStyles.body)} />
                <span className={cn(skeletonStyles.line, skeletonStyles.meta)} />
              </div>
            </article>
          ))}
        </div>
      )}

      {filteredPosts.length > 0 && hasMoreItems ? (
        <div className="infiniteScrollActions">
          <button
            type="button"
            className="btn outline"
            onClick={requestLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading more..." : "Load more posts"}
          </button>
        </div>
      ) : null}

      {filteredPosts.length > 0 && hasMoreItems ? (
        <div ref={loadMoreRef} className="infiniteScrollSentinel" aria-hidden="true" />
      ) : null}
    </>
  );
}
