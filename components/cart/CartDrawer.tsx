"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import { buildWhatsAppUrl } from "@/data/contact";
import { useCart } from "@/lib/cart-context";
import { formatProductPrice } from "@/lib/product-catalog";
import PaystackCheckoutPanel from "@/components/payments/PaystackCheckoutPanel";
import styles from "./CartDrawer.module.css";

function formatAmount(amount: number, currency = "NGN") {
  return formatProductPrice({ priceAmount: amount, currency });
}

function buildWhatsAppOrderMessage(
  items: ReturnType<typeof useCart>["items"],
  subtotalAmount: number,
  currency: string,
) {
  const lines = [
    "Hello Oduzz Electrical, I want to order these materials from my cart:",
    "",
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.name}*`,
      `   Qty: ${item.quantity}`,
      `   Spec: ${item.size || item.type || "Standard"}`,
      `   Unit Price: ${formatProductPrice(item)}`,
      `   Subtotal: ${formatAmount(item.priceAmount * item.quantity, item.currency)}`,
      "",
    );
  });

  lines.push(`*Cart Total: ${formatAmount(subtotalAmount, currency)}*`);
  lines.push("");
  lines.push("Please confirm availability and dispatch schedule across Lagos.");

  return lines.join("\n");
}

export default function CartDrawer() {
  const {
    items,
    totalItems,
    subtotalAmount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const primaryCurrency = items[0]?.currency || "NGN";

  // Close on Esc key
  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showCheckout) {
          setShowCheckout(false);
        } else {
          closeDrawer();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, isDrawerOpen, showCheckout]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDrawerOpen]);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        encodeURIComponent(
          buildWhatsAppOrderMessage(items, subtotalAmount, primaryCurrency),
        ),
      ),
    [items, primaryCurrency, subtotalAmount],
  );

  return (
    <>
      <div
        className={`${styles.overlay} ${isDrawerOpen ? styles.overlayOpen : ""}`}
        onClick={closeDrawer}
        aria-hidden={!isDrawerOpen}
      />

      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ""}`}
        aria-label="Shopping Cart Drawer"
        aria-hidden={!isDrawerOpen}
      >
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.headerTitle}>Your Cart</h2>
            <span className={styles.itemCountBadge}>
              {totalItems} item{totalItems === 1 ? "" : "s"}
            </span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="Close cart drawer"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">
                ⚡
              </div>
              <h3 className={styles.emptyTitle}>Your cart is empty</h3>
              <p className={styles.emptyText}>
                Explore verified cables, lighting fixtures, breakers, and solar components in our catalog.
              </p>
              <Link
                href="/products"
                className={styles.btnPrimary}
                onClick={closeDrawer}
              >
                Browse Electrical Materials
              </Link>
            </div>
          ) : (
            <div className={styles.itemList}>
              {items.map((item) => {
                const canIncrease =
                  item.stockQty <= 0 || item.quantity < item.stockQty;

                return (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.itemMedia}>
                      {item.imageUrl ? (
                        <SmartImage
                          src={item.imageUrl}
                          alt={item.name}
                          className={styles.itemImage}
                          fill
                          sizes="74px"
                        />
                      ) : (
                        <div className={styles.itemFallback}>Oduzz</div>
                      )}
                    </div>

                    <div className={styles.itemInfo}>
                      <div className={styles.itemTop}>
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className={styles.itemName}
                            onClick={closeDrawer}
                          >
                            {item.name}
                          </Link>
                          <p className={styles.itemMeta}>
                            {item.size && item.size !== "N/A"
                              ? item.size
                              : item.type}
                          </p>
                        </div>

                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          ✕
                        </button>
                      </div>

                      <div className={styles.itemBottom}>
                        <div
                          className={styles.qtyControl}
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={!canIncrease}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <strong className={styles.itemPrice}>
                          {formatAmount(
                            item.priceAmount * item.quantity,
                            item.currency,
                          )}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Subtotal:</span>
              <strong className={styles.subtotalAmount}>
                {formatAmount(subtotalAmount, primaryCurrency)}
              </strong>
            </div>

            {showCheckout ? (
              <div>
                <PaystackCheckoutPanel
                  mode="cart"
                  items={items}
                  totalAmount={subtotalAmount}
                  totalLabel={formatAmount(subtotalAmount, primaryCurrency)}
                  compact
                  onSuccess={() => {
                    setShowCheckout(false);
                    closeDrawer();
                  }}
                />
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => setShowCheckout(false)}
                  style={{ marginTop: 8 }}
                >
                  Back to Cart Summary
                </button>
              </div>
            ) : (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setShowCheckout(true)}
                >
                  Pay Online (Card / Bank Transfer)
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.btnWhatsApp}
                  onClick={closeDrawer}
                >
                  Order on WhatsApp (Site Delivery)
                </a>

                <Link
                  href="/cart"
                  className={styles.btnOutline}
                  onClick={closeDrawer}
                >
                  View Full Cart Page
                </Link>
              </div>
            )}

            <p className={styles.guaranteeNote}>
              Verified authentic materials | Direct job-site dispatch in Lagos
            </p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
