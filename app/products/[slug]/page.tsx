import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import JsonLd from "@/components/seo/JsonLd";
import {
  buildProductHighlights,
  buildProductPath,
  buildProductTagline,
  type Product,
} from "@/lib/product-catalog";
import {
  fetchOnlineProductBySlugCached,
  fetchOnlineProductsCached,
} from "@/lib/product-directory-server";
import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { buildProductSchema } from "@/lib/structured-data";
import { buildWhatsAppUrl } from "@/data/contact";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function sanitizeSlug(value: string) {
  return String(value || "").trim().toLowerCase();
}

function buildRelatedProducts(products: Product[], currentProduct: Product, limit = 4) {
  const sameCategory: Product[] = [];
  const others: Product[] = [];

  products.forEach((product) => {
    if (!product || product.id === currentProduct.id) return;
    if (product.category === currentProduct.category) {
      sameCategory.push(product);
      return;
    }
    others.push(product);
  });

  return [...sameCategory, ...others].slice(0, limit);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const safeSlug = sanitizeSlug(slug);
  const { product } = await fetchOnlineProductBySlugCached(safeSlug);

  if (!product) {
    return buildMetadata({
      title: `Product: ${safeSlug}`,
      description:
        "Product detail page for electrical items, fixtures, and related installation materials.",
      path: `/products/${safeSlug}`,
      keywords: ["electrical product", "product detail", safeSlug],
      image: "/hero/lightings.webp",
    });
  }

  return buildMetadata({
    title: `${product.name} | Verified Electrical Product in Lagos`,
    description:
      product.description ||
      `${buildProductTagline(product)} Confirm compatibility and availability before payment for delivery in Lagos.`,
    path: buildProductPath(product),
    keywords: [
      "electrical materials in Lagos",
      "verified electrical materials",
      "authentic electrical products",
      "electrical product",
      "product detail",
      product.categoryLabel,
      product.brand,
      product.type,
      ...buildProductHighlights(product),
    ],
    image: product.imageUrl || "/hero/lightings.webp",
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const safeSlug = sanitizeSlug(slug);
  const [{ product, error }, { products }] = await Promise.all([
    fetchOnlineProductBySlugCached(safeSlug),
    fetchOnlineProductsCached(),
  ]);

  if (product) {
    return (
      <>
        <JsonLd data={buildProductSchema(product)} />
        <ProductDetailClient
          product={product}
          relatedProducts={buildRelatedProducts(products, product)}
        />
      </>
    );
  }

  const supportUrl = buildWhatsAppUrl(
    encodeURIComponent(`Hello Oduzz, I am looking for this product: ${safeSlug}`),
  );
  const suggestedProducts = products.slice(0, 3);

  return (
    <section className={cn("section", journeyStyles.page)}>
      <Container className={journeyStyles.container}>
        <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
          <ProductBreadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: safeSlug },
            ]}
          />

          <div className={journeyStyles.emptyState}>
            <h1 className={journeyStyles.missingTitle}>
              {!isSupabaseConfigured
                ? "Product cloud sync is disabled"
                : error
                  ? "Product details are unavailable"
                  : "Product not found"}
            </h1>
            <p className={journeyStyles.missingText}>
              {!isSupabaseConfigured
                ? "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live product detail pages."
                : error
                  ? "The live catalog could not be reached right now. You can keep browsing the catalog or continue on WhatsApp."
                  : `No product was found for "${safeSlug}". The item may have been removed or its slug may have changed.`}
            </p>
            <div className={journeyStyles.actions}>
              <Link href="/products" className="btn primary">
                View products
              </Link>
              <a href={supportUrl} target="_blank" rel="noreferrer" className="btn outline">
                Ask on WhatsApp
              </a>
            </div>
          </div>

          {suggestedProducts.length > 0 ? (
            <section className={journeyStyles.catalogSection}>
              <div className={journeyStyles.sectionHead}>
                <div className={journeyStyles.sectionCopy}>
                  <p className={journeyStyles.eyebrow}>Available alternatives</p>
                  <h2 className={journeyStyles.catalogTitle}>Popular products you can check now</h2>
                </div>
                <Link href="/products" className={journeyStyles.sectionLink}>
                  View all products
                </Link>
              </div>
              <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridRelated)}>
                {suggestedProducts.map((item, index) => (
                  <ProductCard key={item.id} product={item} variant="related" priority={index < 2} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
