import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { normalizeProduct } from "../../src/utils/productCatalog.js";

export const ADMIN_PRODUCTS_TABLE = "admin_products";
export const PRODUCT_ORDERS_TABLE = "product_orders";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

export function sanitizePhone(value) {
  return sanitizeText(value).replace(/[^\d+]/g, "");
}

export function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res, allowedMethods) {
  res.setHeader("Allow", allowedMethods.join(", "));
  return json(res, 405, { ok: false, error: "Method not allowed." });
}

export function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export function createSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function buildSiteUrl(req) {
  const configuredUrl = sanitizeText(process.env.SITE_URL);
  if (configuredUrl) return configuredUrl.replace(/\/+$/g, "");
  return "";
}

export function createReference(prefix = "odz") {
  const timestamp = Date.now().toString(36);
  const suffix = crypto.randomUUID().split("-")[0];
  return `${prefix}_${timestamp}_${suffix}`;
}

export async function fetchCloudProduct(productId) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase admin access is not configured. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const { data, error } = await supabase
    .from(ADMIN_PRODUCTS_TABLE)
    .select(
      "id,name,size,type,best_for,image_url,price_amount,currency,stock_qty,slug,is_active,featured,category"
    )
    .eq("id", sanitizeText(productId))
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not load product.");
  }

  if (!data) return null;

  return normalizeProduct(
    {
      id: data.id,
      name: data.name,
      size: data.size,
      type: data.type,
      bestFor: data.best_for,
      imageUrl: data.image_url,
      priceAmount: data.price_amount,
      currency: data.currency,
      stockQty: data.stock_qty,
      slug: data.slug,
      isActive: data.is_active,
      featured: data.featured,
      category: data.category,
      source: "cloud",
    },
    data.id
  );
}

export async function upsertOrder(orderPayload) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase admin access is not configured. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const { error } = await supabase
    .from(PRODUCT_ORDERS_TABLE)
    .upsert(orderPayload, { onConflict: "reference_id" });

  if (error) {
    throw new Error(
      error.message ||
        "Could not save order. Re-run supabase/product_orders.sql in Supabase SQL Editor."
    );
  }
}

export async function updateOrder(referenceId, updates) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase admin access is not configured. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const { error } = await supabase
    .from(PRODUCT_ORDERS_TABLE)
    .update(updates)
    .eq("reference_id", sanitizeText(referenceId));

  if (error) {
    throw new Error(
      error.message ||
        "Could not update order. Re-run supabase/product_orders.sql in Supabase SQL Editor."
    );
  }
}

export async function getOrderByReference(referenceId) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase admin access is not configured. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const { data, error } = await supabase
    .from(PRODUCT_ORDERS_TABLE)
    .select("reference_id,gateway,status")
    .eq("reference_id", sanitizeText(referenceId))
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message ||
        "Could not load order. Re-run supabase/product_orders.sql in Supabase SQL Editor."
    );
  }

  return data || null;
}
