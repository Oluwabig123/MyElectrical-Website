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
  const productTagline = buildProductTagline(product);
  const collectionPath = buildCollectionPath(product.category);
  const whatsappUrl = buildWhatsAppUrl(encodeURIComponent(buildProductPurchaseMessage(product)));
  const galleryImages = [product.imageUrl].filter(Boolean);
  const productUseCases = product.bestFor
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  const safeQuantity = clampQuantity(quantity, product.stockQty);
  const availabilityClassName = toStateClassName(availability);
  const stateBadgeClassName =
    availabilityClassName === "in-stock"
      ? styles.stateInStock
      : availabilityClassName === "low-stock"
        ? styles.stateLowStock
        : styles.stateUnavailable;

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
        <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
          <ProductBreadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: product.categoryLabel, href: collectionPath },
              { label: product.name },
            ]}
          />

          <div className={styles.layout}>
            <div className={cn(styles.panel, product.featured && styles.featuredPanel)}>
              <div className={cn(styles.galleryStage, product.featured && styles.featuredStage)}>
                {galleryImages[0] ? (
                  <SmartImage
                    src={galleryImages[0]}
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
              </div>

              {galleryImages.length > 0 ? (
                <div className={styles.thumbRail} aria-label={`${product.name} gallery`}>
                  {galleryImages.map((image, index) => (
                    <div key={`${image}-${index}`} className={cn(styles.thumb, styles.thumbActive)}>
                      <SmartImage
                        src={image}
                        alt={`${product.name} image ${index + 1}`}
                        className={styles.thumbImage}
                        fill
                        sizes="92px"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className={styles.galleryMeta}>
                <div>
                  <span className={styles.metaLabel}>Category</span>
                  <strong>{product.categoryLabel}</strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Brand</span>
                  <strong>{product.brand}</strong>
                </div>
              </div>
            </div>

            <div className={cn(styles.panel, product.featured && styles.featuredPanel)}>
              <div className={styles.headerMeta}>
                <p className={journeyStyles.eyebrow}>{product.featured ? "Featured product" : "Product detail"}</p>
                {product.featured ? <span className={styles.featuredAccent}>Featured pick</span> : null}
              </div>
              <h1 className={cn(journeyStyles.display, journeyStyles.displayDetail)}>{product.name}</h1>
              <p className={styles.intro}>{productTagline}</p>

              <div className={styles.priceBar}>
                <strong className={styles.price}>{formatProductPrice(product)}</strong>
                <span className={cn(styles.stateBadge, stateBadgeClassName)}>
                  {availability}
                </span>
              </div>

              <p className={cn(styles.summaryText, styles.summaryTextMuted)}>
                {productUseCases
                  ? `Best for ${productUseCases}.`
                  : "Chosen for clean installations and dependable project use."}
              </p>

              <div className={styles.specRow} aria-label={`${product.name} key specs`}>
                <span className={styles.specChip}>Size: {product.size}</span>
                <span className={styles.specChip}>{product.type}</span>
                <span className={styles.specChip}>{product.brand}</span>
              </div>

              <div className={styles.purchasePanel}>
                {canAddToCart ? (
                  <div className={styles.quantityPanel}>
                    <span className={styles.metaLabel}>Quantity</span>
                    <div className={styles.quantityControl} aria-label="Choose quantity">
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => setQuantity(clampQuantity(safeQuantity - 1, product.stockQty))}
                      >
                        -
                      </button>
                      <span className={styles.quantityValue}>{safeQuantity}</span>
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => setQuantity(clampQuantity(safeQuantity + 1, product.stockQty))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null}

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
              </div>

              {cartFeedback ? (
                <p className={journeyStyles.catalogFeedback}>
                  {cartFeedback} <Link href="/cart">View cart</Link>
                </p>
              ) : null}

              <div className={styles.auxLinks}>
                <Link href={collectionPath}>Browse this collection</Link>
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Share with procurement
                </a>
              </div>

              <div className={styles.serviceNote}>
                <span>WhatsApp response: {CONTACT.whatsappResponseTime}</span>
                <span>Live stock can change during active restock cycles.</span>
              </div>
            </div>
          </div>

          <div className={styles.accordionGrid}>
            <details className={styles.accordion} open>
              <summary>Description</summary>
              <div className={styles.accordionBody}>
                <p>
                  {product.description ||
                    `${product.name} sits within the ${product.categoryLabel.toLowerCase()} collection and is presented with the current size, type, and pricing details shown above.`}
                </p>
              </div>
            </details>

            <details className={styles.accordion} open>
              <summary>Features and specifications</summary>
              <div className={styles.accordionBody}>
                <div className={styles.factsGrid}>
                  <div className={styles.factCard}>
                    <span className={styles.metaLabel}>Brand</span>
                    <strong>{product.brand}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.metaLabel}>Type</span>
                    <strong>{product.type}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.metaLabel}>Size / spec</span>
                    <strong>{product.size}</strong>
                  </div>
                  <div className={styles.factCard}>
                    <span className={styles.metaLabel}>Availability</span>
                    <strong>{availability}</strong>
                  </div>
                </div>

                {productHighlights.length > 0 ? (
                  <ul className={styles.featureList}>
                    {productHighlights.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>

            <details className={styles.accordion}>
              <summary>Delivery and support</summary>
              <div className={styles.accordionBody}>
                <p>
                  Confirm bulk availability before payment. For matching accessories, installation
                  guidance, or alternative sizes, send the intended use and location on WhatsApp.
                </p>
                <div className={styles.auxLinks}>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Ask about this product
                  </a>
                  <Link href="/quote">Request a project quote</Link>
                </div>
              </div>
            </details>

            {canAddToCart ? (
              <details className={styles.accordion}>
                <summary>Quick checkout</summary>
                <div className={styles.accordionBody}>
                  <PaystackCheckoutPanel
                    productId={product.id}
                    productName={product.name}
                    priceLabel={formatProductPrice(product)}
                    title="Pay online"
                    compact
                  />
                </div>
              </details>
            ) : null}
          </div>

          {relatedProducts.length > 0 ? (
            <div className={styles.relatedSection}>
              <div className={journeyStyles.catalogToolbar}>
                <div className={journeyStyles.catalogToolbarCopy}>
                  <p className={journeyStyles.eyebrow}>Related products</p>
                  <h2 className={journeyStyles.catalogTitle}>You may also like</h2>
                </div>
                <Link href={collectionPath} className={journeyStyles.catalogReset}>
                  View collection
                </Link>
              </div>

              <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridRelated)}>
                {relatedProducts.map((item, index) => (
                  <ProductCard key={item.id} product={item} variant="related" priority={index < 2} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
