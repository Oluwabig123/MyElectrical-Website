"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PaystackCheckoutPanel from "@/components/payments/PaystackCheckoutPanel";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/components/products/ProductDetailClient.module.css";
import SmartImage from "@/components/ui/SmartImage";
import { buildWhatsAppUrl } from "@/data/contact";
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
    "Hello Oduzz, I want to inquire about purchasing this product.",
    `Product: ${product.name}`,
    `Price: ${formatProductPrice(product)}`,
    `Size / Spec: ${product.size || "Standard"}`,
    `Brand: ${product.brand}`,
  ].join("\n");
}

function clampQuantity(quantity: number, stockQty: number) {
  const safeStockQty = Math.max(1, stockQty || 1);
  return Math.max(1, Math.min(quantity, safeStockQty));
}

function formatStockMessage(product: Product, availability: string) {
  if (!product.isActive) return "Currently unavailable for online checkout.";
  if (product.stockQty <= 0) return "Contact us to confirm stock availability.";
  if (availability === "Low stock") {
    return `Low stock: only ${product.stockQty} unit${product.stockQty === 1 ? "" : "s"} left.`;
  }
  return `In stock: ${product.stockQty} units ready for immediate Lagos dispatch.`;
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
    { label: "Size / Spec", value: product.size },
    { label: "Best For", value: useCases.join(", ") || product.bestFor },
    { label: "Stock Availability", value: availability },
  ].filter((item): item is { label: string; value: string } => Boolean(item?.value && item.value !== "N/A"));
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [cartFeedback, setCartFeedback] = useState("");
  const [showCardCheckout, setShowCardCheckout] = useState(false);
  const [quantity, setQuantity] = useState(() => clampQuantity(1, product.stockQty));

  const availability = getProductAvailability(product);
  const canAddToCart = product.isActive && product.stockQty > 0 && product.priceAmount > 0;
  const productHighlights = buildProductHighlights(product);
  const productTagline = buildProductTagline(product);
  const collectionPath = buildCollectionPath(product.category);
  const whatsappUrl = buildWhatsAppUrl(encodeURIComponent(buildProductPurchaseMessage(product)));
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
    setCartFeedback(`✓ ${product.name} (${safeQuantity}x) added to cart.`);
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <div className={styles.stack}>
          {/* 1. MAIN PRODUCT SHOWCASE (No nested inner boxes) */}
          <div className={styles.mainShowcase}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: product.categoryLabel, href: collectionPath },
                { label: product.name },
              ]}
            />

            <div className={styles.productLayout}>
              {/* Product Gallery Stage - Matches Last Reference */}
              <div className={styles.visualColumn}>
                <div className={styles.galleryStage}>
                  {product.imageUrl ? (
                    <SmartImage
                      src={product.imageUrl}
                      alt={product.name}
                      className={styles.galleryImage}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className={styles.galleryFallback} aria-hidden="true">
                      {product.brand}
                    </div>
                  )}

                  <div className={styles.mediaBadgeRow}>
                    <span className={cn(styles.stateBadge, stateBadgeClassName)}>
                      {availability}
                    </span>
                    {product.featured ? (
                      <span className={styles.featuredBadge}>Featured Item</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Product Details Column */}
              <div className={styles.detailColumn}>
                <div className={styles.metaHeader}>
                  <p className={styles.categoryEyebrow}>{product.categoryLabel}</p>
                  <Link href={collectionPath} className={styles.collectionLink}>
                    Browse {product.categoryLabel} →
                  </Link>
                </div>

                <h1 className={styles.productTitle}>{product.name}</h1>

                <div className={styles.priceBlock}>
                  <strong className={styles.priceValue}>{formatProductPrice(product)}</strong>
                  <span className={styles.priceSub}>per unit / coil</span>
                </div>

                <p className={styles.tagline}>{productTagline}</p>

                {/* Purchase Action Box */}
                <div className={styles.actionCard}>
                  <div className={styles.quantityRow}>
                    <span className={styles.stockStatusText}>{stockMessage}</span>
                    {canAddToCart ? (
                      <div className={styles.quantityControl} aria-label="Choose quantity">
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          disabled={safeQuantity <= 1}
                          onClick={() => setQuantity(clampQuantity(safeQuantity - 1, product.stockQty))}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{safeQuantity}</span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          disabled={safeQuantity >= product.stockQty}
                          onClick={() => setQuantity(clampQuantity(safeQuantity + 1, product.stockQty))}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.buttonGroup}>
                    {canAddToCart ? (
                      <button type="button" className={styles.addToCartBtn} onClick={handleAddToCart}>
                        + Add to Cart {safeQuantity > 1 ? `(${totalPriceLabel})` : ""}
                      </button>
                    ) : null}

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.whatsappBtn}
                    >
                      Inquire on WhatsApp →
                    </a>
                  </div>

                  {canAddToCart ? (
                    <button
                      type="button"
                      className={styles.cardCheckoutToggle}
                      onClick={() => setShowCardCheckout((prev) => !prev)}
                    >
                      {showCardCheckout ? "Hide Online Payment" : "💳 Pay with Card / Bank Transfer"}
                    </button>
                  ) : null}

                  {cartFeedback ? (
                    <p className={styles.cartFeedback}>
                      {cartFeedback} <Link href="/cart" style={{ textDecoration: "underline", color: "#ffd54a", marginLeft: 6 }}>View Cart →</Link>
                    </p>
                  ) : null}

                  {canAddToCart && showCardCheckout ? (
                    <div style={{ marginTop: 10 }}>
                      <PaystackCheckoutPanel
                        productId={product.id}
                        productName={product.name}
                        priceLabel={formatProductPrice(product)}
                        quantity={safeQuantity}
                        totalLabel={totalPriceLabel}
                        title="Secure Card & Transfer Checkout"
                        compact
                      />
                    </div>
                  ) : null}
                </div>

                {/* Site Installation Banner */}
                <div className={styles.installationBanner}>
                  <div className={styles.installationCopy}>
                    <span className={styles.installationIcon} aria-hidden="true">
                      ⚡
                    </span>
                    <p className={styles.installationText}>
                      <strong>Need professional site installation in Lagos?</strong>
                      <br />
                      Oduzz certified engineers handle conduit routing, DB connection, and testing.
                    </p>
                  </div>
                  <Link
                    href={`/quote?service=${encodeURIComponent(
                      product.categoryLabel || "Residential wiring",
                    )}&details=${encodeURIComponent("Installation quote for: " + product.name)}`}
                    className={styles.installationBtn}
                  >
                    Request Quote →
                  </Link>
                </div>

                {/* Technical Specifications Snapshot */}
                <div className={styles.specsSection}>
                  <h3 className={styles.specsHeading}>Technical Specifications</h3>
                  <div className={styles.specsTable}>
                    {specDetails.map((item) => (
                      <div key={item.label} className={styles.specCell}>
                        <span className={styles.specLabel}>{item.label}</span>
                        <span className={styles.specValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DESCRIPTION & GUARANTEE (Clean, not text-heavy) */}
          <section className={styles.detailsSection}>
            <div className={styles.descriptionBox}>
              <h2 className={styles.sectionTitle}>Product Overview</h2>
              <p className={styles.descriptionText}>
                {product.description ||
                  `The ${product.name} is manufactured to standard Nigerian and international electrical safety requirements, delivering reliable conductivity and durability for domestic and commercial projects.`}
              </p>

              {productHighlights.length > 0 ? (
                <ul className={styles.featuresList}>
                  {productHighlights.map((feature) => (
                    <li key={feature} className={styles.featureItem}>
                      <span className={styles.featureIcon}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className={styles.guaranteeBox}>
              <h3 className={styles.sectionTitle}>Purchase Guarantees</h3>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>🛡️</span>
                <p className={styles.guaranteeText}>
                  <strong>100% Genuine Copper:</strong> Certified pure conductivity with zero counterfeit risk.
                </p>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>🚚</span>
                <p className={styles.guaranteeText}>
                  <strong>Direct Site Delivery:</strong> Prompt dispatch to building sites across Lagos Mainland & Island.
                </p>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>📐</span>
                <p className={styles.guaranteeText}>
                  <strong>Technical Compatibility:</strong> Verified by qualified electricians before dispatch.
                </p>
              </div>
            </div>
          </section>

          {/* 3. RELATED PRODUCTS (Uses the Exact ProductCard from Last Reference) */}
          {relatedProducts.length > 0 ? (
            <section className={styles.relatedSection}>
              <div className={styles.relatedHead}>
                <div>
                  <p className={styles.categoryEyebrow}>Related Materials</p>
                  <h2 className={styles.sectionTitle}>You May Also Need</h2>
                </div>
                <Link href={collectionPath} className={styles.collectionLink}>
                  View All in {product.categoryLabel} →
                </Link>
              </div>

              <div className={styles.relatedGrid}>
                {relatedProducts.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    variant="listing"
                    showCategory
                    priority={index < 2}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
