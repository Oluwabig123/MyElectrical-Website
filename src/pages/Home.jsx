import React, { Suspense, lazy } from "react";
import SEO from "../components/ui/SEO";
import DeferredSection from "../components/ui/DeferredSection";

import Hero from "../sections/home/Hero";
import ServicesPreview from "../sections/home/ServicesPreview";
import FeaturedProducts from "../sections/home/FeaturedProducts";

const Stories = lazy(() => import("../sections/home/Stories"));
const LightingShowcase = lazy(() => import("../sections/home/LightingShowcase"));
const WhyOduzz = lazy(() => import("../sections/home/WhyOduzz"));
const CTAQuoteStrip = lazy(() => import("../sections/home/CTAQuoteStrip"));

function HomeSectionFallback({ minHeight = 320 }) {
  return (
    <section className="section deferredSectionShell" aria-hidden="true">
      <div className="container">
        <div className="deferredSectionPlaceholder" style={{ minHeight }} />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* Route-level metadata for the landing page. */}
      <SEO
        title="Oduzz Electrical Concept - Ikorodu, Lagos"
        description="Safety-first wiring, solar/inverter, CCTV, and lighting in Ikorodu, Lagos."
      />
      {/* Home page sections are composed from standalone section components. */}
      <Hero />
      <ServicesPreview />
      <FeaturedProducts />
      <DeferredSection fallback={<HomeSectionFallback minHeight={420} />}>
        <Suspense fallback={<HomeSectionFallback minHeight={420} />}>
          <Stories />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={520} />}>
        <Suspense fallback={<HomeSectionFallback minHeight={520} />}>
          <LightingShowcase />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={360} />}>
        <Suspense fallback={<HomeSectionFallback minHeight={360} />}>
          <WhyOduzz />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<HomeSectionFallback minHeight={220} />}>
        <Suspense fallback={<HomeSectionFallback minHeight={220} />}>
          <CTAQuoteStrip />
        </Suspense>
      </DeferredSection>
    </>
  );
}
