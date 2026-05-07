import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import { CONTACT_LINKS } from "@/data/contact";
import { getServiceAreaBySlug, serviceAreas } from "@/data/service-areas";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return serviceAreas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    return buildMetadata({
      title: `Location: ${slug}`,
      description: "Electrical service location page from Oduzz Electrical Concept in Lagos.",
      path: `/locations/${slug}`,
    });
  }

  return buildMetadata({
    title: area.title,
    description: area.summary,
    path: `/locations/${area.slug}`,
    keywords: area.focusKeywords,
    image: "/hero/wiring.webp",
  });
}

export default async function ServiceAreaPage({ params }: PageProps) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) notFound();

  const faqSchemaId = `${absoluteUrl(`/locations/${area.slug}`)}#faq`;
  const faqSchema = buildFaqSchema(area.faqs, { id: faqSchemaId });
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(`/locations/${area.slug}`)}#service`,
    name: `Electrical installation and material guidance in ${area.name}`,
    areaServed: `${area.name}, Lagos, Nigeria`,
    provider: {
      "@type": "LocalBusiness",
      name: "Oduzz Electrical Concept",
      url: absoluteUrl("/"),
    },
    serviceType: "Electrical installation and electrical materials support",
  };

  return (
    <section className="section seoPage">
      <Container>
        <JsonLd data={[serviceSchema, faqSchema]} />

        <div className="sectionHeader">
          <div className="kicker">{area.name}</div>
          <h1 className="h2">{area.title}</h1>
          <p className="p">{area.summary}</p>
        </div>

        <div className="seoContentCard seoIntroCard">
          <div className="seoContentGrid">
            <p className="p">{area.intro}</p>
            <div>
              <h2 className="cardTitle">Nearby areas commonly covered</h2>
              <p className="p">{area.nearbyAreas.join(", ")}.</p>
            </div>
          </div>
          <div className="seoActionRow">
            <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn primary">
              Chat on WhatsApp
            </a>
            <Link href="/quote" className="btn outline">
              Request quote
            </Link>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(area.mapQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="btn outline"
            >
              Open location map
            </a>
          </div>
        </div>

        <section className="seoContentSection">
          <h2 className="h2">Services commonly requested in {area.name}</h2>
          <div className="seoCardGrid">
            {area.serviceLines.map((line) => (
              <article key={line} className="card seoInfoCard">
                <h3 className="cardTitle">{line}</h3>
                <p className="p">
                  Scope and materials are aligned to your project requirement before execution starts.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="seoContentSection">
          <h2 className="h2">Frequently asked questions for {area.name}</h2>
          <div className="seoCardGrid">
            {area.faqs.map((faq) => (
              <article key={faq.question} className="card seoInfoCard">
                <h3 className="cardTitle">{faq.question}</h3>
                <p className="p">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="seoContentSection">
          <div className="seoContentCard">
            <h2 className="h2">Explore related pages</h2>
            <div className="seoActionRow">
              <Link href="/services" className="btn outline">
                View services
              </Link>
              <Link href="/products" className="btn outline">
                Browse products
              </Link>
              <Link href="/projects" className="btn outline">
                See projects
              </Link>
              <Link href="/locations" className="btn primary">
                All service areas
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </section>
  );
}
