import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import Reveal from "@/components/ui/Reveal";
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
  const serviceTierLabel = isFlagshipService ? "Flagship Installation" : "Support & Maintenance";
  const serviceImage = serviceRecord?.image || "/hero/wiring.webp";
  const serviceImageAlt = serviceRecord?.alt || service.title;

  const allPosts = await getAllBlogPosts();
  const relatedPosts = allPosts.filter((post) => service.relatedBlogSlugs.includes(post.slug)).slice(0, 3);
  const relatedCategories = service.relatedCategoryKeys
    .map((key) => resolveProductCategory(key))
    .filter((category) => category !== null);

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
    <section className={styles.page}>
      <Container>
        <JsonLd data={[serviceSchema, faqSchema]} />

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.crumbDivider}>/</span>
          <Link href="/services">Services</Link>
          <span className={styles.crumbDivider}>/</span>
          <span className={styles.crumbCurrent}>{service.shortTitle}</span>
        </nav>

        {/* Hero Section */}
        <Reveal delay={0.04}>
          <div className={styles.heroGrid}>
            <div className={styles.mediaCard}>
              <Image
                src={serviceImage}
                alt={serviceImageAlt}
                fill
                priority
                sizes="(max-width: 980px) 100vw, 58vw"
                className={styles.mediaImage}
              />
              <div className={styles.mediaOverlay} aria-hidden="true" />
              <div className={styles.mediaContent}>
                <span className={`${styles.tierBadge} ${isFlagshipService ? styles.tierFlagship : styles.tierSupport}`}>
                  {serviceTierLabel}
                </span>
                <h1 className={styles.heroTitle}>{service.title}</h1>
                <p className={styles.heroSummary}>{service.summary}</p>
              </div>
            </div>

            <div className={styles.quickSpecsCard}>
              <div className={styles.specHeader}>
                <span className={styles.specEyebrow}>Engineering Brief</span>
                <h2 className={styles.specTitle}>Project Delivery Framework</h2>
              </div>

              <div className={styles.specsList}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Service Scope</span>
                  <span className={styles.specValue}>{service.serviceType}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Response Window</span>
                  <span className={styles.specValue}>
                    {CONTACT.whatsappResponseTime} ({CONTACT.businessHours})
                  </span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Service Locations</span>
                  <span className={styles.specValue}>Lagos Mainland, Island & Interstate</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Compliance Standard</span>
                  <span className={styles.specValue}>NEMSA / IEC Regulations</span>
                </div>
              </div>

              <div className={styles.specActions}>
                <a
                  href={`https://wa.me/2348149723223?text=Hello%20Oduzz,%20I'm%20inquiring%20about%20${encodeURIComponent(service.shortTitle)}.`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.specWhatsApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.532 1.942.847 2.796.847 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.733-5.768-5.733zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.456-.475-4.914-1.306l-5.086 1.333 1.357-4.957c-.914-1.503-1.428-3.262-1.428-5.07 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                  <span>Chat with Engineer</span>
                </a>
                <Link href={`/quote?service=${service.slug}`} className="btn primary">
                  Request Official Quote
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Detailed Deliverables Checklist */}
        <Reveal delay={0.08}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>What You Receive</span>
              <h2 className={styles.sectionTitle}>Scope of Work & Deliverables</h2>
              <p className={styles.sectionIntro}>{service.intro}</p>
            </div>

            <div className={styles.deliverablesGrid}>
              {service.deliverables.map((item, index) => (
                <div key={index} className={styles.deliverableCard}>
                  <div className={styles.checkCircle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className={styles.deliverableText}>{item}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Execution Workflow Stepper */}
        <Reveal delay={0.12}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>Step-by-Step Delivery</span>
              <h2 className={styles.sectionTitle}>How Oduzz Manages Execution</h2>
              <p className={styles.sectionIntro}>
                From initial site diagnostics through to live load commissioning, each phase is logged and verified.
              </p>
            </div>

            <div className={styles.processStepper}>
              {service.process.map((step, index) => (
                <div key={index} className={styles.stepperItem}>
                  <div className={styles.stepperMarker}>
                    <span className={styles.stepperIndex}>{index + 1}</span>
                  </div>
                  <div className={styles.stepperBody}>
                    <h3 className={styles.stepperTitle}>Phase 0{index + 1}</h3>
                    <p className={styles.stepperText}>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Related Material Categories */}
        {relatedCategories.length > 0 && (
          <Reveal delay={0.16}>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionKicker}>Procurement Sourcing</span>
                <h2 className={styles.sectionTitle}>Recommended Materials & Components</h2>
                <p className={styles.sectionIntro}>
                  We install genuine cables, distribution boards, and equipment sourced directly from certified distributors.
                </p>
              </div>

              <div className={styles.categoriesRow}>
                {relatedCategories.map((category) => (
                  <Link key={category.key} href={buildCollectionPath(category.key)} className={styles.categoryChip}>
                    <span>{category.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </Link>
                ))}
                <Link href="/products" className={styles.browseAllChip}>
                  Browse Product Catalog &rarr;
                </Link>
              </div>
            </section>
          </Reveal>
        )}

        {/* Related Journal Articles */}
        {relatedPosts.length > 0 && (
          <Reveal delay={0.2}>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionKicker}>Engineering Insights</span>
                <h2 className={styles.sectionTitle}>Related Technical Guides</h2>
              </div>

              <div className={styles.journalGrid}>
                {relatedPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* FAQ Section */}
        <Reveal delay={0.22}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>Clarifications</span>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            </div>
            <div className={styles.faqWrapper}>
              <FaqAccordion items={service.faqs} />
            </div>
          </section>
        </Reveal>

        {/* Bottom Conversion Banner */}
        <Reveal delay={0.24}>
          <section className={styles.conversionBanner}>
            <div className={styles.bannerContent}>
              <span className={styles.bannerTag}>Book an Inspection</span>
              <h2 className={styles.bannerHeading}>Ready to schedule your site assessment?</h2>
              <p className={styles.bannerText}>
                Speak with our engineering team today to review your electrical schematics, survey the building, or size your solar backup.
              </p>
            </div>
            <div className={styles.bannerActions}>
              <Link href={`/quote?service=${service.slug}`} className="btn primary">
                Request a Detailed Quote
              </Link>
              <Link href="/services" className="btn outline">
                Explore All Services
              </Link>
            </div>
          </section>
        </Reveal>
      </Container>
    </section>
  );
}
