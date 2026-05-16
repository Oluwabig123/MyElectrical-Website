import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductCard from "@/components/products/ProductCard";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import JsonLd from "@/components/seo/JsonLd";
import { googleBusinessProfileProductUrls } from "@/data/product-category-landing-pages";
import { premiumCatalogCategories } from "@/data/premium-catalog-categories";
import { buildProductCatalog, type Product, type ProductCategoryKey } from "@/lib/product-catalog";
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

function pickFeaturedProducts(products: Product[], limit = 8) {
  const featured = products.filter((item) => item.featured);
  const nonFeatured = products.filter((item) => !item.featured);
  return [...featured, ...nonFeatured].slice(0, limit);
}

export default async function ProductsPage() {
  const { products, error, source } = await fetchOnlineProductsCached();
  const catalog = buildProductCatalog(products);
  const catalogError = source === "starter" ? "" : (error?.message ?? "");
  const featuredProducts = pickFeaturedProducts(catalog.items, 8);
  const categorySummaries = premiumCatalogCategories.map((category) => ({
    ...category,
    count: countProductsByCategoryKeys(catalog.items, category.collectionKeys),
  }));

  return (
    <>
      <JsonLd data={buildProductListSchema(catalog.items)} />

      <section className={cn("section", journeyStyles.page, journeyStyles.catalogPage)} id="products-grid">
        <Container className={journeyStyles.container}>
          <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
            <div className="productCollectionHero">
              <div className="productCollectionHeroCopy">
                <p className={journeyStyles.eyebrow}>Premium catalog</p>
                <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>
                  Verified electrical materials in Lagos
                </h1>
                <p className={cn(journeyStyles.lead, "productCollectionHeroLead")}>
                  Review real products with practical context before procurement. Every listing is
                  organized to support electrical installation in Lagos with clearer category paths,
                  compatibility guidance, and quote support.
                </p>
                <div className={journeyStyles.actions}>
                  <Link href="/quote" className="btn primary">
                    Request project quote
                  </Link>
                  <Link href="/products/cables-wires" className="btn outline">
                    Start with wiring & cables
                  </Link>
                </div>
              </div>

              <div className={journeyStyles.stats}>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{catalog.items.length}</strong>
                  <span className={journeyStyles.statLabel}>Active products</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{premiumCatalogCategories.length}</strong>
                  <span className={journeyStyles.statLabel}>Catalog categories</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{featuredProducts.length}</strong>
                  <span className={journeyStyles.statLabel}>Featured selections</span>
                </div>
              </div>
            </div>

            <div className={journeyStyles.controlRow}>
              <nav className={journeyStyles.filterRail} aria-label="Browse product categories">
                <Link href="#catalog-grid" className={cn(journeyStyles.filterChip, journeyStyles.filterChipActive)}>
                  All products
                </Link>
                {premiumCatalogCategories.map((category) => (
                  <Link
                    key={category.key}
                    href={category.landingPath}
                    className={journeyStyles.filterChip}
                  >
                    {category.title}
                  </Link>
                ))}
              </nav>
            </div>

            <section className="seoContentSection">
              <div className="seoContentCard">
                <div className={journeyStyles.catalogToolbar}>
                  <div className={journeyStyles.catalogToolbarCopy}>
                    <p className={journeyStyles.eyebrow}>Category directory</p>
                    <h2 className={journeyStyles.catalogTitle}>Browse the premium catalog by use case</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      Each category includes a clear purpose note, live product count, and direct
                      route to collection pages or quote support.
                    </p>
                  </div>
                </div>

                <div className="seoCardGrid">
                  {categorySummaries.map((category) => (
                    <article key={category.key} className="card seoInfoCard">
                      <h3 className="cardTitle">{category.title}</h3>
                      <p className="p">{category.description}</p>
                      <p className="seoMetaLine">
                        {category.count} product{category.count === 1 ? "" : "s"} currently listed
                      </p>
                      <p className="p">Use-case note: {category.useCaseNote}</p>
                      <div className="seoActionRow">
                        <Link href={category.landingPath} className="btn outline">
                          View landing page
                        </Link>
                        <Link
                          href={`/quote?serviceType=${encodeURIComponent(category.quoteFocus)}`}
                          className="btn primary"
                        >
                          Request quote
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="seoContentSection">
              <div className="seoContentCard">
                <div className={journeyStyles.catalogToolbar}>
                  <div className={journeyStyles.catalogToolbarCopy}>
                    <p className={journeyStyles.eyebrow}>Featured picks</p>
                    <h2 className={journeyStyles.catalogTitle}>Frequently requested products</h2>
                  </div>
                  <Link href="/quote" className={journeyStyles.catalogReset}>
                    Need procurement support?
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
              </div>
            </section>

            {catalogError ? <p className={journeyStyles.catalogFeedback}>{catalogError}</p> : null}

            <section className="seoContentSection" id="catalog-grid">
              <div className="seoContentCard">
                <div className={journeyStyles.catalogToolbar}>
                  <div className={journeyStyles.catalogToolbarCopy}>
                    <p className={journeyStyles.eyebrow}>Full catalog</p>
                    <h2 className={journeyStyles.catalogTitle}>All products</h2>
                    <p className={journeyStyles.catalogFeedback}>
                      Product names, categories, descriptions, prices, availability, and internal links
                      are fully visible here for crawlability and easier comparison.
                    </p>
                  </div>
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
              </div>
            </section>

            <section className="seoContentSection">
              <div className="seoContentCard">
                <p className={journeyStyles.eyebrow}>Trust and process</p>
                <h2 className="h2">Proof-first trust signals</h2>

                <div className="seoCardGrid">
                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">Material Quality Promise</h3>
                    <p className="p">
                      We prioritize verified electrical materials and explain where each item fits in
                      your installation plan before payment confirmation.
                    </p>
                  </article>

                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">What We Check Before Installation</h3>
                    <p className="p">
                      Circuit load intent, routing pathway, protection matching, and accessory
                      compatibility are reviewed before site execution starts.
                    </p>
                  </article>

                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">Before We Leave Site Checklist</h3>
                    <p className="p">
                      Visual finishing check, functional test, circuit label verification, and client
                      walk-through are completed before handover.
                    </p>
                  </article>

                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">Why We Ask for Photos and Site Details</h3>
                    <p className="p">
                      Photos and layout context reduce wrong material selection, improve quote accuracy,
                      and shorten back-and-forth during planning.
                    </p>
                  </article>

                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">Workmanship and After-Service Policy</h3>
                    <p className="p">
                      Policy placeholder: detailed workmanship and after-service terms will be
                      published here for transparent client reference.
                    </p>
                  </article>

                  <article className="card seoInfoCard">
                    <h3 className="cardTitle">Business Registration Disclosure</h3>
                    <p className="p">
                      CAC or registration details placeholder: official business registration reference
                      will be shown here without assumptions.
                    </p>
                  </article>
                </div>

                <div className="seoActionRow">
                  <Link href="/projects" className="btn outline">
                    See project proof
                  </Link>
                  <Link href="/quote" className="btn primary">
                    Request guided quote
                  </Link>
                </div>
              </div>
            </section>

            <section className="seoContentSection">
              <div className="seoContentCard">
                <p className={journeyStyles.eyebrow}>Google Business Profile</p>
                <h2 className="h2">Product URLs for local product listings</h2>
                <p className={journeyStyles.catalogFeedback}>
                  Use these category landing pages for Google Business Profile products so each item
                  sends local product traffic to the most relevant page.
                </p>

                <div className="seoCardGrid">
                  {googleBusinessProfileProductUrls.map((item) => (
                    <article key={item.product} className="card seoInfoCard">
                      <h3 className="cardTitle">{item.product}</h3>
                      <p className="seoMetaLine">{item.url}</p>
                      <Link href={item.path} className="btn outline">
                        Open landing page
                      </Link>
                    </article>
                  ))}
                </div>

                <div className="seoActionRow">
                  <a href="/google-business-profile-product-urls.csv" className="btn primary">
                    Download GBP URL export
                  </a>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </section>
    </>
  );
}
