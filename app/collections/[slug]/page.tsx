import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ProductBreadcrumbs from "@/components/products/ProductBreadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import journeyStyles from "@/components/products/ProductJourney.module.css";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import { getServicePageBySlug } from "@/data/service-pages";
import {
  buildCollectionPath,
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
    return `Verified ${label.toLowerCase()} for residential, commercial, and site security projects in Lagos.`;
  }
  return `Curated ${label.toLowerCase()} certified for residential, commercial, and industrial installations.`;
}

function buildCollectionFaqs(label: string) {
  const labelLower = label.toLowerCase();
  return [
    {
      question: `How do I choose the right ${labelLower} for my project?`,
      answer:
        "Start with your actual electrical load, cable route, and circuit rating. Oduzz engineers confirm specifications before purchase to ensure safe delivery.",
    },
    {
      question: `Do you provide installation services for ${labelLower}?`,
      answer:
        "Yes. Our qualified electricians provide professional site installation, conduit wiring, DB integration, and testing across Lagos.",
    },
    {
      question: `Can I get a bulk contractor quote for ${labelLower}?`,
      answer:
        "Yes. Share your material schedule or bill of quantities (BOQ) through WhatsApp or our quote page for per-unit contractor pricing within 24 hours.",
    },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = resolveProductCategory(slug);

  if (!category) {
    return buildMetadata({
      title: `Collection: ${slug}`,
      description: "Curated electrical collection from Oduzz Electrical Concept.",
      path: `/collections/${slug}`,
      keywords: ["product collection", slug],
      image: "/hero/lightings.webp",
    });
  }

  return buildMetadata({
    title: `${category.label} Collection | Electrical Materials in Lagos`,
    description: `${buildCollectionDescription(category.label, category.group)} Oduzz supplies verified electrical materials across Lagos.`,
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
          <div className={journeyStyles.shell}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: "Collection not found" },
              ]}
            />

            <div className={journeyStyles.emptyState}>
              <h1 className={journeyStyles.emptyTitle}>
                {category?.label ? `${category.label} Collection` : "Collection not found"}
              </h1>
              <p className={journeyStyles.emptyBody}>
                {category?.label
                  ? `We supply ${category.label.toLowerCase()} direct to contractor BOQ specifications. Contact our sourcing desk for immediate pricing.`
                  : "The requested category may have moved or is not currently active."}
              </p>
              <div className={journeyStyles.actions}>
                <Link href="/products" className="btn primary">
                  Browse Live Catalog
                </Link>
                <Link href="/quote" className="btn outline">
                  Request Custom Sourcing
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const collectionFaqs = buildCollectionFaqs(category.label);
  const faqSchema = buildFaqSchema(collectionFaqs, { id: `${absoluteUrl(buildCollectionPath(category.key))}#faq` });
  const relatedService = getServicePageBySlug(CATEGORY_SERVICE_MAP[category.key] ?? "");

  return (
    <>
      <JsonLd data={[buildProductListSchema(group.items), faqSchema]} />

      <section className={cn("section", journeyStyles.page)}>
        <Container className={journeyStyles.container}>
          <div className={journeyStyles.shell}>
            <ProductBreadcrumbs
              items={[
                { label: "Products", href: "/products" },
                { label: category.label },
              ]}
            />

            <div className="productCollectionHero">
              <div className="productCollectionHeroCopy">
                <p className={journeyStyles.eyebrow}>{category.group} • Live Collection</p>
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
                    Request BOQ Quote
                  </Link>
                </div>
              </div>

              <div className={journeyStyles.stats}>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>{group.items.length}</strong>
                  <span className={journeyStyles.statLabel}>In-Stock Items</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>100%</strong>
                  <span className={journeyStyles.statLabel}>Pure Certified</span>
                </div>
                <div className={journeyStyles.stat}>
                  <strong className={journeyStyles.statValue}>Fast</strong>
                  <span className={journeyStyles.statLabel}>Lagos Dispatch</span>
                </div>
              </div>
            </div>

            <div className={journeyStyles.catalogToolbar}>
              <div className={journeyStyles.catalogToolbarCopy}>
                <p className={journeyStyles.eyebrow}>Verified Inventory</p>
                <h2 className={journeyStyles.catalogTitle}>Browse {category.label.toLowerCase()}</h2>
                <p className={journeyStyles.catalogFeedback}>
                  Genuine electrical materials ready for direct site dispatch across Lagos.
                </p>
              </div>
              <Link href="/products" className={journeyStyles.catalogReset}>
                View all products →
              </Link>
            </div>

            {/* Product Grid - Uses the Exact ProductCard from Last Reference (Image 3) */}
            <div className={cn(journeyStyles.cardGrid, journeyStyles.cardGridListing)}>
              {group.items.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant="listing"
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
