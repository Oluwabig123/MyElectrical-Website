"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import PaystackCheckoutPanel from "@/components/payments/PaystackCheckoutPanel";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import { CONTACT, buildWhatsAppUrl } from "@/data/contact";
import { useCart } from "@/lib/cart-context";
import { buildProductPath, formatProductPrice } from "@/lib/product-catalog";

function formatCartAmount(amount: number, currency = "NGN") {
  return formatProductPrice({ priceAmount: amount, currency });
}

function buildCartOrderMessage(
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
      `   Price: ${formatProductPrice(item)}`,
      `   Subtotal: ${formatCartAmount(item.priceAmount * item.quantity, item.currency)}`,
      `   Link: ${item.slug ? `/products/${item.slug}` : "/products"}`,
      "",
    );
  });

  lines.push(`*Cart Total: ${formatCartAmount(subtotalAmount, currency)}*`);
  lines.push("");
  lines.push("Please confirm availability and dispatch schedule across Lagos.");

  return lines.join("\n");
}

export default function CartClient() {
  const { items, totalItems, subtotalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const [showPaystack, setShowPaystack] = useState(false);
  const primaryCurrency = items[0]?.currency || "NGN";

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        encodeURIComponent(buildCartOrderMessage(items, subtotalAmount, primaryCurrency)),
      ),
    [items, primaryCurrency, subtotalAmount],
  );

  return (
    <section className="section cartPage">
      <Container>
        <div className="cartTopbar">
          <div>
            <p className="cartKicker">Review Sourcing List</p>
            <h1 className="cartTitle">Your Selected Electrical Materials</h1>
            <p className="cartLead">
              Adjust quantities below, checkout securely online, or send your list directly on WhatsApp for job-site delivery.
            </p>
          </div>
          <Link href="/products" className="cartBackLink">
            ← Continue shopping
          </Link>
        </div>

        {!items.length ? (
          <Reveal delay={0.03}>
            <div className="card cartEmptyState">
              <h2 className="cartEmptyTitle">Your cart is empty</h2>
              <p className="cartEmptyLead">
                Browse our catalog of cables, lighting, distribution boards, solar equipment, and CCTV materials.
              </p>
              <div className="cartActions">
                <Link href="/products" className="btn primary">
                  Browse products
                </Link>
                <Link href="/quote" className="btn outline">
                  Request project quote
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="cartLayout">
            <Reveal delay={0.04}>
              <div className="cartItems">
                {items.map((item) => {
                  const canIncrease = item.stockQty <= 0 || item.quantity < item.stockQty;

                  return (
                    <article key={item.id} className="card cartItem">
                      <Link href={buildProductPath(item)} className="cartItemMedia">
                        {item.imageUrl ? (
                          <SmartImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="cartItemImage"
                            fill
                            sizes="(max-width: 768px) 100vw, 150px"
                          />
                        ) : (
                          <div className="cartItemFallback" aria-hidden="true">
                            Oduzz
                          </div>
                        )}
                      </Link>

                      <div className="cartItemBody">
                        <div className="cartItemHead">
                          <div>
                            <h2 className="cartItemName">
                              <Link href={buildProductPath(item)}>{item.name}</Link>
                            </h2>
                            <p className="cartItemMeta">
                              {item.categoryLabel || item.type} • {item.size}
                            </p>
                          </div>
                          <strong className="cartItemPrice">{formatProductPrice(item)}</strong>
                        </div>

                        <div className="cartItemFoot">
                          <div className="cartQuantityControl" aria-label={`Adjust quantity for ${item.name}`}>
                            <button
                              type="button"
                              className="cartQtyButton"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Reduce ${item.name} quantity`}
                            >
                              -
                            </button>
                            <span className="cartQtyValue">{item.quantity}</span>
                            <button
                              type="button"
                              className="cartQtyButton"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={!canIncrease}
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              +
                            </button>
                          </div>

                          <div className="cartItemActions">
                            <span className="cartLineTotal">
                              {formatCartAmount(item.priceAmount * item.quantity, item.currency)}
                            </span>
                            <button
                              type="button"
                              className="btn outline"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <aside className="card cartSummary">
                <p className="cartSummaryKicker">Order Summary</p>
                <h2 className="cartSummaryTitle">
                  {totalItems} item{totalItems === 1 ? "" : "s"} in cart
                </h2>

                <div className="cartSummaryRow">
                  <span>Subtotal</span>
                  <strong>{formatCartAmount(subtotalAmount, primaryCurrency)}</strong>
                </div>
                <div className="cartSummaryRow">
                  <span>Delivery</span>
                  <strong>Site dispatch across Lagos</strong>
                </div>

                <div className="cartActions cartSummaryActions">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => setShowPaystack((prev) => !prev)}
                  >
                    {showPaystack ? "Hide Card Checkout" : "Pay Online with Paystack"}
                  </button>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn outline">
                    Order via WhatsApp (Site Delivery)
                  </a>
                  <Link href="/quote" className="btn outline">
                    Request Turnkey Project Quote
                  </Link>
                </div>

                {showPaystack ? (
                  <div style={{ marginTop: 16 }}>
                    <PaystackCheckoutPanel
                      mode="cart"
                      items={items}
                      totalAmount={subtotalAmount}
                      totalLabel={formatCartAmount(subtotalAmount, primaryCurrency)}
                      title="Secure Card & Bank Transfer Checkout"
                      compact
                      onSuccess={() => clearCart()}
                    />
                  </div>
                ) : null}

                <div className="cartSummaryMeta">
                  <span>WhatsApp response: {CONTACT.whatsappResponseTime}</span>
                  <span>100% Verified Authentic Materials | No Counterfeits</span>
                </div>

                <button type="button" className="cartClearButton" onClick={clearCart}>
                  Clear cart
                </button>
              </aside>
            </Reveal>
          </div>
        )}
      </Container>
    </section>
  );
}
