"use client";

import { useMemo } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import PaystackCheckoutPanel from "@/components/payments/PaystackCheckoutPanel";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import { CONTACT, buildWhatsAppUrl } from "@/data/contact";
import { useCart } from "@/lib/cart-context";
import { buildProductPath, formatProductPrice } from "@/lib/product-catalog";

const PAYSTACK_CART_MESSAGE =
  "Online checkout will be enabled from the cart soon. Use WhatsApp for now and we will confirm stock before payment.";

function formatCartAmount(amount: number, currency = "NGN") {
  return formatProductPrice({ priceAmount: amount, currency });
}

function buildCartOrderMessage(
  items: ReturnType<typeof useCart>["items"],
  subtotalAmount: number,
  currency: string,
) {
  const lines = ["Hello Oduzz, I want to order these products from my cart:", ""];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name}`,
      `   Qty: ${item.quantity}`,
      `   Price: ${formatProductPrice(item)}`,
      `   Subtotal: ${formatCartAmount(item.priceAmount * item.quantity, item.currency)}`,
      `   Link: ${item.slug ? `/products/${item.slug}` : "/products"}`,
      "",
    );
  });

  lines.push(`Cart subtotal: ${formatCartAmount(subtotalAmount, currency)}`);
  lines.push("Please confirm availability and next steps.");

  return lines.join("\n");
}

export default function CartClient() {
  const { items, totalItems, subtotalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const primaryCurrency = items[0]?.currency || "NGN";
  const checkoutItem = items.length === 1 ? items[0] : null;
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
            <p className="cartKicker">Cart</p>
            <h1 className="cartTitle">Review your selected products</h1>
            <p className="cartLead">
              Keep payment at one point. Adjust quantities here, then continue through WhatsApp
              until online checkout goes live.
            </p>
          </div>
          <Link href="/products" className="cartBackLink">
            Continue shopping
          </Link>
        </div>

        {!items.length ? (
          <Reveal delay={0.03}>
            <div className="card cartEmptyState">
              <h2 className="cartEmptyTitle">Your cart is empty</h2>
              <p className="cartEmptyLead">
                Add products from the catalog first. New online stock will appear there automatically.
              </p>
              <div className="cartActions">
                <Link href="/products" className="btn primary">
                  Browse products
                </Link>
                <Link href="/quote" className="btn outline">
                  Request product quote
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
                <p className="cartSummaryKicker">Summary</p>
                <h2 className="cartSummaryTitle">
                  {totalItems} item{totalItems === 1 ? "" : "s"} in cart
                </h2>

                <div className="cartSummaryRow">
                  <span>Subtotal</span>
                  <strong>{formatCartAmount(subtotalAmount, primaryCurrency)}</strong>
                </div>
                <div className="cartSummaryRow">
                  <span>Payment</span>
                  <strong>{checkoutItem ? "Single-item checkout ready" : "WhatsApp for mixed carts"}</strong>
                </div>

                <p className="formStatus info cartSummaryStatus">{PAYSTACK_CART_MESSAGE}</p>

                <div className="cartActions cartSummaryActions">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn outline">
                    Send cart on WhatsApp
                  </a>
                  <Link href="/quote" className="btn outline">
                    Request bulk quote
                  </Link>
                </div>

                {checkoutItem ? (
                  <PaystackCheckoutPanel
                    productId={checkoutItem.id}
                    productName={checkoutItem.name}
                    priceLabel={formatProductPrice(checkoutItem)}
                    title="Pay for this item online"
                    compact
                  />
                ) : (
                  <p className="cartSummaryNote">
                    Online checkout currently supports one product at a time. For multiple items,
                    send the cart on WhatsApp so stock can be confirmed together.
                  </p>
                )}

                <div className="cartSummaryMeta">
                  <span>WhatsApp response: {CONTACT.whatsappResponseTime}</span>
                  <span>Final stock is confirmed before payment.</span>
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
