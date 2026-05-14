import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import ProductsCatalogClient from "@/components/products/ProductsCatalogClient";
import { buildProductCatalog } from "@/lib/product-catalog";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";
import { buildMetadata } from "@/lib/seo";
import { buildProductListSchema } from "@/lib/structured-data";

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
  const { products, error, source } = await fetchOnlineProductsCached();
  const catalog = buildProductCatalog(products);
  const catalogError = source === "starter" ? "" : (error?.message ?? "");

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
