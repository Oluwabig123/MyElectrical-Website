"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import ProductCard from "@/components/products/ProductCard";
import cardStyles from "@/components/products/ProductCard.module.css";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import { type Product } from "@/lib/product-catalog";
import { useInfiniteBatching } from "@/lib/use-infinite-batching";

const PRODUCTS_BATCH_SIZE = 4;

type ProductGroup = {
  key: string;
  label: string;
  items: Product[];
};

type ProductsCatalogClientProps = {
  groups: ProductGroup[];
  totalCategories: number;
  catalogError?: string;
  title?: string;
  eyebrow?: string;
  intro?: string;
  stats?: Array<{
    value: string;
    label: string;
  }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function ProductsCatalogClient({
  groups,
  totalCategories,
  catalogError = "",
  title = "Products",
  eyebrow = "Products",
  intro = "",
  stats = [],
}: ProductsCatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const activeCategory = searchParams.get("category") || "";
  const activeSort = searchParams.get("sort") || "featured";
  const stockFilter = searchParams.get("stock") === "in";
  const visibleGroups = activeCategory
    ? groups.filter((group) => group.key === activeCategory)
    : groups;

  const visibleProducts = useMemo(() => {
    const byName = (left: Product, right: Product) => left.name.localeCompare(right.name);
    const resolvePrice = (item: Product) => (item.priceAmount > 0 ? item.priceAmount : null);
    const sorted = visibleGroups
      .flatMap((group) => group.items)
      .filter((item) => (stockFilter ? item.isActive && item.stockQty > 0 : true))
      .sort((left, right) => {
        if (activeSort === "price-asc") {
          const leftPrice = resolvePrice(left);
          const rightPrice = resolvePrice(right);
          if (leftPrice == null && rightPrice == null) return byName(left, right);
          if (leftPrice == null) return 1;
          if (rightPrice == null) return -1;
          return leftPrice - rightPrice || byName(left, right);
        }

        if (activeSort === "price-desc") {
          const leftPrice = resolvePrice(left);
          const rightPrice = resolvePrice(right);
          if (leftPrice == null && rightPrice == null) return byName(left, right);
          if (leftPrice == null) return 1;
          if (rightPrice == null) return -1;
          return rightPrice - leftPrice || byName(left, right);
        }

        if (activeSort === "name-asc") return byName(left, right);
        if (left.featured !== right.featured) return Number(right.featured) - Number(left.featured);
        return byName(left, right);
      });

    return sorted;
  }, [activeSort, stockFilter, visibleGroups]);

  const hasCatalogControls =
    Boolean(activeCategory) || stockFilter || (activeSort && activeSort !== "featured");
  const { hasMoreItems, isLoadingMore, loadMoreRef, requestLoadMore, visibleCount } =
    useInfiniteBatching({
      totalCount: visibleProducts.length,
      batchSize: PRODUCTS_BATCH_SIZE,
      resetKeys: [activeCategory, activeSort, stockFilter, visibleProducts.length],
    });
  const displayedProducts = visibleProducts.slice(0, visibleCount);
  const loadingSkeletonCount = isLoadingMore
    ? Math.min(PRODUCTS_BATCH_SIZE, Math.max(0, visibleProducts.length - visibleCount))
    : 0;

  function buildProductsHref({
    category = activeCategory,
    stock = stockFilter,
  }: {
    category?: string;
    stock?: boolean;
  } = {}) {
    const params = new URLSearchParams(searchParams.toString());
    if (!category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    if (!stock) {
      params.delete("stock");
    } else {
      params.set("stock", "in");
    }
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  function updateQueryParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (checkout !== "paystack" || !reference) return;
    const safeReference = reference;

    let isMounted = true;

    async function verifyPayment() {
      const response = await fetch(
        `/api/verify-paystack-payment?reference=${encodeURIComponent(safeReference)}`,
      ).catch(() => null);

      if (!isMounted) return;
      if (!response) {
        setPaymentFeedback("Could not verify the Paystack payment yet. Please check again shortly.");
        return;
      }

      const payload = await response.json().catch(() => ({}));
      setPaymentFeedback(payload?.message || payload?.error || "Payment update received.");
    }

    void verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <section className={cn("section", journeyStyles.page, journeyStyles.catalogPage)} id="products-grid">
      <Container className={journeyStyles.container}>
        <div className={cn(journeyStyles.shell, journeyStyles.catalogShell)}>
          <div className={journeyStyles.storeIntro}>
            <p className={journeyStyles.eyebrow}>{eyebrow}</p>
            <h1 className={journeyStyles.storeTitle}>{title}</h1>
            {intro ? <p className={journeyStyles.lead}>{intro}</p> : null}
            {stats.length > 0 ? (
              <div className={journeyStyles.stats}>
                {stats.map((item) => (
                  <div key={item.label} className={journeyStyles.stat}>
                    <strong className={journeyStyles.statValue}>{item.value}</strong>
                    <span className={journeyStyles.statLabel}>{item.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={journeyStyles.supportStrip}>
          <div className={journeyStyles.supportStripCopy}>
            <p className={journeyStyles.eyebrow}>Catalog guidance</p>
            <h2 className={journeyStyles.catalogTitle}>
              {activeCategory
                ? `Use ${visibleGroups[0]?.label.toLowerCase() || "this collection"} with the wider installation scope in mind`
                : "Start with your service scope, then narrow materials with more confidence"}
            </h2>
            <p className={journeyStyles.catalogFeedback}>
              {activeCategory
                ? `${visibleProducts.length} product${visibleProducts.length === 1 ? "" : "s"} currently match this collection view.`
                : `${visibleProducts.length} active products are grouped into ${groups.length} collections so product decisions can follow the real project path.`}
            </p>
          </div>
          <div className={journeyStyles.actions}>
            <Link href="/services" className="btn outline">
              Browse services
            </Link>
            <Link href="/quote" className="btn primary">
              Request guided quote
            </Link>
          </div>
        </div>

        <div className={journeyStyles.controlRow}>
          <nav className={journeyStyles.filterRail} aria-label="Browse product categories">
            <Link
              href={buildProductsHref({ category: "" })}
              className={cn(journeyStyles.filterChip, !activeCategory && journeyStyles.filterChipActive)}
              scroll={false}
            >
              All
            </Link>
            {groups.map((group) => (
              <Link
                key={group.key}
                href={buildProductsHref({ category: group.key })}
                className={cn(
                  journeyStyles.filterChip,
                  activeCategory === group.key && journeyStyles.filterChipActive,
                )}
                scroll={false}
              >
                {group.label}
              </Link>
            ))}
          </nav>

          <label className={journeyStyles.sortField} htmlFor="product-sort">
            Sort
            <select
              id="product-sort"
              className={journeyStyles.sortSelect}
              value={activeSort}
              onChange={(event) => updateQueryParam("sort", event.target.value === "featured" ? "" : event.target.value)}
            >
              <option value="featured">Featured first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A-Z</option>
            </select>
          </label>
        </div>

        {hasCatalogControls ? (
          <p className={journeyStyles.catalogReset}>
            <Link href="/products">Clear filter</Link>
          </p>
        ) : null}

        {paymentFeedback ? <p className={journeyStyles.catalogFeedback}>{paymentFeedback}</p> : null}
        {catalogError ? <p className={journeyStyles.catalogFeedback}>{catalogError}</p> : null}

        {visibleProducts.length === 0 ? (
          <div className={journeyStyles.emptyState}>
            <h2 className={journeyStyles.emptyTitle}>No products are showing here yet</h2>
            <p className={journeyStyles.emptyBody}>
              Try another filter or return to the full catalog while stock sync updates.
            </p>
          </div>
        ) : (
          <>
            <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridListing)}>
              {displayedProducts.map((item, index) => (
                <ProductCard key={item.id} product={item} variant="listing" priority={index < 4} />
              ))}

              {Array.from({ length: loadingSkeletonCount }).map((_, index) => (
                <article key={`product-card-skeleton-${index}`} className={cn(cardStyles.card, cardStyles.skeleton)} aria-hidden="true">
                  <div className={cn(cardStyles.media, cardStyles.skeletonMedia)}>
                    <div className={cardStyles.skeletonShimmer} />
                  </div>
                  <div className={cn(cardStyles.body, cardStyles.skeletonBody)}>
                    <span className={cn(cardStyles.skeletonLine, cardStyles.skeletonTitle)} />
                    <span className={cn(cardStyles.skeletonLine, cardStyles.skeletonPrice)} />
                  </div>
                </article>
              ))}
            </div>

            {hasMoreItems ? (
              <div className="infiniteScrollActions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={requestLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading more..." : "Load more products"}
                </button>
              </div>
            ) : null}

            {hasMoreItems ? <div ref={loadMoreRef} className="productCatalogLoadMore" aria-hidden="true" /> : null}
          </>
        )}

        {!activeCategory ? (
          <p className="productCatalogFootnote">
            {totalCategories} collections available. Open a collection for a more curated view.
          </p>
        ) : null}
      </Container>
    </section>
  );
}
