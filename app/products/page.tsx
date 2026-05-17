import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductCard from "@/components/products/ProductCard";
import SmartImage from "@/components/ui/SmartImage";
import journeyStyles from "@/components/products/ProductJourney.module.css";
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

export const revalidate = 120;
export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Materials in Lagos | Product Catalog",
  description:
    "Browse verified electrical materials in Lagos from Oduzz Electrical Concept, including wiring and cables in Ikorodu, lighting, protection devices, solar and inverter accessories, and CCTV security products.",
  path: "/products",
  keywords: [
    "electrical materials in Lagos",
    "verified electrical materials",
    "authentic electrical products",
    "wiring and cables in Ikorodu",
    "lighting installation Lagos",
    "solar inverter installation Lagos",
  ],
  image: "/hero/lightings.webp",
});

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

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

function buildCategoryQuotePath(quoteFocus: string) {
  return `/quote?serviceType=${encodeURIComponent(quoteFocus)}`;
}

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
  }));
  const visibleCollections = categorySummaries.filter((category) => category.count > 0);
  const heroProduct =
    featuredProducts.find((item) => item.imageUrl) ?? featuredProducts[0] ?? catalog.items[0] ?? null;

  return (
    <>
      <JsonLd data={buildProductListSchema(catalog.items)} />

      <section className={cn("section", journeyStyles.page, journeyStyles.catalogPage)}>
        <Container className={journeyStyles.container}>
          <div className={journeyStyles.catalogStack}>
            <section className={cn(journeyStyles.frame, journeyStyles.heroPanel)}>
              <div className={journeyStyles.heroCopy}>
                <p className={journeyStyles.eyebrow}>Live product catalog</p>
                <h1 className={journeyStyles.display}>Verified electrical materials in Lagos</h1>
                <p className={journeyStyles.lead}>
                  Live products from our current catalog, arranged into cleaner collection paths
                  for sourcing, comparison, and faster project quoting.
                </p>

                <div className={journeyStyles.heroSignals} aria-label="Catalog highlights">
                  <div className={journeyStyles.heroSignal}>
                    <strong>{catalog.items.length}</strong>
                    <span>Live products</span>
                  </div>
                  <div className={journeyStyles.heroSignal}>
                    <strong>{visibleCollections.length}</strong>
                    <span>Active collections</span>
                  </div>
                </div>

                <p className={journeyStyles.heroNote}>Only currently published products appear here.</p>

                <div className={journeyStyles.actions}>
                  <Link href="#catalog-grid" className="btn primary">
                    Browse catalog
                  </Link>
                  <Link href="/quote" className={cn("btn", "outline", journeyStyles.secondaryAction)}>
                    Get a quote
                  </Link>
                </div>
              </div>

              <div className={journeyStyles.heroVisual}>
                <div className={journeyStyles.heroVisualMedia}>
                  {heroProduct?.imageUrl ? (
                    <SmartImage
                      src={heroProduct.imageUrl}
                      alt={heroProduct.name}
                      className={journeyStyles.heroVisualImage}
                      fill
                      priority
                      sizes="(max-width: 860px) 100vw, 42vw"
                    />
                  ) : (
                    <div className={journeyStyles.heroVisualFallback}>Oduzz Catalog</div>
                  )}
                </div>
                <div className={journeyStyles.heroVisualCaption}>
                  <span className={journeyStyles.heroVisualKicker}>
                    {heroProduct?.categoryLabel ?? "Live product"}
                  </span>
                  <strong className={journeyStyles.heroVisualName}>
                    {heroProduct?.name ?? "Admin uploaded product catalog"}
                  </strong>
                  <span className={journeyStyles.heroVisualMeta}>
                    {heroProduct ? formatProductPrice(heroProduct) : `${catalog.items.length} products live`}
                  </span>
                  <Link
                    href={heroProduct ? `/products/${heroProduct.slug}` : "#catalog-grid"}
                    className={journeyStyles.heroVisualLink}
                  >
                    View product
                  </Link>
                </div>
              </div>
            </section>

            {catalogError ? <p className={journeyStyles.catalogFeedback}>{catalogError}</p> : null}

            {categorySummaries.length > 0 ? (
              <section className={cn(journeyStyles.frame, journeyStyles.catalogSection)}>
                <div className={journeyStyles.sectionHead}>
                  <div className={journeyStyles.sectionCopy}>
                    <p className={journeyStyles.eyebrow}>Catalog categories</p>
                    <h2 className={journeyStyles.catalogTitle}>Browse by material path</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      Start with the material group you need, then move into the matching collection,
                      quote flow, or the full live catalog below.
                    </p>
                  </div>
                  <Link href="/quote" className={journeyStyles.sectionLink}>
                    Get sourcing help
                  </Link>
                </div>

                <nav className={journeyStyles.filterRail} aria-label="Browse product categories">
                  {categorySummaries.map((category) => (
                    <Link
                      key={category.key}
                      href={`#${category.key}`}
                      className={journeyStyles.filterChip}
                    >
                      {category.title}
                    </Link>
                  ))}
                  <Link href="#catalog-grid" className={cn(journeyStyles.filterChip, journeyStyles.filterChipActive)}>
                    All live products
                  </Link>
                </nav>

                <div className={journeyStyles.collectionGrid}>
                  {categorySummaries.map((category) => (
                    <article key={category.key} id={category.key} className={journeyStyles.collectionCard}>
                        <div className={journeyStyles.collectionCardMedia}>
                          {category.representativeProduct?.imageUrl ? (
                            <SmartImage
                              src={category.representativeProduct.imageUrl}
                              alt={category.title}
                              className={journeyStyles.collectionCardImage}
                              fill
                              sizes="(max-width: 767px) 100vw, (max-width: 1180px) 50vw, 25vw"
                            />
                          ) : (
                            <div className={journeyStyles.collectionFallback}>Oduzz</div>
                          )}
                        </div>
                        <div className={journeyStyles.collectionCardBody}>
                          <span className={journeyStyles.collectionCardCount}>
                            {category.count} product{category.count === 1 ? "" : "s"}
                          </span>
                          <h3 className={journeyStyles.collectionCardTitle}>{category.title}</h3>
                          <p className={journeyStyles.collectionLeadText}>{category.description}</p>
                          <p className={journeyStyles.collectionCardText}>{category.useCaseNote}</p>
                          <div className={journeyStyles.actions}>
                            <Link href={category.collectionPath} className="btn outline">
                              View collection
                            </Link>
                            <Link href={buildCategoryQuotePath(category.quoteFocus)} className="btn primary">
                              Request quote
                            </Link>
                          </div>
                        </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {featuredProducts.length > 0 ? (
              <section className={cn(journeyStyles.frame, journeyStyles.catalogSection)}>
                <div className={journeyStyles.sectionHead}>
                  <div className={journeyStyles.sectionCopy}>
                    <p className={journeyStyles.eyebrow}>Featured picks</p>
                    <h2 className={journeyStyles.catalogTitle}>Frequently requested products</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      A tighter shortlist of products buyers usually price first.
                    </p>
                  </div>
                  <Link href="#catalog-grid" className={journeyStyles.sectionLink}>
                    See all
                  </Link>
                </div>

                <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridRelated)}>
                  {featuredProducts.map((item, index) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      variant="related"
                      showCategory
                      priority={index < 2}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className={cn(journeyStyles.frame, journeyStyles.catalogSection)} id="catalog-grid">
                <div className={journeyStyles.sectionHead}>
                  <div className={journeyStyles.sectionCopy}>
                    <p className={journeyStyles.eyebrow}>Full catalog</p>
                    <h2 className={journeyStyles.catalogTitle}>All live products</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      Browse every product currently live in the catalog.
                    </p>
                  </div>
                  <Link href="/quote" className={journeyStyles.sectionLink}>
                    Bundle quote
                  </Link>
                </div>

              {catalog.items.length === 0 ? (
                <div className={journeyStyles.emptyState}>
                  <h2 className={journeyStyles.emptyTitle}>Catalog update in progress</h2>
                  <p className={journeyStyles.emptyBody}>
                    Products are currently syncing. You can still request a quote with your required
                    items and project location.
                  </p>
                  <div className={journeyStyles.actions}>
                    <Link href="/quote" className="btn primary">
                      Request quote
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridListing)}>
                  {catalog.items.map((item, index) => (
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
            </section>

            <section className={cn(journeyStyles.frame, journeyStyles.catalogSection)}>
              <div className={journeyStyles.sectionHead}>
                <div className={journeyStyles.sectionCopy}>
                  <p className={journeyStyles.eyebrow}>Trust signals</p>
                  <h2 className={journeyStyles.catalogTitle}>Proof-first buying support</h2>
                  <p className={journeyStyles.catalogFeedback}>
                    The goal is to reduce wrong material selection before money changes hands and to
                    make installation standards visible, not implied.
                  </p>
                </div>
                <Link href="/quote" className={journeyStyles.sectionLink}>
                  Request guided quote
                </Link>
              </div>

              <div className={journeyStyles.collectionGrid}>
                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>Material quality promise</span>
                    <h3 className={journeyStyles.collectionCardTitle}>Verified product guidance first</h3>
                    <p className={journeyStyles.collectionCardText}>
                      We help clients match cables, breakers, sockets, lighting, backup power items,
                      and security products to the real installation need before payment.
                    </p>
                  </div>
                </article>

                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>Before we leave site</span>
                    <h3 className={journeyStyles.collectionCardTitle}>Final checks are part of delivery</h3>
                    <p className={journeyStyles.collectionCardText}>
                      Visual finishing, functional testing, circuit confirmation, and handover review
                      are completed before the work is treated as done.
                    </p>
                  </div>
                </article>

                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>Before installation</span>
                    <h3 className={journeyStyles.collectionCardTitle}>We confirm route, load, and fit</h3>
                    <p className={journeyStyles.collectionCardText}>
                      Product fit, protection sizing, load intent, and site conditions are checked
                      early so the selected materials support a clean installation path.
                    </p>
                  </div>
                </article>

                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>Photo review</span>
                    <h3 className={journeyStyles.collectionCardTitle}>Why we ask for site details</h3>
                    <p className={journeyStyles.collectionCardText}>
                      Photos, layout notes, and location details improve quote accuracy, reduce wrong
                      purchases, and help us advise on installation compatibility sooner.
                    </p>
                  </div>
                </article>

                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>After-service placeholder</span>
                    <h3 className={journeyStyles.collectionCardTitle}>Workmanship terms will be published clearly</h3>
                    <p className={journeyStyles.collectionCardText}>
                      We have left this as a placeholder rather than inventing terms. The public policy
                      block can be updated when the final after-service wording is approved.
                    </p>
                  </div>
                </article>

                <article className={journeyStyles.collectionCard}>
                  <div className={journeyStyles.collectionCardBody}>
                    <span className={journeyStyles.collectionCardCount}>Registration placeholder</span>
                    <h3 className={journeyStyles.collectionCardTitle}>CAC details can be added without guesswork</h3>
                    <p className={journeyStyles.collectionCardText}>
                      This placeholder stays intentionally factual until the formal registration reference
                      is ready to be published on the site.
                    </p>
                    <div className={journeyStyles.actions}>
                      <Link href="/projects" className="btn outline">
                        See project proof
                      </Link>
                      <Link href="/quote" className="btn primary">
                        Request quote
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </Container>
      </section>
    </>
  );
}
