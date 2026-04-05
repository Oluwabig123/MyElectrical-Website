import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import ProductsCatalogClient from "@/components/products/ProductsCatalogClient";
import { buildProductCatalog } from "@/lib/product-catalog";
import { fetchOnlineProducts } from "@/lib/product-directory";
import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { buildProductListSchema } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Products in Lagos | Cables, Lighting, Sockets",
  description:
    "Browse carefully selected electrical products from Oduzz Electrical Concept in Lagos, Nigeria. Explore calmer, image-led collections for lighting, sockets, CCTV, cables, and installation materials.",
  path: "/products",
  keywords: [
    "electrical products Lagos",
    "cables and wires Nigeria",
    "lighting systems Lagos",
    "electrical sockets Nigeria",
    "electrical materials Lagos",
  ],
  image: "/hero/lightings.webp",
});

export default async function ProductsPage() {
  const { products, error } = await fetchOnlineProducts();
  const catalog = buildProductCatalog(products);
  const catalogError = !isSupabaseConfigured
    ? "Product cloud sync is disabled. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live stock."
    : (error?.message ?? "");

  return (
    <>
      <JsonLd data={buildProductListSchema(catalog.items)} />
      <ProductsCatalogClient
        groups={catalog.groups}
        totalCategories={catalog.groups.length}
        catalogError={catalogError}
        title="Products"
      />
    </>
  );
}
