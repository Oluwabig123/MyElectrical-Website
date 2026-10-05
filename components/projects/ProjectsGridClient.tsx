"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import chipStyles from "@/components/ui/FilterChips.module.css";
import skeletonStyles from "@/components/ui/ContentSkeleton.module.css";
import { buildProjectPath, type ProjectRecord } from "@/lib/projects";
import { useInfiniteBatching } from "@/lib/use-infinite-batching";
import cardStyles from "./ProjectCard.module.css";
import styles from "./ProjectsGridClient.module.css";

const PROJECTS_BATCH_SIZE = 6;
const ALL_PROJECT_CATEGORIES = "All Projects";

type ProjectsGridClientProps = {
  projects: ProjectRecord[];
  batchSize?: number;
  selectedProjectId?: string;
  initialCategory?: string;
};

export default function ProjectsGridClient({
  projects,
  batchSize = PROJECTS_BATCH_SIZE,
  selectedProjectId = "",
  initialCategory = "",
}: ProjectsGridClientProps) {
  const categories = useMemo(
    () => [
      ALL_PROJECT_CATEGORIES,
      ...Array.from(new Set(projects.map((project) => project.category).filter(Boolean))),
    ],
    [projects],
  );

  const [rawActiveCategory, setRawActiveCategory] = useState(
    categories.includes(initialCategory) ? initialCategory : ALL_PROJECT_CATEGORIES,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = categories.includes(rawActiveCategory)
    ? rawActiveCategory
    : ALL_PROJECT_CATEGORIES;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === ALL_PROJECT_CATEGORIES || project.category === activeCategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query) ||
        project.summary.toLowerCase().includes(query) ||
        project.scope.toLowerCase().includes(query) ||
        project.outcome.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, projects, searchQuery]);

  const selectedProjectIndex = selectedProjectId
    ? filteredProjects.findIndex((project) => project.id === selectedProjectId)
    : -1;
  const initialVisibleCount =
    selectedProjectIndex >= 0 ? Math.max(batchSize, selectedProjectIndex + 1) : batchSize;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (activeCategory !== ALL_PROJECT_CATEGORIES) params.set("category", activeCategory);
    else params.delete("category");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeCategory]);

  const { hasMoreItems, isLoadingMore, loadMoreRef, requestLoadMore, visibleCount } =
    useInfiniteBatching({
      totalCount: filteredProjects.length,
      batchSize,
      initialVisibleCount,
      resetKeys: [filteredProjects.length, activeCategory, searchQuery, selectedProjectIndex],
    });

  const displayedProjects = filteredProjects.slice(0, visibleCount);
  const loadingSkeletonCount = isLoadingMore
    ? Math.min(batchSize, Math.max(0, filteredProjects.length - visibleCount))
    : 0;

  useEffect(() => {
    if (!selectedProjectId) return undefined;
    if (!displayedProjects.some((project) => project.id === selectedProjectId)) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(`project-${selectedProjectId}`);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [displayedProjects, selectedProjectId]);

  if (projects.length === 0) return null;

  return (
    <div className={styles.container}>
      {/* Controls: Filter chips + Search input */}
      <div className={styles.controlsBar}>
        <div className={styles.filtersScroller}>
          <div className={`${chipStyles.filters} ${styles.filters}`} role="tablist" aria-label="Filter projects by category">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                role="tab"
                aria-selected={category === activeCategory}
                className={`${chipStyles.chip} ${category === activeCategory ? chipStyles.active : ""} ${styles.filterChip}`}
                onClick={() => setRawActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, inverter, POP..."
            className={styles.searchInput}
            aria-label="Filter projects by location or keyword"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className={styles.summaryCount}>
        Showing {filteredProjects.length} case {filteredProjects.length === 1 ? "study" : "studies"}
        {activeCategory !== ALL_PROJECT_CATEGORIES ? ` in ${activeCategory}` : ""}
        {searchQuery ? ` matching "${searchQuery}"` : ""}.
      </div>

      {filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No matching case studies found</p>
          <p className={styles.emptyText}>
            Try clearing your search query or switching to another category.
          </p>
          <button
            type="button"
            className="btn outline"
            onClick={() => {
              setRawActiveCategory(ALL_PROJECT_CATEGORIES);
              setSearchQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {displayedProjects.map((project, index) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <Reveal key={project.slug} delay={index * 0.04}>
                <article
                  id={`project-${project.id}`}
                  className={`${styles.projectCard} ${isSelected ? styles.activeCard : ""}`}
                >
                  <div className={styles.imageBox}>
                    <Image
                      src={project.image}
                      alt={project.title}
                      className={styles.cardImg}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className={styles.imageOverlay} />
                    <div className={styles.badgeGroup}>
                      <span className={styles.categoryBadge}>{project.category}</span>
                      <span className={styles.durationBadge}>{project.duration}</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.locationMeta}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{project.location}</span>
                    </div>

                    <h3 className={styles.cardTitle}>
                      <Link href={buildProjectPath(project)} className={styles.titleLink}>
                        {project.title}
                      </Link>
                    </h3>

                    <p className={styles.cardSummary}>{project.summary}</p>

                    <div className={styles.scopeBox}>
                      <span className={styles.scopeLabel}>Installation Scope</span>
                      <span className={styles.scopeValue}>{project.scope}</span>
                    </div>

                    <div className={styles.outcomePill}>
                      <svg
                        className={styles.outcomeIcon}
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{project.outcome}</span>
                    </div>

                    <div className={styles.cardFooter}>
                      <Link href={buildProjectPath(project)} className={styles.detailsBtn}>
                        <span>View case study</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>

                      <Link href={`/quote?project=${project.id}`} className={styles.quickQuoteBtn}>
                        Book Similar
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}

          {Array.from({ length: loadingSkeletonCount }).map((_, index) => (
            <article
              key={`seo-project-skeleton-${index}`}
              className={`${cardStyles.card} ${cardStyles.cardSkeleton}`}
              aria-hidden="true"
            >
              <div className={`${cardStyles.media} ${cardStyles.mediaSkeleton}`}>
                <div className={skeletonStyles.shimmer} />
              </div>
              <div className={`${cardStyles.body} ${cardStyles.bodySkeleton}`}>
                <span className={`${skeletonStyles.line} ${skeletonStyles.title}`} />
                <span className={`${skeletonStyles.line} ${skeletonStyles.body}`} />
                <span className={`${skeletonStyles.line} ${skeletonStyles.meta}`} />
                <span className={`${skeletonStyles.line} ${skeletonStyles.cta}`} />
              </div>
            </article>
          ))}
        </div>
      )}

      {filteredProjects.length > 0 && hasMoreItems ? (
        <div className="infiniteScrollActions">
          <button
            type="button"
            className="btn outline"
            onClick={requestLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading more..." : "Load more projects"}
          </button>
        </div>
      ) : null}

      {filteredProjects.length > 0 && hasMoreItems ? (
        <div ref={loadMoreRef} className="infiniteScrollSentinel" aria-hidden="true" />
      ) : null}
    </div>
  );
}
