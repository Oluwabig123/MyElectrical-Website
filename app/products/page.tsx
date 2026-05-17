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
  const quietCollections = categorySummaries.filter((category) => category.count === 0);
  const leadCollection = visibleCollections[0] ?? null;
  const secondaryCollections = visibleCollections.slice(leadCollection ? 1 : 0, 6);
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

            {visibleCollections.length > 0 ? (
              <section className={cn(journeyStyles.frame, journeyStyles.catalogSection)}>
                <div className={journeyStyles.sectionHead}>
                  <div className={journeyStyles.sectionCopy}>
                    <p className={journeyStyles.eyebrow}>Collection directory</p>
                    <h2 className={journeyStyles.catalogTitle}>Browse by collection</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      Start with the material group you need, then move into the live product list.
                    </p>
                  </div>
                  <Link href="/quote" className={journeyStyles.sectionLink}>
                    Get sourcing help
                  </Link>
                </div>

                <div className={journeyStyles.collectionStudio}>
                  {leadCollection ? (
                    <Link href={leadCollection.collectionPath} className={journeyStyles.collectionLead}>
                      <div className={journeyStyles.collectionLeadMedia}>
                        {leadCollection.representativeProduct?.imageUrl ? (
                          <SmartImage
                            src={leadCollection.representativeProduct.imageUrl}
                            alt={leadCollection.title}
                            className={journeyStyles.collectionLeadImage}
                            fill
                            sizes="(max-width: 980px) 100vw, 52vw"
                          />
                        ) : (
                          <div className={journeyStyles.collectionFallback}>Oduzz</div>
                        )}
                      </div>
                      <div className={journeyStyles.collectionLeadBody}>
                        <span className={journeyStyles.collectionLeadCount}>
                          {leadCollection.count} product{leadCollection.count === 1 ? "" : "s"}
                        </span>
                        <h3 className={journeyStyles.collectionLeadTitle}>{leadCollection.title}</h3>
                        <p className={journeyStyles.collectionLeadText}>{leadCollection.description}</p>
                        <span className={journeyStyles.collectionLeadAction}>Open collection</span>
                      </div>
                    </Link>
                  ) : null}

                  <div className={journeyStyles.collectionGrid}>
                    {secondaryCollections.map((category) => (
                      <Link key={category.key} href={category.collectionPath} className={journeyStyles.collectionCard}>
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
                          <p className={journeyStyles.collectionCardText}>{category.useCaseNote}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {quietCollections.length > 0 ? (
                  <div className={journeyStyles.collectionQuiet}>
                    <p className={journeyStyles.collectionQuietLabel}>Collections being stocked next</p>
                    <div className={journeyStyles.collectionQuietChips}>
                      {quietCollections.map((category) => (
                        <span key={category.key} className={journeyStyles.collectionQuietChip}>
                          {category.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
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
          </div>
        </Container>
      </section>
    </>
  );
}
