import { NextResponse } from "next/server";
import {
  getOrderByReference,
  sanitizeEmail,
  updateOrder,
} from "@/lib/commerce-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function handleVerify(request: Request, reference: string) {
  const rateLimit = checkRateLimit({
    request,
    routeKey: "paystack-verify",
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many verification requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY.",
      },
      { status: 500 },
    );
  }

  try {
    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "Payment reference is required." },
        { status: 400 },
      );
    }

    const existingOrder = await getOrderByReference(reference);
    if (!existingOrder || existingOrder.gateway !== "paystack") {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
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
      return NextResponse.json(
        {
          ok: false,
          error:
            gatewayData?.message ||
            "Could not verify payment with Paystack. Please check again shortly.",
        },
        { status: 502 },
      );
    }

    const payment = gatewayData.data;
    const gatewayStatus = sanitizeText(payment.status).toLowerCase();
    const paidAmount = toPositiveInteger(payment.amount);
    const paidCurrency = sanitizeText(payment.currency || "NGN").toUpperCase();
    const expectedCurrency = sanitizeText(existingOrder.currency || "NGN").toUpperCase();
    const expectedUnitAmount = toPositiveInteger(existingOrder.unit_amount);
    const expectedQuantity = Math.max(1, toPositiveInteger(existingOrder.quantity) || 1);
    const expectedTotalKobo = expectedUnitAmount * expectedQuantity;

    const currencyMatches = !expectedCurrency || paidCurrency === expectedCurrency;
    const amountMatches = expectedTotalKobo <= 0 || paidAmount >= expectedTotalKobo;
    const isPaid = gatewayStatus === "success" && currencyMatches && amountMatches;

    const localStatus = isPaid
      ? "paid"
      : gatewayStatus === "success" && (!currencyMatches || !amountMatches)
        ? "amount_mismatch"
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

    return NextResponse.json({
      ok: true,
      verified: isPaid,
      gateway: "paystack",
      status: localStatus,
      reference,
      message: isPaid
        ? "Payment confirmed."
        : localStatus === "amount_mismatch"
          ? "Payment amount or currency did not match the order total."
          : gatewayStatus === "abandoned"
            ? "Checkout was not completed."
            : gatewayStatus === "failed"
              ? "Payment failed."
              : "Payment is still pending.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not verify payment.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference =
    sanitizeText(url.searchParams.get("reference")) ||
    sanitizeText(url.searchParams.get("trxref"));
  return handleVerify(request, reference);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return handleVerify(request, sanitizeText(body.reference));
}
