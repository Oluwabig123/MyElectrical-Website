import crypto from "node:crypto";
import { normalizeProduct } from "@/lib/product-catalog";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const ADMIN_PRODUCTS_TABLE = "admin_products";
export const PRODUCT_ORDERS_TABLE = "product_orders";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeEmail(value: unknown) {
  return sanitizeText(value).toLowerCase();
}

export function sanitizePhone(value: unknown) {
  return sanitizeText(value).replace(/[^\d+]/g, "");
}

function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    throw new Error(
      "Supabase admin access is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return supabaseAdmin;
}

export function buildSiteUrl() {
  const configuredUrl =
    sanitizeText(process.env.SITE_URL) || sanitizeText(process.env.NEXT_PUBLIC_SITE_URL);
  return configuredUrl ? configuredUrl.replace(/\/+$/g, "") : "";
}

export function createReference(prefix = "odz") {
  const timestamp = Date.now().toString(36);
  const suffix = crypto.randomUUID().split("-")[0];
  return `${prefix}_${timestamp}_${suffix}`;
}

export async function fetchCloudProduct(productId: string) {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from(ADMIN_PRODUCTS_TABLE)
    .select(
      "id,name,size,type,best_for,image_url,price_amount,currency,stock_qty,slug,is_active,featured,category",
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
      size: data.size ?? undefined,
      type: data.type ?? undefined,
      bestFor: data.best_for ?? undefined,
      imageUrl: data.image_url ?? undefined,
      priceAmount: data.price_amount ?? undefined,
      currency: data.currency ?? undefined,
      stockQty: data.stock_qty ?? undefined,
      slug: data.slug ?? undefined,
      isActive: data.is_active ?? undefined,
      featured: data.featured ?? undefined,
      category: data.category ?? undefined,
      source: "cloud",
    },
    data.id,
  );
}

export async function upsertOrder(orderPayload: Record<string, unknown>) {
  const client = getSupabaseAdminClient();

  const { error } = await client
    .from(PRODUCT_ORDERS_TABLE)
    .upsert(orderPayload, { onConflict: "reference_id" });

  if (error) {
    throw new Error(
      error.message ||
        "Could not save order. Re-run supabase/product_orders.sql in Supabase SQL Editor.",
    );
  }
}

export async function updateOrder(referenceId: string, updates: Record<string, unknown>) {
  const client = getSupabaseAdminClient();

  const { error } = await client
    .from(PRODUCT_ORDERS_TABLE)
    .update(updates)
    .eq("reference_id", sanitizeText(referenceId));

  if (error) {
    throw new Error(
      error.message ||
        "Could not update order. Re-run supabase/product_orders.sql in Supabase SQL Editor.",
    );
  }
}

export async function getOrderByReference(referenceId: string) {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from(PRODUCT_ORDERS_TABLE)
    .select("reference_id,gateway,status")
    .eq("reference_id", sanitizeText(referenceId))
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message ||
        "Could not load order. Re-run supabase/product_orders.sql in Supabase SQL Editor.",
    );
  }

  return data || null;
}
