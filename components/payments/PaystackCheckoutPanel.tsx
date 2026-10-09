"use client";

import { useState } from "react";

type CartCheckoutItem = {
  id: string;
  slug?: string;
  name: string;
  priceAmount: number;
  quantity: number;
  currency?: string;
};

type PaystackSingleCheckoutProps = {
  mode?: "single";
  productId: string;
  productName: string;
  priceLabel: string;
  quantity?: number;
  totalLabel?: string;
  title?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

type PaystackCartCheckoutProps = {
  mode: "cart";
  items: CartCheckoutItem[];
  totalAmount: number;
  totalLabel: string;
  productId?: never;
  productName?: never;
  priceLabel?: never;
  quantity?: never;
  title?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export type PaystackCheckoutPanelProps =
  | PaystackSingleCheckoutProps
  | PaystackCartCheckoutProps;

type CheckoutStatus = {
  type: "success" | "info" | "error";
  text: string;
} | null;

export default function PaystackCheckoutPanel(props: PaystackCheckoutPanelProps) {
  const isCartMode = props.mode === "cart";
  const title = props.title || (isCartMode ? "Cart Checkout" : "Pay online");
  const compact = props.compact ?? false;

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<CheckoutStatus>(null);

  const priceDisplay = isCartMode ? props.totalLabel : props.totalLabel || props.priceLabel;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const payload = isCartMode
      ? {
          mode: "cart",
          items: props.items.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            priceAmount: item.priceAmount,
            quantity: item.quantity,
            currency: item.currency || "NGN",
          })),
          customerName,
          customerEmail,
          customerPhone,
        }
      : {
          mode: "single",
          productId: props.productId,
          quantity: props.quantity ?? 1,
          customerName,
          customerEmail,
          customerPhone,
        };

    const response = await fetch("/api/create-paystack-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!response) {
      setStatus({
        type: "error",
        text: "Could not reach checkout right now. Please check your connection or try WhatsApp.",
      });
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.authorizationUrl) {
      setStatus({
        type: "error",
        text: data?.error || "Could not start Paystack checkout. Please try again or use WhatsApp.",
      });
      return;
    }

    setStatus({
      type: "success",
      text: "Redirecting you to secure Paystack payment...",
    });

    if (props.onSuccess) {
      props.onSuccess();
    }

    window.location.href = data.authorizationUrl;
  }

  return (
    <form
      className={`form paystackCheckoutPanel${compact ? " compact" : ""}`}
      onSubmit={onSubmit}
    >
      <div className="paystackCheckoutHead">
        <div>
          <p className="paystackCheckoutKicker">Card / Bank Transfer</p>
          <h3 className="paystackCheckoutTitle">{title}</h3>
        </div>
        <span className="paystackCheckoutPrice">{priceDisplay}</span>
      </div>

      <p className="paystackCheckoutText">
        {isCartMode ? (
          <>
            Paying for <strong>{props.items.length} item{props.items.length === 1 ? "" : "s"}</strong> in your cart.
          </>
        ) : (
          <>
            Checkout for <strong>{props.productName}</strong>
            {(props.quantity ?? 1) > 1 ? ` x ${props.quantity}` : ""}.
          </>
        )}
      </p>

      <label className="field">
        <span>Full Name</span>
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="e.g. Tunde Adebayo"
          autoComplete="name"
          required
        />
      </label>

      <label className="field">
        <span>Email Address</span>
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          placeholder="e.g. tunde@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="field">
        <span>Phone Number (for site delivery)</span>
        <input
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          placeholder="e.g. 08012345678"
          autoComplete="tel"
          required
        />
      </label>

      <div className="formActions">
        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? "Opening Paystack..." : `Pay ${priceDisplay} Securely`}
        </button>
      </div>

      {status ? <p className={`formStatus ${status.type}`}>{status.text}</p> : null}
    </form>
  );
}
