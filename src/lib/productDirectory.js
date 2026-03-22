import {
  ADMIN_PRODUCTS_TABLE,
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";
import { normalizeProduct } from "../utils/productCatalog";

export const PRODUCT_SELECT_FIELDS =
  "id,name,size,type,best_for,image_url,price_amount,currency,stock_qty,slug,is_active,featured,category,created_at";

export function mapProductRow(row) {
  return normalizeProduct(
    {
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      bestFor: row.best_for,
      imageUrl: row.image_url,
      priceAmount: row.price_amount,
      currency: row.currency,
      stockQty: row.stock_qty,
      slug: row.slug,
      isActive: row.is_active,
      featured: row.featured,
      category: row.category,
      source: "cloud",
    },
    row.id
  );
}

export async function fetchOnlineProducts({ activeOnly = true } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { products: [], error: null };
  }

  let query = supabase
    .from(ADMIN_PRODUCTS_TABLE)
    .select(PRODUCT_SELECT_FIELDS)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  return {
    products: error ? [] : (data || []).map(mapProductRow),
    error,
  };
}

export async function fetchOnlineProductBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return { product: null, error: null };
  }

  const { data, error } = await supabase
    .from(ADMIN_PRODUCTS_TABLE)
    .select(PRODUCT_SELECT_FIELDS)
    .eq("slug", String(slug || "").trim())
    .maybeSingle();

  return {
    product: error || !data ? null : mapProductRow(data),
    error,
  };
}
