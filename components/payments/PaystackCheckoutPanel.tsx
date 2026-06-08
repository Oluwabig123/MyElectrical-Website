"use client";

import { useState } from "react";

type PaystackCheckoutPanelProps = {
  productId: string;
  productName: string;
  priceLabel: string;
  quantity?: number;
  totalLabel?: string;
  title?: string;
  compact?: boolean;
};

type CheckoutStatus = {
  type: "success" | "info" | "error";
  text: string;
} | null;

export default function PaystackCheckoutPanel({
  productId,
  productName,
  priceLabel,
  quantity = 1,
  totalLabel,
  title = "Pay online",
  compact = false,
}: PaystackCheckoutPanelProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<CheckoutStatus>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/create-paystack-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        quantity,
        customerName,
        customerEmail,
        customerPhone,
      }),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!response) {
      setStatus({
        type: "error",
        text: "Could not reach checkout right now. Please try again shortly.",
      });
      return;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.authorizationUrl) {
      setStatus({
        type: "error",
        text: payload?.error || "Could not start Paystack checkout.",
      });
      return;
    }

    setStatus({
      type: "success",
      text: "Redirecting you to secure checkout...",
    });
    window.location.href = payload.authorizationUrl;
  }

  return (
    <form className={`form paystackCheckoutPanel${compact ? " compact" : ""}`} onSubmit={onSubmit}>
      <div className="paystackCheckoutHead">
        <div>
          <p className="paystackCheckoutKicker">Card checkout</p>
          <h3 className="paystackCheckoutTitle">{title}</h3>
        </div>
        <span className="paystackCheckoutPrice">{totalLabel || priceLabel}</span>
      </div>

      <p className="paystackCheckoutText">
        Checkout applies to <strong>{productName}</strong>
        {quantity > 1 ? ` x ${quantity}` : ""}.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          required
        />
      </label>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="field">
        <span>Phone (optional)</span>
        <input
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          placeholder="+234..."
          autoComplete="tel"
        />
      </label>

      <div className="formActions">
        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? "Opening checkout..." : "Pay with Paystack"}
        </button>
      </div>

      {status ? <p className={`formStatus ${status.type}`}>{status.text}</p> : null}
    </form>
  );
}
