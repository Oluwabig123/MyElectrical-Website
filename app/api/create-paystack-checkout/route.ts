import { NextResponse } from "next/server";
import {
  buildSiteUrl,
  createReference,
  fetchCloudProduct,
  sanitizeEmail,
  sanitizePhone,
  upsertOrder,
} from "@/lib/commerce-admin";

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";
const PAYSTACK_UNAVAILABLE_MESSAGE =
  "Online card payment is not available yet. Please place this order on WhatsApp for now.";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const isPaystackEnabled =
    (process.env.PAYSTACK_ENABLED || process.env.VITE_PAYSTACK_ENABLED || "")
      .trim()
      .toLowerCase() === "true";
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!isPaystackEnabled || !secretKey) {
    return NextResponse.json(
      {
        ok: false,
        error: PAYSTACK_UNAVAILABLE_MESSAGE,
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = sanitizeText(body.productId);
    const customerName = sanitizeText(body.customerName);
    const customerEmail = sanitizeEmail(body.customerEmail);
    const customerPhone = sanitizePhone(body.customerPhone);

    if (!productId || !customerName || !customerEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Customer name, email, and product are required.",
        },
        { status: 400 },
      );
    }

    const product = await fetchCloudProduct(productId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }

    if (!product.isActive) {
      return NextResponse.json(
        { ok: false, error: "This product is no longer available." },
        { status: 409 },
      );
    }

    if (!product.priceAmount || product.priceAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "This product is not configured for online checkout yet.",
        },
        { status: 409 },
      );
    }

    if (!product.stockQty || product.stockQty <= 0) {
      return NextResponse.json(
        { ok: false, error: "This product is currently out of stock." },
        { status: 409 },
      );
    }

    const referenceId = createReference("odzps");
    const siteUrl = buildSiteUrl();
    if (!siteUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: PAYSTACK_UNAVAILABLE_MESSAGE,
        },
        { status: 503 },
      );
    }
    const callbackUrl = `${siteUrl}/products?checkout=paystack`;

    const gatewayPayload = {
      email: customerEmail,
      amount: product.priceAmount,
      currency: product.currency || "NGN",
      reference: referenceId,
      callback_url: callbackUrl,
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        channel: "website-products",
      },
    };

    const gatewayResponse = await fetch(PAYSTACK_INITIALIZE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatewayPayload),
    });

    const gatewayData = await gatewayResponse.json().catch(() => ({}));

    if (!gatewayResponse.ok || !gatewayData?.status || !gatewayData?.data?.authorization_url) {
      return NextResponse.json(
        {
          ok: false,
          error:
            gatewayData?.message ||
            "Could not create Paystack checkout. Please try again shortly.",
        },
        { status: 502 },
      );
    }

    await upsertOrder({
      reference_id: referenceId,
      gateway: "paystack",
      status: "pending_checkout",
      gateway_status: "initialized",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
      unit_amount: product.priceAmount,
      paid_amount: 0,
      currency: product.currency || "NGN",
      quantity: 1,
      checkout_url: gatewayData.data.authorization_url,
      gateway_transaction_id: String(gatewayData.data.access_code || ""),
      metadata: {
        callback_url: callbackUrl,
        product_snapshot: {
          name: product.name,
          size: product.size,
          type: product.type,
          bestFor: product.bestFor,
          imageUrl: product.imageUrl,
          category: product.category,
        },
      },
      gateway_response: gatewayData.data,
    });

    return NextResponse.json({
      ok: true,
      gateway: "paystack",
      reference: referenceId,
      authorizationUrl: gatewayData.data.authorization_url,
      message: "Checkout initialized.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not start checkout.",
      },
      { status: 500 },
    );
  }
}
