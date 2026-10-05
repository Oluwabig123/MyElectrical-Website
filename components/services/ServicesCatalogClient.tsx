"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import chipStyles from "@/components/ui/FilterChips.module.css";
import styles from "./ServicesCatalogClient.module.css";

export type ServiceItem = {
  tier: "flagship" | "support";
  slug: string;
  eyebrow: string;
  title: string;
  desc: string;
  detail: string;
  image: string;
  alt: string;
};

type ServicesCatalogClientProps = {
  services: readonly ServiceItem[];
};

const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "flagship", label: "Flagship Installations" },
  { id: "support", label: "Diagnostics & Controls" },
] as const;

export default function ServicesCatalogClient({ services }: ServicesCatalogClientProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "flagship" && service.tier === "flagship") ||
        (activeTab === "support" && service.tier === "support");

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        service.title.toLowerCase().includes(query) ||
        service.desc.toLowerCase().includes(query) ||
        service.eyebrow.toLowerCase().includes(query) ||
        service.detail.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [services, activeTab, searchQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.controlsBar}>
        <div className={chipStyles.filters} role="tablist" aria-label="Service categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeTab === cat.id}
              className={`${chipStyles.chip} ${activeTab === cat.id ? chipStyles.active : ""} ${styles.filterChip}`}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.label}
            </button>
          ))}
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
            placeholder="Search solar, wiring, CCTV, lighting..."
            className={styles.searchInput}
            aria-label="Filter services by keyword"
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

      {filteredServices.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No matching services found</p>
          <p className={styles.emptyText}>
            Try clearing your search query or switching to another category.
          </p>
          <button
            type="button"
            className="btn outline"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className={styles.serviceGrid}>
          {filteredServices.map((service, index) => {
            const isFlagship = service.tier === "flagship";
            return (
              <Reveal key={service.slug} delay={index * 0.04}>
                <article className={`${styles.card} ${isFlagship ? styles.flagshipCard : ""}`}>
                  <div className={styles.imageBox}>
                    <Image
                      src={service.image}
                      alt={service.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={styles.cardImg}
                    />
                    <div className={styles.imageOverlay} />
                    <div className={styles.badgeGroup}>
                      <span className={`${styles.badge} ${isFlagship ? styles.flagshipBadge : styles.supportBadge}`}>
                        {isFlagship ? "Flagship Service" : "Support & Maintenance"}
                      </span>
                      <span className={styles.eyebrowBadge}>{service.eyebrow}</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>
                      <Link href={`/services/${service.slug}`} className={styles.titleLink}>
                        {service.title}
                      </Link>
                    </h3>
                    <p className={styles.cardDesc}>{service.desc}</p>
                    <p className={styles.cardDetail}>{service.detail}</p>

                    <div className={styles.cardFooter}>
                      <Link href={`/services/${service.slug}`} className={styles.detailsBtn}>
                        <span>Explore details</span>
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
                      <Link href={`/quote?service=${service.slug}`} className={styles.quickQuoteBtn}>
                        Book
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
