import Link from "next/link";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
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
  const matchingProducts = catalog.items.filter((product) =>
    categoryKeySet.has(product.category),
  );
  const categoryQuoteHref = buildWhatsAppHref(category.quoteMessage);

  return (
    <section className={cn("section", journeyStyles.page, journeyStyles.catalogPage)}>
      <Container className={journeyStyles.container}>
        <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
          <ProductBreadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: category.h1 },
            ]}
          />

          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={journeyStyles.eyebrow}>Google product landing page</p>
              <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>
                {category.h1}
              </h1>
              <p className={journeyStyles.lead}>{category.intro}</p>
              <div className={journeyStyles.actions}>
                <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn primary">
                  Request Quote on WhatsApp
                </a>
                <a href={CONTACT_LINKS.phone} className="btn outline">
                  Call {CONTACT.phoneDisplay}
                </a>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <SmartImage
                src={category.heroImage}
                alt={category.h1}
                fill
                priority
                className={styles.heroImage}
                sizes="(max-width: 920px) 100vw, 44vw"
              />
            </div>
          </div>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHead}>
              <p className={journeyStyles.eyebrow}>Products</p>
              <h2 className={journeyStyles.catalogTitle}>Request price and availability</h2>
              <p className={journeyStyles.catalogFeedback}>
                Each product inquiry opens WhatsApp with the right category context, so Google Business
                Profile traffic lands on a relevant product page instead of the homepage.
              </p>
            </div>

            <div className={styles.productGrid}>
              {category.products.map((product, index) => (
                <article key={product.name} className={styles.productCard}>
                  <div className={styles.productMedia}>
                    <SmartImage
                      src={product.image}
                      alt={product.name}
                      fill
                      priority={index === 0}
                      className={styles.productImage}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className={styles.productBody}>
                    <h3 className={styles.productTitle}>{product.name}</h3>
                    <p className={styles.productDescription}>{product.description}</p>
                    <strong className={styles.priceLabel}>Request price</strong>
                    <div className={styles.cardActions}>
                      <Link href={product.detailHref} className="btn outline">
                        View details
                      </Link>
                      <a
                        href={buildWhatsAppHref(product.quoteMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn primary"
                      >
                        Request Quote on WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {matchingProducts.length > 0 ? (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHead}>
                <p className={journeyStyles.eyebrow}>Live catalog matches</p>
                <h2 className={journeyStyles.catalogTitle}>Current related items</h2>
                <p className={journeyStyles.catalogFeedback}>
                  {matchingProducts.length} active product{matchingProducts.length === 1 ? "" : "s"} currently match this category.
                </p>
              </div>
              <div className={styles.linkGrid}>
                {matchingProducts.slice(0, 8).map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className={styles.inlineLinkCard}>
                    <span>{product.name}</span>
                    <small>{product.categoryLabel}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.sectionBlock}>
            <div className={styles.splitBlock}>
              <div>
                <p className={journeyStyles.eyebrow}>Supply and installation</p>
                <h2 className={journeyStyles.catalogTitle}>Products supplied with installation support</h2>
              </div>
              <p className={styles.richCopy}>
                Oduzz Electrical Concept supplies quality electrical materials and also handles
                professional installation, load planning, wiring, lighting, solar/inverter setup, CCTV,
                smart home installation, and electrical protection for homes, offices, shops, estates,
                and commercial projects across Lagos.
              </p>
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <div className={styles.splitBlock}>
              <div>
                <p className={journeyStyles.eyebrow}>Related services</p>
                <h2 className={journeyStyles.catalogTitle}>Installation paths for this product category</h2>
              </div>
              <div className={styles.serviceLinks}>
                {category.relatedServices.map((service) => (
                  <Link key={`${service.label}-${service.href}`} href={service.href} className="btn outline">
                    {service.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className={cn(styles.sectionBlock, styles.trustBlock)}>
            <div className={styles.splitBlock}>
              <div>
                <p className={journeyStyles.eyebrow}>Trust and conversion</p>
                <h2 className={journeyStyles.catalogTitle}>
                  Need help choosing the right electrical material?
                </h2>
              </div>
              <div className={styles.trustCopy}>
                <p>
                  Choosing the wrong cable, breaker, socket, inverter component, lighting product,
                  CCTV device, or smart home accessory can affect safety and performance. Oduzz
                  Electrical Concept helps clients choose quality electrical materials and also
                  provides professional installation across Lagos.
                </p>
                <div className={journeyStyles.actions}>
                  <a href={categoryQuoteHref} target="_blank" rel="noreferrer" className="btn primary">
                    Request Quote on WhatsApp
                  </a>
                  <a href={CONTACT_LINKS.phone} className="btn outline">
                    Call {CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <div className={styles.splitBlock}>
              <div>
                <p className={journeyStyles.eyebrow}>Google Business Profile URL</p>
                <h2 className={journeyStyles.catalogTitle}>Use this category URL for product traffic</h2>
              </div>
              <p className={styles.gbpUrl}>
                https://www.oduzzconcept.com.ng{category.path}?utm_source=google_business_profile&amp;utm_medium=product&amp;utm_campaign=local_products
              </p>
            </div>
          </section>
        </div>
      </Container>
    </section>
  );
}
