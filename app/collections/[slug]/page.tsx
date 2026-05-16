import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import SmartImage from "@/components/ui/SmartImage";
import { getServicePageBySlug } from "@/data/service-pages";
import {
  buildCollectionPath,
  buildProductPath,
  buildProductCatalog,
  type ProductCategoryKey,
  resolveProductCategory,
} from "@/lib/product-catalog";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema, buildProductListSchema } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const CATEGORY_SERVICE_MAP: Partial<Record<ProductCategoryKey, string>> = {
  lighting: "lighting-interior-finishing",
  "switches-sockets": "smart-home-systems",
  "wiring-cables": "residential-commercial-wiring",
  "conduits-trunking": "residential-commercial-wiring",
  "circuit-protection": "fault-diagnosis-maintenance",
  "distribution-boards-panels": "residential-commercial-wiring",
  "smart-home-automation": "smart-home-systems",
  "power-backup-solar": "solar-inverter-installation",
  "cctv-cameras": "cctv-security-systems",
  dvr: "cctv-security-systems",
  nvr: "cctv-security-systems",
  "ip-cameras": "cctv-security-systems",
  "analog-cameras": "cctv-security-systems",
  "wireless-cctv": "cctv-security-systems",
  "cctv-kits": "cctv-security-systems",
  "poe-equipment": "cctv-security-systems",
};

function buildCollectionDescription(label: string, group: string) {
  if (group === "Security & CCTV") {
    return `A curated edit of ${label.toLowerCase()} for residential, commercial, and site security projects.`;
  }

  return `A curated selection of ${label.toLowerCase()} for cleaner comparison and confident project decisions.`;
}

function buildCollectionFaqs(label: string) {
  const labelLower = label.toLowerCase();
  return [
    {
      question: `How do I choose the right ${labelLower} for my project?`,
      answer:
        "Start with your actual load, installation environment, and reliability needs. Oduzz can help narrow options so selected products match project scope.",
    },
    {
      question: `Do you support installation guidance for ${labelLower}?`,
      answer:
        "Yes. You can request service guidance alongside product selection so accessories, protection, and routing decisions stay aligned.",
    },
    {
      question: `Can I request a quote for ${labelLower} and related materials together?`,
      answer:
        "Yes. Share your location, required quantities, and project timeline through WhatsApp or the quote page for faster support.",
    },
  ];
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
    title: `${category.label} Collection | Electrical Materials in Lagos`,
    description: `${buildCollectionDescription(category.label, category.group)} Oduzz supports electrical installation in Lagos with verified electrical materials and authentic electrical products.`,
    path: buildCollectionPath(category.key),
    keywords: [
      `${category.label} collection`,
      `${category.label} Lagos`,
      "electrical materials in Lagos",
      "verified electrical materials",
      "authentic electrical products",
      "electrical products Lagos",
      category.group,
    ],
    image: "/hero/lightings.webp",
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = resolveProductCategory(slug);
  const { products } = await fetchOnlineProductsCached();
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
  const featuredCount = group.items.filter((item) => item.featured).length;
  const collectionModeValue =
    group.items.length >= 4 ? "Stocked" : group.items.length >= 2 ? "Curated" : "Special";
  const collectionModeLabel =
    group.items.length >= 4
      ? "Stocked collection"
      : group.items.length >= 2
        ? "Curated edit"
        : "Special-order reference";
  const collectionFaqs = buildCollectionFaqs(category.label);
  const faqSchema = buildFaqSchema(collectionFaqs, { id: `${absoluteUrl(buildCollectionPath(category.key))}#faq` });
  const relatedService = getServicePageBySlug(CATEGORY_SERVICE_MAP[category.key] ?? "");

  return (
    <>
      <JsonLd data={[buildProductListSchema(group.items), faqSchema]} />

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
                <p className={journeyStyles.eyebrow}>{category.group} | {collectionModeLabel}</p>
                <h1 className={cn(journeyStyles.display, journeyStyles.displayCollection)}>{category.label}</h1>
                <p className={cn(journeyStyles.lead, "productCollectionHeroLead")}>
                  {buildCollectionDescription(category.label, category.group)}
                </p>
                <div className={journeyStyles.actions}>
                  {relatedService ? (
                    <Link href={`/services/${relatedService.slug}`} className="btn outline">
                      Pair with {relatedService.shortTitle}
                    </Link>
                  ) : null}
                  <Link href="/quote" className="btn primary">
                    Request quote
                  </Link>
                </div>
              </div>

              <div className={journeyStyles.stats}>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{group.items.length}</strong>
                  <span className={journeyStyles.statLabel}>Products</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{featuredCount}</strong>
                  <span className={journeyStyles.statLabel}>Featured picks</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{collectionModeValue}</strong>
                  <span className={journeyStyles.statLabel}>Collection mode</span>
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
                <p className={journeyStyles.catalogFeedback}>
                  Review these products as part of the wider installation decision, not as isolated items.
                </p>
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

            <section className="seoContentSection">
              <h2 className="h2">Frequently asked questions about {category.label.toLowerCase()}</h2>
              <FaqAccordion items={collectionFaqs} />
            </section>

            <section className="seoContentSection">
              <div className="seoContentCard">
                <h2 className="h2">Related service and reading</h2>
                <div className="seoActionRow">
                  {relatedService ? (
                    <Link href={`/services/${relatedService.slug}`} className="btn outline">
                      {relatedService.shortTitle}
                    </Link>
                  ) : null}
                  <Link href="/services" className="btn outline">
                    All services
                  </Link>
                  <Link href="/blog" className="btn outline">
                    Read related guides
                  </Link>
                  <Link href="/quote" className="btn primary">
                    Request quote
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </section>
    </>
  );
}
