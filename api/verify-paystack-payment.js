import {
  getOrderByReference,
  json,
  methodNotAllowed,
  readRequestBody,
  sanitizeEmail,
  updateOrder,
} from "./_lib/commerce.js";

const PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method || "")) {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return json(res, 500, {
      ok: false,
      error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY.",
    });
  }

  try {
    const body = req.method === "POST" ? readRequestBody(req) : {};
    const reference =
      sanitizeText(req.query?.reference) ||
      sanitizeText(body.reference) ||
      sanitizeText(req.query?.trxref);

    if (!reference) {
      return json(res, 400, { ok: false, error: "Payment reference is required." });
    }

    const existingOrder = await getOrderByReference(reference);
    if (!existingOrder || existingOrder.gateway !== "paystack") {
      return json(res, 404, { ok: false, error: "Order not found." });
    }

    const gatewayResponse = await fetch(`${PAYSTACK_VERIFY_URL}/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const gatewayData = await gatewayResponse.json().catch(() => ({}));

    if (!gatewayResponse.ok || !gatewayData?.status || !gatewayData?.data) {
      return json(res, 502, {
        ok: false,
        error:
          gatewayData?.message ||
          "Could not verify payment with Paystack. Please check again shortly.",
      });
    }

    const payment = gatewayData.data;
    const gatewayStatus = sanitizeText(payment.status).toLowerCase();
    const paidAmount = toPositiveInteger(payment.amount);
    const isPaid = gatewayStatus === "success";
    const localStatus = isPaid
      ? "paid"
      : gatewayStatus === "abandoned"
      ? "abandoned"
      : gatewayStatus === "failed"
      ? "failed"
      : "pending_payment";

    await updateOrder(reference, {
      status: localStatus,
      gateway_status: gatewayStatus || "unknown",
      paid_amount: paidAmount,
      paid_at: isPaid ? payment.paid_at || new Date().toISOString() : null,
      gateway_transaction_id: String(payment.id || ""),
      customer_email: sanitizeEmail(payment.customer?.email),
      gateway_response: payment,
    });

    return json(res, 200, {
      ok: true,
      verified: isPaid,
      gateway: "paystack",
      status: localStatus,
      reference,
      message: isPaid
        ? "Payment confirmed."
        : gatewayStatus === "abandoned"
        ? "Checkout was not completed."
        : gatewayStatus === "failed"
        ? "Payment failed."
        : "Payment is still pending.",
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "Could not verify payment.",
    });
  }
}
