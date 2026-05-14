import "server-only";
import { unstable_cache } from "next/cache";
import { fetchOnlineProductBySlug, fetchOnlineProducts } from "@/lib/product-directory";

const PRODUCTS_REVALIDATE_SECONDS = 120;

const getOnlineProductsCached = unstable_cache(
  async (activeOnly: boolean) => fetchOnlineProducts({ activeOnly }),
  ["online-products"],
  {
    revalidate: PRODUCTS_REVALIDATE_SECONDS,
    tags: ["products"],
  },
);

const getOnlineProductBySlugCached = unstable_cache(
  async (slug: string) => fetchOnlineProductBySlug(slug),
  ["online-product-by-slug"],
  {
    revalidate: PRODUCTS_REVALIDATE_SECONDS,
    tags: ["products"],
  },
);

export function fetchOnlineProductsCached({
  activeOnly = true,
}: {
  activeOnly?: boolean;
} = {}) {
  return getOnlineProductsCached(activeOnly);
}

export function fetchOnlineProductBySlugCached(slug: string) {
  return getOnlineProductBySlugCached(slug);
}
