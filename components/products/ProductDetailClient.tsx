"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import PaystackCheckoutPanel from "@/components/payments/PaystackCheckoutPanel";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/components/products/ProductDetailClient.module.css";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import SmartImage from "@/components/ui/SmartImage";
import { CONTACT, buildWhatsAppUrl } from "@/data/contact";
import { useCart } from "@/lib/cart-context";
import {
  buildCollectionPath,
  buildProductCredibilityNotes,
  buildProductHighlights,
  buildProductTagline,
  formatProductPrice,
  getProductAvailability,
  type Product,
} from "@/lib/product-catalog";

type ProductDetailClientProps = {
  product: Product;
  relatedProducts: Product[];
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function toStateClassName(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function buildProductPurchaseMessage(product: Product) {
  return [
    "Hello Oduzz, I want to buy this product.",
    `Product: ${product.name}`,
    `Slug: ${product.slug || product.id}`,
    `Price: ${formatProductPrice(product)}`,
    `Availability: ${getProductAvailability(product)}`,
    `Size/Spec: ${product.size || "N/A"}`,
    `Type: ${product.type || "N/A"}`,
  ].join("\n");
}

function clampQuantity(quantity: number, stockQty: number) {
  const safeStockQty = Math.max(1, stockQty || 1);
  return Math.max(1, Math.min(quantity, safeStockQty));
}

function formatStockMessage(product: Product, availability: string) {
  if (!product.isActive) return "This product is not active for online ordering.";
  if (product.stockQty <= 0) return "Request current availability before planning pickup or delivery.";
  if (availability === "Low stock") {
    return `Only ${product.stockQty} unit${product.stockQty === 1 ? "" : "s"} listed online.`;
  }
  return `${product.stockQty} unit${product.stockQty === 1 ? "" : "s"} listed online.`;
}

function buildSpecDetails(product: Product, availability: string) {
  const useCases = product.bestFor
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  return [
    { label: "Category", value: product.categoryLabel },
    { label: "Brand", value: product.brand },
    { label: "Type", value: product.type },
    { label: "Size / spec", value: product.size },
    { label: "Best for", value: useCases.join(", ") || product.bestFor },
    { label: "Stock status", value: availability },
    product.source === "starter"
      ? { label: "Catalog source", value: "Starter placeholder" }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item?.value && item.value !== "N/A"));
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [cartFeedback, setCartFeedback] = useState("");
  const [quantity, setQuantity] = useState(() => clampQuantity(1, product.stockQty));
  const availability = getProductAvailability(product);
  const canAddToCart = product.isActive && product.stockQty > 0 && product.priceAmount > 0;
  const productHighlights = buildProductHighlights(product);
  const credibilityNotes = buildProductCredibilityNotes(product);
  const productTagline = buildProductTagline(product);
  const collectionPath = buildCollectionPath(product.category);
  const whatsappUrl = buildWhatsAppUrl(encodeURIComponent(buildProductPurchaseMessage(product)));
  const productUseCases = product.bestFor
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
  const safeQuantity = clampQuantity(quantity, product.stockQty);
  const totalPriceLabel = canAddToCart
    ? formatProductPrice({
        priceAmount: product.priceAmount * safeQuantity,
        currency: product.currency,
      })
    : formatProductPrice(product);
  const availabilityClassName = toStateClassName(availability);
  const stateBadgeClassName =
    availabilityClassName === "in-stock"
      ? styles.stateInStock
      : availabilityClassName === "low-stock"
        ? styles.stateLowStock
        : styles.stateUnavailable;
  const stockMessage = formatStockMessage(product, availability);
  const specDetails = buildSpecDetails(product, availability);

  useEffect(() => {
    if (!cartFeedback) return undefined;
    const timeout = window.setTimeout(() => setCartFeedback(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [cartFeedback]);

  function handleAddToCart() {
    if (!canAddToCart) return;
    addItem(product, safeQuantity);
    setCartFeedback(`${product.name} added to cart.`);
  }

  return (
    <section className={cn("section", journeyStyles.page)}>
      <Container className={journeyStyles.container}>
        <div className={journeyStyles.catalogStack}>
          <div className={cn(journeyStyles.frame, styles.heroPanel)}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: product.categoryLabel, href: collectionPath },
                { label: product.name },
              ]}
            />

            <div className={styles.layout}>
              <div className={styles.visualColumn}>
                <div className={cn(styles.galleryStage, product.featured && styles.featuredStage)}>
                  {product.imageUrl ? (
                    <SmartImage
                      src={product.imageUrl}
                      alt={product.name}
                      className={styles.galleryImage}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 56vw"
                    />
                  ) : (
                    <div className={styles.galleryFallback} aria-hidden="true">
                      Oduzz
                    </div>
                  )}
                  <div className={styles.mediaBadgeRow}>
                    <span className={cn(styles.stateBadge, stateBadgeClassName)}>{availability}</span>
                    {product.featured ? <span className={styles.featuredAccent}>Featured pick</span> : null}
                  </div>
                </div>

                <div className={styles.visualFoot}>
                  <div className={styles.visualMetaCard}>
                    <span className={styles.metaLabel}>Category</span>
                    <strong>{product.categoryLabel}</strong>
                  </div>
                  <div className={styles.visualMetaCard}>
                    <span className={styles.metaLabel}>Brand</span>
                    <strong>{product.brand}</strong>
                  </div>
                  <div className={styles.visualMetaCard}>
                    <span className={styles.metaLabel}>Size / spec</span>
                    <strong>{product.size}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.detailColumn}>
                <div className={styles.headerMeta}>
                  <p className={journeyStyles.eyebrow}>{product.featured ? "Featured product" : "Product detail"}</p>
                  <Link href={collectionPath} className={styles.headerLink}>
                    Browse collection
                  </Link>
                </div>

                <h1 className={cn(journeyStyles.display, journeyStyles.displayDetail)}>{product.name}</h1>
                <p className={styles.intro}>{productTagline}</p>

                <div className={styles.priceBar}>
                  <strong className={styles.price}>{formatProductPrice(product)}</strong>
                  <span className={styles.priceContext}>Current listed price</span>
                </div>

                <div className={styles.specRow} aria-label={`${product.name} key specs`}>
                  <span className={styles.specChip}>{product.type}</span>
                  <span className={styles.specChip}>{product.brand}</span>
                  {productUseCases.length > 0 ? <span className={styles.specChip}>{productUseCases[0]}</span> : null}
                </div>

                <div className={styles.buyPanel}>
                  <div className={styles.buyHead}>
                    <div>
                      <span className={styles.metaLabel}>Buy or confirm</span>
                      <strong className={styles.buyTitle}>Ready to order or compare?</strong>
                    </div>
                    {canAddToCart ? (
                      <div className={styles.quantityControl} aria-label="Choose quantity">
                        <button
                          type="button"
                          className={styles.quantityButton}
                          disabled={safeQuantity <= 1}
                          onClick={() => setQuantity(clampQuantity(safeQuantity - 1, product.stockQty))}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className={styles.quantityValue}>{safeQuantity}</span>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          disabled={safeQuantity >= product.stockQty}
                          onClick={() => setQuantity(clampQuantity(safeQuantity + 1, product.stockQty))}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className={journeyStyles.actions}>
                    {canAddToCart ? (
                      <>
                        <button type="button" className="btn primary" onClick={handleAddToCart}>
                          Add to cart
                        </button>
                        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn outline">
                          Ask on WhatsApp
                        </a>
                      </>
                    ) : (
                      <>
                        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn primary">
                          Request availability
                        </a>
                        <Link href="/quote" className="btn outline">
                          Request quote
                        </Link>
                      </>
                    )}
                  </div>

                  <div className={styles.orderFacts} aria-label="Order summary">
                    <span>{stockMessage}</span>
                    {canAddToCart ? <strong>Total: {totalPriceLabel}</strong> : null}
                  </div>

                  {cartFeedback ? (
                    <p className={journeyStyles.catalogFeedback}>
                      {cartFeedback} <Link href="/cart">View cart</Link>
                    </p>
                  ) : null}

                  <div className={styles.buyNotes}>
                    <span>WhatsApp response: {CONTACT.whatsappResponseTime}</span>
                    <span>Confirm accessories or site-specific ratings before payment.</span>
                  </div>
                </div>

                {canAddToCart ? (
                  <details className={styles.checkoutDisclosure}>
                    <summary>Pay online now</summary>
                    <div className={styles.checkoutPanelWrap}>
                      <PaystackCheckoutPanel
                        productId={product.id}
                        productName={product.name}
                        priceLabel={formatProductPrice(product)}
                        quantity={safeQuantity}
                        totalLabel={totalPriceLabel}
                        title="Secure card checkout"
                        compact
                      />
                    </div>
                  </details>
                ) : null}

                <section className={styles.specPanel} aria-labelledby="product-spec-heading">
                  <div className={styles.sectionHead}>
                    <p className={journeyStyles.eyebrow}>Technical snapshot</p>
                    <h2 id="product-spec-heading" className={styles.compactTitle}>
                      Product details
                    </h2>
                  </div>
                  <dl className={styles.specGrid}>
                    {specDetails.map((item) => (
                      <div key={item.label} className={styles.specItem}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <section className={cn(journeyStyles.frame, styles.contentSection)}>
              <div className={styles.sectionHead}>
                <p className={journeyStyles.eyebrow}>Product summary</p>
                <h2 className={journeyStyles.catalogTitle}>What this product is for</h2>
              </div>
              <p className={styles.richCopy}>
                {product.description ||
                  `${product.name} sits within the ${product.categoryLabel.toLowerCase()} collection and is presented with the current size, type, and pricing details shown above.`}
              </p>
              {productHighlights.length > 0 ? (
                <ul className={styles.featureList}>
                  {productHighlights.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={cn(journeyStyles.frame, styles.contentSection)}>
              <div className={styles.sectionHead}>
                <p className={journeyStyles.eyebrow}>Field notes</p>
                <h2 className={journeyStyles.catalogTitle}>What we usually confirm before purchase</h2>
              </div>
              <div className={styles.noteGrid}>
                <article className={styles.noteCard}>
                  <span className={styles.metaLabel}>Best use</span>
                  <p>{credibilityNotes.bestUseCase}</p>
                </article>
                <article className={styles.noteCard}>
                  <span className={styles.metaLabel}>Safety</span>
                  <p>{credibilityNotes.safetyNote}</p>
                </article>
                <article className={styles.noteCard}>
                  <span className={styles.metaLabel}>Installation</span>
                  <p>{credibilityNotes.installationNote}</p>
                </article>
                <article className={styles.noteCard}>
                  <span className={styles.metaLabel}>Compatibility</span>
                  <p>{credibilityNotes.compatibilityNote}</p>
                </article>
              </div>
            </section>
          </div>

          <section className={cn(journeyStyles.frame, styles.supportBand)}>
            <div className={styles.supportCopy}>
              <p className={journeyStyles.eyebrow}>Need matching items?</p>
              <h2 className={journeyStyles.catalogTitle}>Get the right accessories before checkout</h2>
              <p className={styles.richCopy}>
                Share your intended use, location, and any photos. We can help match accessories,
                verify stock, and reduce wrong material selection before payment.
              </p>
            </div>
            <div className={journeyStyles.actions}>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn primary">
                Ask about this product
              </a>
              <Link href="/quote" className="btn outline">
                Request a project quote
              </Link>
            </div>
          </section>

          {relatedProducts.length > 0 ? (
            <section className={cn(journeyStyles.frame, styles.relatedSection)}>
              <div className={journeyStyles.sectionHead}>
                <div className={journeyStyles.sectionCopy}>
                  <p className={journeyStyles.eyebrow}>Related products</p>
                  <h2 className={journeyStyles.catalogTitle}>Keep the material path consistent</h2>
                </div>
                <Link href={collectionPath} className={journeyStyles.sectionLink}>
                  View collection
                </Link>
              </div>

              <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridRelated)}>
                {relatedProducts.map((item, index) => (
                  <ProductCard key={item.id} product={item} variant="related" priority={index < 2} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
