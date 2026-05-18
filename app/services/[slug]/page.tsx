import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { getServicePageBySlug, servicePages } from "@/data/service-pages";
import { services } from "@/data/services";
import { getAllBlogPosts } from "@/lib/blog";
import { buildCollectionPath, resolveProductCategory } from "@/lib/product-catalog";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema, buildServiceSchema } from "@/lib/structured-data";
import styles from "./ServiceDetailPage.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServicePageBySlug(slug);

  if (!service) {
    return buildMetadata({
      title: `Service: ${slug}`,
      description: "Electrical service page from Oduzz Electrical Concept in Lagos.",
      path: `/services/${slug}`,
      image: "/hero/wiring.webp",
    });
  }

  return buildMetadata({
    title: service.title,
    description: service.summary,
    path: `/services/${service.slug}`,
    keywords: service.focusKeywords,
    image: "/hero/wiring.webp",
  });
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServicePageBySlug(slug);
  if (!service) notFound();
  const serviceRecord = services.find((item) => item.slug === service.slug);
  const isFlagshipService = serviceRecord?.tier === "flagship";
  const serviceTierLabel = isFlagshipService ? "Flagship service" : "Supporting service";
  const serviceTierSummary = isFlagshipService
    ? "This is part of the core installation work Oduzz should be known for."
    : "This service usually supports the broader electrical delivery path rather than replacing it.";
  const serviceImage = serviceRecord?.image || "/hero/wiring.webp";
  const serviceImageAlt = serviceRecord?.alt || service.title;

  const allPosts = await getAllBlogPosts();
  const relatedPosts = allPosts.filter((post) => service.relatedBlogSlugs.includes(post.slug)).slice(0, 3);
  const relatedCategories = service.relatedCategoryKeys
    .map((key) => resolveProductCategory(key))
    .filter((category) => category !== null);
  const serviceLead = isFlagshipService
    ? "Share your location, timing, and site photos for practical guidance on sizing, materials, and installation flow."
    : "Share the main issue, location, and clear site photos so Oduzz can guide scope, materials, and next steps clearly.";

  const faqSchemaId = `${absoluteUrl(`/services/${service.slug}`)}#faq`;
  const faqSchema = buildFaqSchema(service.faqs, { id: faqSchemaId });
  const serviceSchema = buildServiceSchema({
    path: `/services/${service.slug}`,
    name: service.shortTitle,
    description: service.summary,
    serviceType: service.serviceType,
    areaServed: "Lagos, Nigeria",
  });

  return (
    <section className={`section seoPage ${styles.page}`}>
      <Container>
        <JsonLd data={[serviceSchema, faqSchema]} />

        <section className={styles.hero}>
          <div className={styles.mediaCard}>
            <Image
              src={serviceImage}
              alt={serviceImageAlt}
              fill
              priority
              sizes="(max-width: 980px) 100vw, 62vw"
              className={styles.mediaImage}
            />
            <div className={styles.mediaOverlay} aria-hidden="true" />
            <div className={styles.mediaContent}>
              <div className="kicker">{serviceTierLabel}</div>
              <h1 className={styles.heroTitle}>{service.title}</h1>
              <p className={styles.heroSummary}>{service.summary}</p>
            </div>
          </div>

          <div className={styles.copyCard}>
            <span className={styles.tierChip}>{serviceTierLabel}</span>
            <div className={styles.intro}>
              <h2 className={styles.introTitle}>Why this scope matters</h2>
              <p className={styles.introText}>{serviceTierSummary}</p>
            </div>
            <div className={styles.facts}>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Service role</span>
                <span className={styles.factValue}>
                  {isFlagshipService ? "Core installation path" : "Supporting delivery path"}
                </span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Material collections</span>
                <span className={styles.factValue}>
                  {relatedCategories.length > 0
                    ? `${relatedCategories.length} related collections`
                    : "Scoped mainly through site review"}
                </span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Response window</span>
                <span className={styles.factValue}>
                  {CONTACT.whatsappResponseTime} during {CONTACT.businessHours}
                </span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Best next step</span>
                <span className={styles.factValue}>
                  Share location, scope, timing, and photos for practical guidance.
                </span>
              </div>
            </div>
            <div className={styles.actions}>
              <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn primary">
                Chat on WhatsApp
              </a>
              <Link href="/quote" className="btn outline">
                Request quote
              </Link>
            </div>
          </div>
        </section>

        <section className={`seoContentCard seoIntroCard ${styles.contentCard}`}>
          <div className={styles.scopeHeader}>
            <div className={styles.scopeCopy}>
              <span className={styles.sectionEyebrow}>Service overview</span>
              <h2 className={styles.scopeTitle}>Need this service scoped properly?</h2>
              <p className={styles.scopeText}>{serviceLead}</p>
            </div>
            <div className={styles.scopeActions}>
              <Link href="/contact" className="btn outline">
                Contact Oduzz
              </Link>
              <Link href="/locations" className="btn outline">
                Service areas
              </Link>
            </div>
          </div>

          <div className={styles.deliverablesBlock}>
            <h2 className="h2">Typical deliverables</h2>
            <div className={styles.deliverablesGrid}>
              {service.deliverables.map((item) => (
                <article key={item} className={styles.deliverableCard}>
                  <span className={styles.deliverableDot} aria-hidden="true" />
                  <p className={styles.deliverableText}>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`seoContentSection ${styles.section}`}>
          <h2 className="h2">
            {isFlagshipService
              ? "How Oduzz delivers this service"
              : "How Oduzz handles this supporting service"}
          </h2>
          <p className={styles.processLead}>
            Scope, materials, routing, and final checks are aligned before execution so the installation stays clean
            and dependable.
          </p>
          <div className={styles.processGrid}>
            {service.process.map((step, index) => (
              <article key={step} className={styles.processCard}>
                <span className={styles.processIndex}>{String(index + 1).padStart(2, "0")}</span>
                <h3 className={styles.processTitle}>{step}</h3>
              </article>
            ))}
          </div>
        </section>

        {relatedCategories.length > 0 ? (
          <section className={`seoContentSection ${styles.section}`}>
            <h2 className="h2">Related material collections</h2>
            <div className="seoActionRow">
              {relatedCategories.map((category) => (
                <Link key={category.key} href={buildCollectionPath(category.key)} className="btn outline">
                  {category.label}
                </Link>
              ))}
              <Link href="/products" className="btn primary">
                Browse all products
              </Link>
            </div>
          </section>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className={`seoContentSection ${styles.section}`}>
            <h2 className="h2">Related guides from the journal</h2>
            <div className={`seoCardGrid ${styles.journalGrid}`}>
              {relatedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : null}

        <section className={`seoContentSection ${styles.section}`}>
          <h2 className="h2">Frequently asked questions</h2>
          <FaqAccordion items={service.faqs} />
        </section>

        <section className={`seoContentSection ${styles.section}`}>
          <div className={`seoContentCard ${styles.contentCard}`}>
            <h2 className="h2">Continue planning this scope</h2>
            <div className="seoActionRow">
              <Link href="/services" className="btn outline">
                All services
              </Link>
              <Link href="/locations" className="btn outline">
                Service areas
              </Link>
              <Link href="/blog" className="btn outline">
                Read journal
              </Link>
              <Link href="/quote" className="btn primary">
                Start a project
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </section>
  );
}
