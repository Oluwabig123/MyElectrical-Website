import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import CTAQuoteStrip from "@/sections/home/CTAQuoteStrip";
import FeaturedProducts from "@/sections/home/FeaturedProducts";
import Hero from "@/sections/home/Hero";
import LightingShowcase from "@/sections/home/LightingShowcase";
import ServicesPreview from "@/sections/home/ServicesPreview";
import Stories from "@/sections/home/Stories";
import WhyOduzz from "@/sections/home/WhyOduzz";
import DeferredSection from "@/components/ui/DeferredSection";
import JsonLd from "@/components/seo/JsonLd";
import { homeFaqs, serviceAreas } from "@/data/service-areas";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Company in Lagos | Installation & Materials Supplier",
  description:
    "Oduzz Electrical Concept provides electrical installation services, lighting systems, cables, switches, and verified electrical materials for residential and commercial projects in Lagos, Nigeria.",
  path: "/",
  keywords: [
    "electrical company in Lagos",
    "electrical installation company Lagos",
    "electrical materials supplier Lagos",
    "electrical contractor Nigeria",
    "lighting installation Lagos",
    "cables and wires Lagos Nigeria",
  ],
  image: "/hero/wiring.webp",
});

function HomeSectionFallback({ minHeight = 320 }: { minHeight?: number }) {
  return (
    <section className="section deferredSectionShell" aria-hidden="true">
      <div className="container">
        <div className="deferredSectionPlaceholder" style={{ minHeight }} />
      </div>
    </section>
  );
}

export default function HomePage() {
  const homeFaqSchema = buildFaqSchema(homeFaqs, {
    id: `${absoluteUrl("/")}#homepage-faq`,
  });

  return (
    <>
      <JsonLd data={homeFaqSchema} />
      <Hero />
      <ServicesPreview />
      <FeaturedProducts />
      <DeferredSection fallback={<HomeSectionFallback minHeight={420} />}>
        <Stories />
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={520} />}>
        <LightingShowcase />
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={360} />}>
        <WhyOduzz />
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={220} />}>
        <CTAQuoteStrip />
      </DeferredSection>
      <section className="section seoContentSection">
        <Container>
          <div className="seoContentCard">
            <p className="kicker">Why Oduzz</p>
            <h2 className="h2">
              Electrical installation services and verified electrical materials in Lagos
            </h2>
            <div className="seoContentGrid">
              <p className="p">
                Oduzz Electrical Concept supports residential and commercial projects with installation
                services and carefully selected electrical materials. From wiring and lighting to
                sockets, fittings, and power accessories, the focus is safety, authenticity, and long-term
                performance.
              </p>
              <p className="p">
                That matters in Lagos because many projects fail at the material stage: technicians bill
                for premium components, then install substandard alternatives. Oduzz reduces that risk by
                guiding clients toward suitable products and transparent purchasing decisions.
              </p>
            </div>
            <div className="seoChipRow" aria-label="Service areas">
              {serviceAreas.map((area) => (
                <Link key={area.slug} href={`/locations/${area.slug}`} className="btn outline">
                  Electrical services in {area.name}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="section seoContentSection">
        <Container>
          <div className="seoContentCard">
            <p className="kicker">FAQ</p>
            <h2 className="h2">Frequently asked questions about Oduzz Electrical Concept</h2>
            <div className="seoCardGrid">
              {homeFaqs.map((faq) => (
                <article key={faq.question} className="card seoInfoCard">
                  <h3 className="cardTitle">{faq.question}</h3>
                  <p className="p">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
