"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import { useCart } from "@/lib/cart-context";
import { type Product, type ProductCategoryKey } from "@/lib/product-catalog";
import styles from "./ProductCatalogView.module.css";

type CategorySummary = {
  key: string;
  title: string;
  count: number;
  collectionKeys: ProductCategoryKey[];
};

type ProductCatalogViewProps = {
  products: Product[];
  categories: CategorySummary[];
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function ProductCatalogView({
  products,
  categories,
}: ProductCatalogViewProps) {
  const { clearCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reference = (params.get("reference") || params.get("trxref") || "").trim();
    if (!reference) return;

    let cancelled = false;
    setPaymentBanner({
      type: "info",
      message: `Verifying payment reference ${reference}...`,
    });

    fetch(`/api/verify-paystack-payment?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.verified) {
          clearCart();
          setPaymentBanner({
            type: "success",
            message: `Payment confirmed (Ref: ${reference}). Our dispatch team will contact you shortly.`,
          });
        } else {
          setPaymentBanner({
            type: "error",
            message:
              data?.message ||
              data?.error ||
              "Payment could not be verified yet. Your cart items have been preserved.",
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPaymentBanner({
          type: "error",
          message: "Could not verify payment status right now. Please contact support with your reference.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [clearCart]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryKey === "all") return null;
    return categories.find((cat) => cat.key === selectedCategoryKey) ?? null;
  }, [categories, selectedCategoryKey]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Category
    if (selectedCategory) {
      const allowedKeys = new Set(selectedCategory.collectionKeys);
      list = list.filter((item) => allowedKeys.has(item.category as ProductCategoryKey));
    }

    // Filter by Stock
    if (inStockOnly) {
      list = list.filter((item) => item.isActive && (item.stockQty > 0 || item.stockQty === undefined));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q) ||
          item.bestFor.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.priceAmount - b.priceAmount;
      }
      if (sortBy === "price-desc") {
        return b.priceAmount - a.priceAmount;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // featured default
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    return list;
  }, [inStockOnly, products, searchQuery, selectedCategory, sortBy]);

  function handleReset() {
    setSearchQuery("");
    setSelectedCategoryKey("all");
    setSortBy("featured");
    setInStockOnly(false);
  }

  return (
    <div className={styles.catalogFilterWrap}>
      {paymentBanner ? (
        <p className={`formStatus ${paymentBanner.type}`} style={{ marginBottom: 16 }}>
          {paymentBanner.message}
        </p>
      ) : null}
      {/* Search and Sort Toolbar */}
      <div className={styles.searchAndSortBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon} aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search cables, breaker ratings, lighting, inverters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search electrical products"
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className={styles.sortBox}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="featured">Featured Picks</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Category Pills Rail */}
      <nav className={styles.categoryPillRail} aria-label="Product categories">
        <button
          type="button"
          className={`${styles.categoryPill} ${
            selectedCategoryKey === "all" ? styles.categoryPillActive : ""
          }`}
          onClick={() => setSelectedCategoryKey("all")}
        >
          All Materials <span className={styles.pillBadge}>{products.length}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`${styles.categoryPill} ${
              selectedCategoryKey === cat.key ? styles.categoryPillActive : ""
            }`}
            onClick={() => setSelectedCategoryKey(cat.key)}
          >
            {cat.title} <span className={styles.pillBadge}>{cat.count}</span>
          </button>
        ))}
      </nav>

      {/* Filter Status Line */}
      {(searchQuery || selectedCategoryKey !== "all" || inStockOnly) ? (
        <div className={styles.activeFiltersStatus}>
          <span>
            Showing {filteredProducts.length} of {products.length} products
            {selectedCategory ? ` in ${selectedCategory.title}` : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </span>
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            Reset filters
          </button>
        </div>
      ) : null}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            🔎
          </div>
          <h3 className={styles.emptyTitle}>No matching materials found</h3>
          <p className={styles.emptyText}>
            Try clearing your search query or choosing another category.
          </p>
          <button type="button" className="btn outline" onClick={handleReset}>
            View All Materials
          </button>
        </div>
      ) : (
        <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridListing)}>
          {filteredProducts.map((item, index) => (
            <ProductCard
              key={item.id}
              product={item}
              variant="listing"
              showCategory
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
