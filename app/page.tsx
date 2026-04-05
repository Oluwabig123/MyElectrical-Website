import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import CTAQuoteStrip from "@/sections/home/CTAQuoteStrip";
import FeaturedProducts from "@/sections/home/FeaturedProducts";
import Hero from "@/sections/home/Hero";
import LightingShowcase from "@/sections/home/LightingShowcase";
import ServicesPreview from "@/sections/home/ServicesPreview";
import Stories from "@/sections/home/Stories";
import WhyOduzz from "@/sections/home/WhyOduzz";
import DeferredSection from "@/components/ui/DeferredSection";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Services & Products in Lagos Nigeria",
  description:
    "Oduzz Electrical Concept provides electrical services and carefully selected products in Lagos, Nigeria, helping residential and commercial clients choose safe, durable cables, lighting systems, sockets, fittings, and installation solutions.",
  path: "/",
  keywords: [
    "electrical services Lagos Nigeria",
    "electrical products Lagos",
    "electrical installation Lagos",
    "cables and wires Nigeria",
    "lighting systems Lagos",
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
  return (
    <>
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
            <h1 className="h2">Electrical services and verified products for Lagos projects</h1>
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
          </div>
        </Container>
      </section>
    </>
  );
}
