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
import FaqAccordion from "@/components/ui/FaqAccordion";
import JsonLd from "@/components/seo/JsonLd";
import { homeFaqs, serviceAreas } from "@/data/service-areas";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/structured-data";

const approachSteps = [
  {
    label: "Plan",
    title: "Define the real load and finish standard",
  },
  {
    label: "Source",
    title: "Match materials to the actual installation",
  },
  {
    label: "Deliver",
    title: "Hand over a cleaner, easier-to-inspect result",
  },
] as const;

export const metadata: Metadata = buildMetadata({
  title: "Premium Electrical Installations in Lagos | Oduzz Electrical Concept",
  description:
    "Oduzz Electrical Concept delivers premium electrical installations, lighting systems, solar setup, CCTV, and verified materials for residential and commercial projects in Lagos, Nigeria.",
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
  const visibleHomeFaqs = homeFaqs.slice(0, 3);
  const homeFaqSchema = buildFaqSchema(visibleHomeFaqs, {
    id: `${absoluteUrl("/")}#homepage-faq`,
  });

  return (
    <>
      <JsonLd data={homeFaqSchema} />
      <Hero />
      <ServicesPreview />
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
      <FeaturedProducts />
      <section className="section seoContentSection">
        <Container>
          <div className="seoContentCard homeApproachCard">
            <div className="homeApproachHead">
              <p className="kicker">Our approach</p>
              <h2 className="h2">How a project moves with Oduzz</h2>
              <p className="p homeApproachLead">
                Fewer words, clearer decisions, cleaner delivery.
              </p>
            </div>

            <div className="homeApproachGrid">
              {approachSteps.map((step) => (
                <article key={step.label} className="homeApproachPane">
                  <p className="homeApproachLabel">{step.label}</p>
                  <h3 className="homeApproachTitle">{step.title}</h3>
                </article>
              ))}
            </div>

            <div className="seoChipRow homeApproachAreas" aria-label="Service areas">
              {serviceAreas.slice(0, 3).map((area) => (
                <Link key={area.slug} href={`/locations/${area.slug}`} className="btn outline">
                  {area.name}
                </Link>
              ))}
              <Link href="/locations" className="btn outline">
                View all areas
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="section seoContentSection">
        <Container>
          <div className="seoContentCard">
            <p className="kicker">FAQ</p>
            <h2 className="h2">Quick answers</h2>
            <FaqAccordion items={visibleHomeFaqs} />
          </div>
        </Container>
      </section>
    </>
  );
}
