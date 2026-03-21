import {
  buildSiteUrl,
  createReference,
  fetchCloudProduct,
  json,
  methodNotAllowed,
  readRequestBody,
  sanitizeEmail,
  sanitizePhone,
  upsertOrder,
} from "./_lib/commerce.js";

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";
const PAYSTACK_UNAVAILABLE_MESSAGE =
  "Online card payment is not available yet. Please place this order on WhatsApp for now.";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const isPaystackEnabled = process.env.VITE_PAYSTACK_ENABLED?.trim().toLowerCase() === "true";
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!isPaystackEnabled || !secretKey) {
    return json(res, 503, {
      ok: false,
      error: PAYSTACK_UNAVAILABLE_MESSAGE,
    });
  }

  try {
    const body = readRequestBody(req);
    const productId = sanitizeText(body.productId);
    const customerName = sanitizeText(body.customerName);
    const customerEmail = sanitizeEmail(body.customerEmail);
    const customerPhone = sanitizePhone(body.customerPhone);

    if (!productId || !customerName || !customerEmail) {
      return json(res, 400, {
        ok: false,
        error: "Customer name, email, and product are required.",
      });
    }

    const product = await fetchCloudProduct(productId);
    if (!product) {
      return json(res, 404, { ok: false, error: "Product not found." });
    }

    if (!product.isActive) {
      return json(res, 409, { ok: false, error: "This product is no longer available." });
    }

    if (!product.priceAmount || product.priceAmount <= 0) {
      return json(res, 409, {
        ok: false,
        error: "This product is not configured for online checkout yet.",
      });
    }

    if (!product.stockQty || product.stockQty <= 0) {
      return json(res, 409, { ok: false, error: "This product is currently out of stock." });
    }

    const referenceId = createReference("odzps");
    const siteUrl = buildSiteUrl(req);
    if (!siteUrl) {
      return json(res, 503, {
        ok: false,
        error: PAYSTACK_UNAVAILABLE_MESSAGE,
      });
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
      return json(res, 502, {
        ok: false,
        error:
          gatewayData?.message ||
          "Could not create Paystack checkout. Please try again shortly.",
      });
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

    return json(res, 200, {
      ok: true,
      gateway: "paystack",
      reference: referenceId,
      authorizationUrl: gatewayData.data.authorization_url,
      message: "Checkout initialized.",
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "Could not start checkout.",
    });
  }
}
