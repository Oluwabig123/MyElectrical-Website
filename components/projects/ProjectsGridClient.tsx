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

const PROJECTS_BATCH_SIZE = 4;
const ALL_PROJECT_CATEGORIES = "All";

type ProjectsGridClientProps = {
  projects: ProjectRecord[];
  batchSize?: number;
  selectedProjectId?: string;
  initialCategory?: string;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

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
  const activeCategory = categories.includes(rawActiveCategory)
    ? rawActiveCategory
    : ALL_PROJECT_CATEGORIES;
  const filteredProjects = useMemo(() => {
    if (activeCategory === ALL_PROJECT_CATEGORIES) return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory, projects]);
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
      resetKeys: [filteredProjects.length, activeCategory, selectedProjectIndex],
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
    <>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"} shown
          {activeCategory !== ALL_PROJECT_CATEGORIES ? ` in ${activeCategory}` : ""}.
        </p>
      </div>

      <div className={styles.filtersWrap}>
        <div className={styles.filtersScroller}>
          <div className={cn(chipStyles.filters, styles.filters)} aria-label="Filter projects by category">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={cn(chipStyles.chip, category === activeCategory && chipStyles.active)}
              onClick={() => setRawActiveCategory(category)}
              aria-pressed={category === activeCategory}
            >
              {category}
            </button>
          ))}
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <article className={cn("routeFallbackCard", styles.emptyState)}>
          <h3 className="cardTitle">No projects in this category yet</h3>
          <p className="p">Try another filter or request a similar service quote.</p>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setRawActiveCategory(ALL_PROJECT_CATEGORIES)}
            >
              Show all projects
            </button>
            <Link href="/quote" className="btn primary">
              Request quote
            </Link>
          </div>
        </article>
      ) : (
        <div className={cn("seoCardGrid", cardStyles.grid, styles.projectsGrid)}>
          {displayedProjects.map((project, index) => (
            <Reveal key={project.slug} delay={index * 0.03}>
              <article
                id={`project-${project.id}`}
                className={cn("card", cardStyles.card, styles.projectCard, project.id === selectedProjectId && cardStyles.active)}
              >
                <div className={cn(cardStyles.media, styles.projectMedia)}>
                  <Image
                    src={project.image}
                    alt={project.title}
                    className={cardStyles.image}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className={cn(cardStyles.body, styles.projectBody)}>
                  <p className="kicker">{project.category}</p>
                  <h2 className={cn("cardTitle", styles.projectTitle)}>{project.title}</h2>
                  <p className={cn("p", styles.projectSummary)}>{project.summary}</p>
                  <p className={cn("seoMetaLine", styles.projectMeta)}>
                    {project.location} · {project.duration}
                  </p>
                  <p className={cn("projectOutcome", styles.projectOutcome)}>{project.outcome}</p>
                  <Link href={buildProjectPath(project)} className="btn outline">
                    View case study
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}

          {Array.from({ length: loadingSkeletonCount }).map((_, index) => (
            <article
              key={`seo-project-skeleton-${index}`}
              className={cn("card", cardStyles.card, cardStyles.cardSkeleton)}
              aria-hidden="true"
            >
              <div className={cn(cardStyles.media, cardStyles.mediaSkeleton)}>
                <div className={skeletonStyles.shimmer} />
              </div>
              <div className={cn(cardStyles.body, cardStyles.bodySkeleton)}>
                <span className={cn(skeletonStyles.line, skeletonStyles.title)} />
                <span className={cn(skeletonStyles.line, skeletonStyles.body)} />
                <span className={cn(skeletonStyles.line, skeletonStyles.meta)} />
                <span className={cn(skeletonStyles.line, skeletonStyles.cta)} />
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
    </>
  );
}
