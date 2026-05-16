import {
  ADMIN_PRODUCTS_TABLE,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase-client";
import { normalizeProduct, type Product } from "@/lib/product-catalog";
import { starterProducts } from "@/data/starter-products";

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

const starterCatalogProducts = starterProducts.map((product, index) =>
  normalizeProduct(product, product.id || `starter-product-${index + 1}`),
);

function isStarterFallbackEnabled() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const explicitSetting = String(process.env.ENABLE_STARTER_FALLBACK || "")
    .trim()
    .toLowerCase();
  if (explicitSetting === "true") return true;
  if (explicitSetting === "false") return false;

  // In local/dev, keep fallback enabled by default for easier setup.
  return true;
}

function getStarterProducts({ activeOnly = true }: { activeOnly?: boolean } = {}) {
  return activeOnly
    ? starterCatalogProducts.filter((product) => product.isActive)
    : starterCatalogProducts;
}

function dedupeProductsBySlug(products: Product[]) {
  const seenKeys = new Set<string>();

  return products.filter((product) => {
    const key = product.slug || product.id;
    if (!key || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

export async function fetchOnlineProducts({ activeOnly = true }: { activeOnly?: boolean } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    if (isStarterFallbackEnabled()) {
      return { products: getStarterProducts({ activeOnly }), error: null, source: "starter" as const };
    }

    return {
      products: [] as Product[],
      error: {
        message:
          "Supabase is not configured for this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.",
      },
      source: "cloud" as const,
    };
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

  const cloudProducts = error
    ? []
    : dedupeProductsBySlug(((data ?? []) as ProductRow[]).map(mapProductRow));

  return {
    products: cloudProducts,
    error,
    source: "cloud" as const,
  };
}

export async function fetchOnlineProductBySlug(slug: string) {
  const safeSlug = String(slug || "").trim();

  if (!isSupabaseConfigured || !supabase) {
    if (!isStarterFallbackEnabled()) {
      return {
        product: null,
        error: {
          message:
            "Supabase is not configured for this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.",
        },
        source: "cloud" as const,
      };
    }

    const starterProduct =
      getStarterProducts().find((product) => product.slug === safeSlug) ?? null;
    return { product: starterProduct, error: null, source: "starter" as const };
  }

  const { data, error } = await supabase
    .from(ADMIN_PRODUCTS_TABLE)
    .select(PRODUCT_SELECT_FIELDS)
    .eq("slug", safeSlug)
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  const productRow = Array.isArray(data) ? data[0] : null;

  if (error || !productRow) {
    return { product: null, error, source: "cloud" as const };
  }

  return {
    product: mapProductRow(productRow as ProductRow),
    error,
    source: "cloud" as const,
  };
}
