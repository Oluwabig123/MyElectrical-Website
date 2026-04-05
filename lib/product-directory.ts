import {
  ADMIN_PRODUCTS_TABLE,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase-client";
import { normalizeProduct, type Product } from "@/lib/product-catalog";

export const PRODUCT_SELECT_FIELDS =
  "id,name,size,type,best_for,image_url,brand,description,key_features,price_amount,currency,stock_qty,slug,is_active,featured,category,created_at";

type ProductRow = {
  id: string;
  name: string;
  size: string | null;
  type: string | null;
  best_for: string | null;
  image_url: string | null;
  brand: string | null;
  description: string | null;
  key_features: string[] | null;
  price_amount: number | null;
  currency: string | null;
  stock_qty: number | null;
  slug: string | null;
  is_active: boolean | null;
  featured: boolean | null;
  category: string | null;
  created_at: string | null;
};

export function mapProductRow(row: ProductRow): Product {
  return normalizeProduct(
    {
      id: row.id,
      name: row.name,
      size: row.size ?? undefined,
      type: row.type ?? undefined,
      bestFor: row.best_for ?? undefined,
      imageUrl: row.image_url ?? undefined,
      brand: row.brand ?? undefined,
      description: row.description ?? undefined,
      keyFeatures: row.key_features ?? undefined,
      priceAmount: row.price_amount ?? undefined,
      currency: row.currency ?? undefined,
      stockQty: row.stock_qty ?? undefined,
      slug: row.slug ?? undefined,
      isActive: row.is_active ?? undefined,
      featured: row.featured ?? undefined,
      category: row.category ?? undefined,
      source: "cloud",
    },
    row.id,
  );
}

export async function fetchOnlineProducts({ activeOnly = true }: { activeOnly?: boolean } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { products: [] as Product[], error: null };
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
    products: error ? [] : ((data ?? []) as ProductRow[]).map(mapProductRow),
    error,
  };
}

export async function fetchOnlineProductBySlug(slug: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { product: null as Product | null, error: null };
  }

  const { data, error } = await supabase
    .from(ADMIN_PRODUCTS_TABLE)
    .select(PRODUCT_SELECT_FIELDS)
    .eq("slug", String(slug || "").trim())
    .maybeSingle();

  return {
    product: error || !data ? null : mapProductRow(data as ProductRow),
    error,
  };
}
