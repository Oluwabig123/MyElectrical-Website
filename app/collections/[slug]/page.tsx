import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import JsonLd from "@/components/seo/JsonLd";
import SmartImage from "@/components/ui/SmartImage";
import {
  buildCollectionPath,
  buildProductPath,
  buildProductCatalog,
  resolveProductCategory,
} from "@/lib/product-catalog";
import { fetchOnlineProducts } from "@/lib/product-directory";
import { buildMetadata } from "@/lib/seo";
import { buildProductListSchema } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const dynamic = "force-dynamic";

function buildCollectionDescription(label: string, group: string) {
  if (group === "Security & CCTV") {
    return `A curated edit of ${label.toLowerCase()} for residential, commercial, and site security projects.`;
  }

  return `A curated selection of ${label.toLowerCase()} for cleaner comparison and confident project decisions.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = resolveProductCategory(slug);

  if (!category) {
    return buildMetadata({
      title: `Collection: ${slug}`,
      description: "Curated product collection from Oduzz Electrical Concept.",
      path: `/collections/${slug}`,
      keywords: ["product collection", slug],
      image: "/hero/lightings.webp",
    });
  }

  return buildMetadata({
    title: `${category.label} Collection`,
    description: buildCollectionDescription(category.label, category.group),
    path: buildCollectionPath(category.key),
    keywords: [
      `${category.label} collection`,
      `${category.label} Lagos`,
      "electrical products Lagos",
      category.group,
    ],
    image: "/hero/lightings.webp",
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = resolveProductCategory(slug);
  const { products } = await fetchOnlineProducts();
  const catalog = buildProductCatalog(products);
  const group = category ? catalog.groups.find((item) => item.key === category.key) : null;

  if (!category || !group) {
    return (
      <section className={cn("section", journeyStyles.page)}>
        <Container className={journeyStyles.container}>
          <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: "Collection not found" },
              ]}
            />

            <div className={journeyStyles.emptyState}>
              <h1 className={journeyStyles.emptyTitle}>This collection is not available</h1>
              <p className={journeyStyles.emptyBody}>
                The category may have moved or there may not be active products in it right now.
              </p>
              <div className={journeyStyles.actions}>
                <Link href="/products" className="btn primary">
                  Browse products
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const spotlightProducts = [
    ...group.items.filter((item) => item.featured),
    ...group.items.filter((item) => !item.featured),
  ].slice(0, 3);

  return (
    <>
      <JsonLd data={buildProductListSchema(group.items)} />

      <section className={cn("section", journeyStyles.page)}>
        <Container className={journeyStyles.container}>
          <div className={cn(journeyStyles.frame, journeyStyles.shell)}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: category.label },
              ]}
            />

            <div className="productCollectionHero">
              <div className="productCollectionHeroCopy">
                <p className={journeyStyles.eyebrow}>{category.group}</p>
                <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>{category.label}</h1>
                <p className={cn(journeyStyles.lead, "productCollectionHeroLead")}>
                  {buildCollectionDescription(category.label, category.group)}
                </p>
              </div>

              <div className={journeyStyles.stats}>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{group.items.length}</strong>
                  <span className={journeyStyles.statLabel}>Products</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{spotlightProducts.length}</strong>
                  <span className={journeyStyles.statLabel}>Featured picks</span>
                </div>
              </div>
            </div>

            {spotlightProducts.length > 0 ? (
              <div className="productCollectionSpotlightGrid">
                {spotlightProducts.map((item, index) => (
                  <Link key={item.id} href={buildProductPath(item)} className="productCollectionSpotlight">
                    <div className="productCollectionSpotlightMedia product-image">
                      {item.imageUrl ? (
                        <SmartImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="productCollectionSpotlightImage"
                          fill
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="productCollectionTileFallback" aria-hidden="true">
                          Oduzz
                        </div>
                      )}
                    </div>
                    <div className="productCollectionSpotlightBody">
                      <span className="productCollectionTileMeta">
                        {index === 0 ? "Editor's pick" : "Collection highlight"}
                      </span>
                      <h2 className="productCollectionTileTitle">{item.name}</h2>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            <div className={journeyStyles.catalogToolbar}>
              <div className={journeyStyles.catalogToolbarCopy}>
                <p className={journeyStyles.eyebrow}>Collection catalog</p>
                <h2 className={journeyStyles.catalogTitle}>Browse {category.label.toLowerCase()}</h2>
              </div>
              <Link href="/products" className={journeyStyles.catalogReset}>
                View all products
              </Link>
            </div>

            <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridCollection)}>
              {group.items.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant="collection"
                  priority={index < 4}
                  showCategory={false}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
