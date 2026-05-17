import Link from "next/link";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/components/products/ProductCategoryLandingPage.module.css";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import SmartImage from "@/components/ui/SmartImage";
import { type ProductCategoryLandingPage as ProductCategoryLandingPageData } from "@/data/product-category-landing-pages";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
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
          <section className={cn(journeyStyles.frame, styles.heroPanel)}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: category.h1 },
              ]}
            />

            <div className={styles.heroLayout}>
              <div className={styles.heroCopy}>
                <p className={journeyStyles.eyebrow}>Curated collection</p>
                <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>{category.h1}</h1>
                <p className={journeyStyles.lead}>{category.intro}</p>

                <div className={styles.heroSignals}>
                  <div className={styles.heroSignal}>
                    <strong>{matchingProducts.length}</strong>
                    <span>Live matching products</span>
                  </div>
                  <div className={styles.heroSignal}>
                    <strong>{category.products.length}</strong>
                    <span>Quick request picks</span>
                  </div>
                  <div className={styles.heroSignal}>
                    <strong>{CONTACT.whatsappResponseTime}</strong>
                    <span>WhatsApp response</span>
                  </div>
                </div>

                <div className={journeyStyles.actions}>
                  <Link href={category.collectionHref} className="btn primary">
                    Browse live collection
                  </Link>
                  <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn outline">
                    Request quote on WhatsApp
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
                  <span className={styles.heroCaptionMeta}>{matchingProducts.length} live products in this path</span>
                </div>
              </div>
            </div>
          </section>

          <section className={cn(journeyStyles.frame, styles.pickSection)}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionCopy}>
                <p className={journeyStyles.eyebrow}>Quick request picks</p>
                <h2 className={journeyStyles.catalogTitle}>Start with the most common requests</h2>
                <p className={journeyStyles.catalogFeedback}>
                  These are the item types people usually ask to price first before a full bundle quote.
                </p>
              </div>
              <a href={CONTACT_LINKS.phone} className={styles.sectionLink}>
                Call {CONTACT.phoneDisplay}
              </a>
            </div>

            <div className={styles.pickGrid}>
              {category.products.map((product, index) => (
                <article key={product.name} className={styles.pickCard}>
                  <div className={styles.pickMedia}>
                    <SmartImage
                      src={product.image}
                      alt={product.name}
                      fill
                      priority={index === 0}
                      className={styles.pickImage}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className={styles.pickBody}>
                    <h3 className={styles.pickTitle}>{product.name}</h3>
                    <p className={styles.pickDescription}>{product.description}</p>
                    <div className={journeyStyles.actions}>
                      <Link href={product.detailHref} className="btn outline">
                        View details
                      </Link>
                      <a
                        href={buildWhatsAppHref(product.quoteMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn primary"
                      >
                        Request on WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {matchingProducts.length > 0 ? (
            <section className={cn(journeyStyles.frame, styles.catalogSection)}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionCopy}>
                  <p className={journeyStyles.eyebrow}>Live catalog matches</p>
                  <h2 className={journeyStyles.catalogTitle}>Current products in this collection</h2>
                  <p className={journeyStyles.catalogFeedback}>
                    {matchingProducts.length} active product{matchingProducts.length === 1 ? "" : "s"} currently match this category.
                  </p>
                </div>
                <Link href={category.collectionHref} className={styles.sectionLink}>
                  Open full collection
                </Link>
              </div>

              <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridRelated)}>
                {matchingProducts.slice(0, 8).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="related"
                    showCategory
                    priority={index < 2}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className={cn(journeyStyles.frame, styles.supportBand)}>
            <div className={styles.supportCopy}>
              <p className={journeyStyles.eyebrow}>Supply and installation</p>
              <h2 className={journeyStyles.catalogTitle}>Need the right match for your project?</h2>
              <p className={styles.richCopy}>
                We can help narrow accessories, confirm compatibility, and align this material path with the right installation service before payment.
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
