import Link from "next/link";
import type { Metadata } from "next";
import ProductCatalogView from "@/components/products/ProductCatalogView";
import SmartImage from "@/components/ui/SmartImage";
import JsonLd from "@/components/seo/JsonLd";
import { premiumCatalogCategories } from "@/data/premium-catalog-categories";
import {
  buildCollectionPath,
  buildProductCatalog,
  formatProductPrice,
  type Product,
  type ProductCategoryKey,
} from "@/lib/product-catalog";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";
import { buildMetadata } from "@/lib/seo";
import { buildProductListSchema } from "@/lib/structured-data";
import styles from "@/components/products/ProductsPage.module.css";

export const revalidate = 120;
export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Materials in Lagos | Product Catalog",
  description:
    "Browse verified electrical materials in Lagos from Oduzz Electrical Concept, including copper wiring, LED lighting, designer switches, and distribution supplies.",
  path: "/products",
  keywords: [
    "electrical materials in Lagos",
    "verified electrical materials",
    "authentic electrical products",
    "wiring and cables in Ikorodu",
    "lighting installation Lagos",
    "switches sockets Lagos",
  ],
  image: "/hero/lightings.webp",
});

function countProductsByCategoryKeys(products: Product[], categoryKeys: ProductCategoryKey[]) {
  const keySet = new Set(categoryKeys);
  return products.filter((item) => keySet.has(item.category as ProductCategoryKey)).length;
}

function pickFeaturedProducts(products: Product[], limit = 4) {
  const featured = products.filter((item) => item.featured);
  const nonFeatured = products.filter((item) => !item.featured);
  return [...featured, ...nonFeatured].slice(0, limit);
}

function pickRepresentativeProduct(products: Product[], categoryKeys: ProductCategoryKey[]) {
  const keySet = new Set(categoryKeys);

  return (
    products.find((item) => keySet.has(item.category as ProductCategoryKey) && item.imageUrl) ??
    products.find((item) => keySet.has(item.category as ProductCategoryKey)) ??
    null
  );
}

const CATEGORY_PUNCHY_TAGLINES: Record<string, string> = {
  "wiring-cables": "Pure copper cables & coils certified for residential and commercial circuits.",
  "switches-sockets": "Premium flush-mount wall sockets, rocker switches, and plates.",
  "lighting": "Energy-efficient surface & recessed LED lighting for clean modern finish.",
  "protection-devices": "Certified circuit breakers, distribution boards, and surge protection.",
  "solar-inverter-accessories": "Inverters, deep-cycle batteries, and backup power accessories.",
  "cctv-security": "Surveillance cameras, DVRs, NVRs, and security accessories.",
  "conduits-trunking-installation": "Heavy-duty conduits, trunking routes, and installation fittings.",
};

export default async function ProductsPage() {
  const { products, error, source } = await fetchOnlineProductsCached();
  const catalog = buildProductCatalog(products);
  const catalogError = source === "starter" ? "" : error?.message ?? "";
  const featuredProducts = pickFeaturedProducts(catalog.items, 4);

  const categorySummaries = premiumCatalogCategories.map((category) => ({
    ...category,
    count: countProductsByCategoryKeys(catalog.items, category.collectionKeys),
    collectionPath: buildCollectionPath(category.primaryCollectionKey),
    representativeProduct: pickRepresentativeProduct(catalog.items, category.collectionKeys),
    shortTagline: CATEGORY_PUNCHY_TAGLINES[category.key] || category.description,
  }));

  // Only show categories that currently have live products in stock
  const activeCollections = categorySummaries.filter((category) => category.count > 0);

  const heroProduct =
    featuredProducts.find((item) => item.imageUrl) ?? featuredProducts[0] ?? catalog.items[0] ?? null;

  return (
    <div className={styles.page}>
      <JsonLd data={buildProductListSchema(catalog.items)} />

      {/* 1. HERO SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrowBadge}>⚡ Genuine Electrical Materials</span>
              <h1 className={styles.heroTitle}>Verified Electrical Materials in Lagos</h1>
              <p className={styles.heroLead}>
                Direct pricing on certified copper cables, lighting, and switches. Sourced directly
                from verified manufacturers with prompt site delivery across Lagos.
              </p>

              <div className={styles.heroTrustList}>
                <span className={styles.trustChip}>
                  <span className={styles.trustChipIcon}>✓</span> 100% Pure Copper Conductor
                </span>
                <span className={styles.trustChip}>
                  <span className={styles.trustChipIcon}>✓</span> Same-Day / Next-Day Lagos Dispatch
                </span>
                <span className={styles.trustChip}>
                  <span className={styles.trustChipIcon}>✓</span> Contractor BOQ Pricing
                </span>
              </div>

              <div className={styles.heroActions}>
                <Link href="#catalog-grid" className={styles.browseBtn}>
                  Browse Catalog ({catalog.items.length}) ↓
                </Link>
                <Link href="/quote" className={styles.quoteBtn}>
                  Request BOQ Quote →
                </Link>
              </div>
            </div>

            {/* Featured Product Spotlight */}
            {heroProduct ? (
              <div className={styles.heroSpotlight}>
                <div className={styles.spotlightMedia}>
                  <span className={styles.spotlightTag}>Featured Product</span>
                  {heroProduct.imageUrl ? (
                    <SmartImage
                      src={heroProduct.imageUrl}
                      alt={heroProduct.name}
                      fill
                      priority
                      className={styles.spotlightImage}
                      sizes="(max-width: 860px) 100vw, 42vw"
                    />
                  ) : null}
                </div>
                <div className={styles.spotlightContent}>
                  <div className={styles.spotlightMetaRow}>
                    <span className={styles.spotlightCategory}>
                      {heroProduct.categoryLabel || "Verified Product"}
                    </span>
                    <strong className={styles.spotlightPrice}>
                      {formatProductPrice(heroProduct)}
                    </strong>
                  </div>
                  <h3 className={styles.spotlightTitle}>{heroProduct.name}</h3>
                  <Link
                    href={`/products/${heroProduct.slug}`}
                    className={styles.spotlightLink}
                  >
                    View Product Details →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 2. ACTIVE CATEGORIES (Visual & Concise, Empty Categories Filtered Out) */}
      {activeCollections.length > 0 ? (
        <section className={styles.sectionBlock}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderCopy}>
                <p className={styles.sectionEyebrow}>Product Categories</p>
                <h2 className={styles.sectionTitle}>Shop by Category</h2>
                <p className={styles.sectionSubtitle}>
                  Explore verified electrical materials organized by installation scope.
                </p>
              </div>
              <Link href="/quote" className={styles.spotlightLink}>
                Get Material Advice →
              </Link>
            </div>

            <div className={styles.categoryGrid}>
              {activeCollections.map((category) => (
                <Link
                  key={category.key}
                  href={category.collectionPath}
                  className={styles.categoryCard}
                >
                  <div className={styles.categoryCardMedia}>
                    {category.representativeProduct?.imageUrl ? (
                      <SmartImage
                        src={category.representativeProduct.imageUrl}
                        alt={category.title}
                        fill
                        className={styles.categoryCardImage}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className={styles.categoryCardBody}>
                    <div className={styles.categoryCardHeader}>
                      <h3 className={styles.categoryCardTitle}>{category.title}</h3>
                      <span className={styles.categoryCountBadge}>
                        {category.count} Item{category.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className={styles.categoryCardDescription}>
                      {category.shortTagline}
                    </p>
                    <div className={styles.categoryActionRow}>
                      <span className={styles.categoryActionLink}>
                        Explore Collection →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Custom Sourcing Callout for Unlisted Categories (Breakers, Solar, CCTV, Trunking) */}
            <div className={styles.customSourcingBanner}>
              <div className={styles.customSourcingCopy}>
                <span className={styles.customSourcingIcon} aria-hidden="true">
                  📋
                </span>
                <div>
                  <h4 className={styles.customSourcingHeading}>
                    Need Circuit Breakers, Solar Inverters, Conduits, or CCTV?
                  </h4>
                  <p className={styles.customSourcingText}>
                    We supply Schneider & Chint breakers, distribution panels, Felicity solar gear,
                    and conduit routes direct to your project BOQ specifications.
                  </p>
                </div>
              </div>
              <Link href="/quote" className={styles.customSourcingBtn}>
                Request Custom Sourcing →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. CORE MATERIALS CATALOG (Interactive Search, Sort, Cart & WhatsApp) */}
      <section className={styles.catalogContainer} id="catalog-grid">
        <div className={styles.container}>
          <div className={styles.catalogFrame}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderCopy}>
                <p className={styles.sectionEyebrow}>Live Inventory</p>
                <h2 className={styles.sectionTitle}>Materials Directory</h2>
                <p className={styles.sectionSubtitle}>
                  Search by brand, size, or rating. Order online or request direct site supply.
                </p>
              </div>
              <Link href="/quote" className={styles.spotlightLink}>
                Upload Material Schedule →
              </Link>
            </div>

            {catalogError ? (
              <p style={{ color: "#ef4444", marginBottom: 16 }}>{catalogError}</p>
            ) : null}

            <ProductCatalogView
              products={catalog.items}
              categories={activeCollections}
            />
          </div>
        </div>
      </section>

      {/* 4. TRUST & LOGISTICS STRIP (Lean 4-Pillar Grid, Not Text-Heavy) */}
      <section className={styles.trustRibbon}>
        <div className={styles.container}>
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <span className={styles.trustCardIcon} aria-hidden="true">
                ⚡
              </span>
              <h3 className={styles.trustCardTitle}>100% Tested Materials</h3>
              <p className={styles.trustCardText}>
                Certified pure copper conductors and standard-compliant switchgear with zero counterfeit risk.
              </p>
            </div>

            <div className={styles.trustCard}>
              <span className={styles.trustCardIcon} aria-hidden="true">
                🚚
              </span>
              <h3 className={styles.trustCardTitle}>Lagos Site Dispatch</h3>
              <p className={styles.trustCardText}>
                Prompt direct-to-site delivery across Lagos Mainland, Island, Lekki, and Ikorodu.
              </p>
            </div>

            <div className={styles.trustCard}>
              <span className={styles.trustCardIcon} aria-hidden="true">
                📊
              </span>
              <h3 className={styles.trustCardTitle}>Contractor BOQ Pricing</h3>
              <p className={styles.trustCardText}>
                Transparent per-unit pricing on comprehensive building material schedules within 24 hours.
              </p>
            </div>

            <div className={styles.trustCard}>
              <span className={styles.trustCardIcon} aria-hidden="true">
                🛠️
              </span>
              <h3 className={styles.trustCardTitle}>Technical Verification</h3>
              <p className={styles.trustCardText}>
                Qualified electricians confirm cable gauge, breaker ratings, and load compatibility before checkout.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
