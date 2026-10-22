import Link from "next/link";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/components/products/ProductCategoryLandingPage.module.css";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import SmartImage from "@/components/ui/SmartImage";
import { type ProductCategoryLandingPage as ProductCategoryLandingPageData } from "@/data/product-category-landing-pages";
import { CONTACT_LINKS } from "@/data/contact";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";
import { buildProductCatalog } from "@/lib/product-catalog";

type ProductCategoryLandingPageProps = {
  category: ProductCategoryLandingPageData;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function buildWhatsAppHref(message: string) {
  return `${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(message)}`;
}

export default async function ProductCategoryLandingPage({
  category,
}: ProductCategoryLandingPageProps) {
  const { products } = await fetchOnlineProductsCached();
  const catalog = buildProductCatalog(products);
  const categoryKeySet = new Set<string>(category.categoryKeys);
  const matchingProducts = catalog.items.filter((product) => categoryKeySet.has(product.category));
  const categoryQuoteHref = buildWhatsAppHref(category.quoteMessage);
  const heroProduct = matchingProducts.find((product) => product.imageUrl) ?? matchingProducts[0] ?? null;

  return (
    <section className={cn("section", journeyStyles.page, journeyStyles.catalogPage)}>
      <Container className={journeyStyles.container}>
        <div className={journeyStyles.catalogStack}>
          {/* 1. HERO SECTION (Unboxed, No Subtle Inner Box) */}
          <section className={styles.heroPanel}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: category.h1 },
              ]}
            />

            <div className={styles.heroLayout}>
              <div className={styles.heroCopy}>
                <p className={journeyStyles.eyebrow}>Verified Electrical Supply</p>
                <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>{category.h1}</h1>
                <p className={journeyStyles.lead}>{category.intro}</p>

                <div className={styles.heroSignals}>
                  <div className={styles.heroSignal}>
                    <strong>{matchingProducts.length}</strong>
                    <span>Live matching products</span>
                  </div>
                  <div className={styles.heroSignal}>
                    <strong>100%</strong>
                    <span>Tested & Certified</span>
                  </div>
                  <div className={styles.heroSignal}>
                    <strong>Prompt</strong>
                    <span>Lagos Dispatch</span>
                  </div>
                </div>

                <div className={journeyStyles.actions}>
                  <Link href="#catalog-section" className="btn primary">
                    Browse verified items ({matchingProducts.length}) ↓
                  </Link>
                  <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn outline">
                    Request BOQ on WhatsApp
                  </a>
                </div>
              </div>

              <div className={styles.heroVisual}>
                <div className={styles.heroMedia}>
                  <SmartImage
                    src={heroProduct?.imageUrl || category.heroImage}
                    alt={category.h1}
                    fill
                    priority
                    className={styles.heroImage}
                    sizes="(max-width: 920px) 100vw, 44vw"
                  />
                </div>
                <div className={styles.heroCaption}>
                  <span className={styles.heroCaptionKicker}>{heroProduct?.categoryLabel || "Collection preview"}</span>
                  <strong className={styles.heroCaptionTitle}>{heroProduct?.name || category.h1}</strong>
                  <span className={styles.heroCaptionMeta}>
                    {matchingProducts.length > 0
                      ? `${matchingProducts.length} live products in this path`
                      : "Direct manufacturer supply to BOQ schedule"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. REAL MATCHING PRODUCTS (Uses the Exact ProductCard Reference - Image 3) */}
          <section className={styles.catalogSection} id="catalog-section">
            <div className={styles.sectionHead}>
              <div className={styles.sectionCopy}>
                <p className={journeyStyles.eyebrow}>Verified Materials</p>
                <h2 className={journeyStyles.catalogTitle}>Available In-Stock Products</h2>
                <p className={journeyStyles.catalogFeedback}>
                  {matchingProducts.length > 0
                    ? `Order online or request job-site delivery across Lagos.`
                    : `We supply this category direct to contractor BOQ specifications with engineer verification.`}
                </p>
              </div>
              <Link href="/products" className={styles.sectionLink}>
                View all products →
              </Link>
            </div>

            {matchingProducts.length > 0 ? (
              <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridListing)}>
                {matchingProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="listing"
                    showCategory
                    priority={index < 2}
                  />
                ))}
              </div>
            ) : (
              <div className={journeyStyles.emptyState} style={{ padding: "32px 24px", textAlign: "center" }}>
                <h3 style={{ fontSize: 18, color: "#fff", marginBottom: 8 }}>
                  Custom Supply & BOQ Sourcing Available
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: "56ch", margin: "0 auto 20px" }}>
                  This material group is supplied directly to your architectural drawings or bill of quantities.
                  Send your schedule to get transparent per-unit contractor pricing within 24 hours.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn primary">
                    Request Sourcing on WhatsApp
                  </a>
                  <Link href="/quote" className="btn outline">
                    Submit Material Schedule
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 3. SUPPLY AND INSTALLATION SUPPORT */}
          <section className={styles.supportBand}>
            <div className={styles.supportCopy}>
              <p className={journeyStyles.eyebrow}>Supply and installation</p>
              <h2 className={journeyStyles.catalogTitle}>Need the right match for your project?</h2>
              <p className={styles.richCopy}>
                We help verify cable gauge, breaker ratings, conduit routing, and site compatibility before payment.
              </p>
            </div>
            <div className={styles.supportActions}>
              <div className={styles.serviceLinks}>
                {category.relatedServices.map((service) => (
                  <Link key={`${service.label}-${service.href}`} href={service.href} className={styles.serviceChip}>
                    {service.label}
                  </Link>
                ))}
              </div>
              <div className={journeyStyles.actions}>
                <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn primary">
                  Request quote on WhatsApp
                </a>
                <Link href="/quote" className="btn outline">
                  Open quote form
                </Link>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </section>
  );
}
