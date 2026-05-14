import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import { CONTACT_LINKS } from "@/data/contact";
import { getServicePageBySlug, servicePages } from "@/data/service-pages";
import { getAllBlogPosts } from "@/lib/blog";
import { buildCollectionPath, resolveProductCategory } from "@/lib/product-catalog";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema, buildServiceSchema } from "@/lib/structured-data";

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
    <section className="section seoPage">
      <Container>
        <JsonLd data={[serviceSchema, faqSchema]} />

        <div className="sectionHeader">
          <div className="kicker">Services</div>
          <h1 className="h2">{service.title}</h1>
          <p className="p">{service.summary}</p>
        </div>

        <div className="seoContentCard seoIntroCard">
          <div className="seoContentGrid">
            <div>
              <h2 className="h2">What this service covers</h2>
              <p className="p">{service.intro}</p>
            </div>
            <div>
              <h2 className="h2">Typical deliverables</h2>
              <ul className="cardList">
                {service.deliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="seoActionRow">
            <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn primary">
              Chat on WhatsApp
            </a>
            <Link href="/quote" className="btn outline">
              Request quote
            </Link>
            <Link href="/contact" className="btn outline">
              Contact Oduzz
            </Link>
          </div>
        </div>

        <section className="seoContentSection">
          <h2 className="h2">How Oduzz approaches this service</h2>
          <div className="seoCardGrid">
            {service.process.map((step) => (
              <article key={step} className="card seoInfoCard">
                <h3 className="cardTitle">{step}</h3>
                <p className="p">
                  Scope and material decisions are documented before execution so the final delivery stays clean
                  and dependable.
                </p>
              </article>
            ))}
          </div>
        </section>

        {relatedCategories.length > 0 ? (
          <section className="seoContentSection">
            <h2 className="h2">Related product categories</h2>
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
          <section className="seoContentSection">
            <h2 className="h2">Related guides from the journal</h2>
            <div className="seoCardGrid">
              {relatedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} variant="compact" />
              ))}
            </div>
          </section>
        ) : null}

        <section className="seoContentSection">
          <h2 className="h2">Frequently asked questions</h2>
          <FaqAccordion items={service.faqs} />
        </section>

        <section className="seoContentSection">
          <div className="seoContentCard">
            <h2 className="h2">Explore more pages</h2>
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
