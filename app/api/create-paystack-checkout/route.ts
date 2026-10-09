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
  "Online card payment is temporarily unavailable. Please place this order on WhatsApp for immediate confirmation and site delivery.";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeQuantity(value: unknown) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

type CartPayloadItem = {
  id: string;
  slug?: string;
  name: string;
  priceAmount: number;
  quantity: number;
  currency?: string;
};

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
    const customerName = sanitizeText(body.customerName);
    const customerEmail = sanitizeEmail(body.customerEmail);
    const customerPhone = sanitizePhone(body.customerPhone);

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Full name and email address are required to start checkout.",
        },
        { status: 400 },
      );
    }

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

    const referenceId = createReference("odzps");
    const callbackUrl = `${siteUrl}/products?checkout=paystack`;

    // CASE 1: Full Cart Checkout
    if (body.mode === "cart" && Array.isArray(body.items) && body.items.length > 0) {
      const items = body.items as CartPayloadItem[];
      const validItems = items.filter(
        (item) => item.id && item.name && Number(item.priceAmount) > 0 && Number(item.quantity) > 0,
      );

      if (validItems.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No valid items found in the cart for checkout." },
          { status: 400 },
        );
      }

      const totalNaira = validItems.reduce(
        (sum, item) => sum + Number(item.priceAmount) * Number(item.quantity),
        0,
      );

      if (totalNaira <= 0) {
        return NextResponse.json(
          { ok: false, error: "Cart total must be greater than zero." },
          { status: 400 },
        );
      }

      const amountInKobo = Math.round(totalNaira * 100);
      const primaryCurrency = validItems[0]?.currency || "NGN";

      const gatewayPayload = {
        email: customerEmail,
        amount: amountInKobo,
        currency: primaryCurrency,
        reference: referenceId,
        callback_url: callbackUrl,
        metadata: {
          customer_name: customerName,
          customer_phone: customerPhone,
          channel: "website-cart",
          items_count: validItems.length,
          items: validItems.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            unit_price: item.priceAmount,
            quantity: item.quantity,
          })),
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
              "Could not initialize Paystack checkout. Please try again or use WhatsApp.",
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
        product_id: "cart-order",
        product_slug: "cart-order",
        product_name: `Cart Order (${validItems.length} items)`,
        unit_amount: totalNaira,
        paid_amount: 0,
        currency: primaryCurrency,
        quantity: 1,
        checkout_url: gatewayData.data.authorization_url,
        gateway_transaction_id: String(gatewayData.data.access_code || ""),
        metadata: {
          callback_url: callbackUrl,
          items: validItems,
        },
        gateway_response: gatewayData.data,
      });

      return NextResponse.json({
        ok: true,
        gateway: "paystack",
        reference: referenceId,
        authorizationUrl: gatewayData.data.authorization_url,
        message: "Cart checkout initialized.",
      });
    }

    // CASE 2: Single Product Checkout
    const productId = sanitizeText(body.productId);
    const quantity = sanitizeQuantity(body.quantity);

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Product ID is required for checkout." },
        { status: 400 },
      );
    }

    const product = await fetchCloudProduct(productId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }

    if (!product.isActive) {
      return NextResponse.json(
        { ok: false, error: "This product is no longer active for online ordering." },
        { status: 409 },
      );
    }

    if (!product.priceAmount || product.priceAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: "This product does not have an active price." },
        { status: 409 },
      );
    }

    if (!product.stockQty || product.stockQty <= 0) {
      return NextResponse.json(
        { ok: false, error: "This product is currently out of stock." },
        { status: 409 },
      );
    }

    if (quantity > product.stockQty) {
      return NextResponse.json(
        {
          ok: false,
          error: `Only ${product.stockQty} unit${product.stockQty === 1 ? "" : "s"} available right now.`,
        },
        { status: 409 },
      );
    }

    const totalNaira = product.priceAmount * quantity;
    const amountInKobo = Math.round(totalNaira * 100);

    const gatewayPayload = {
      email: customerEmail,
      amount: amountInKobo,
      currency: product.currency || "NGN",
      reference: referenceId,
      callback_url: callbackUrl,
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        quantity,
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
      quantity,
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
