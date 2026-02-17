import React from "react";
import SEO from "../components/ui/SEO";

import Hero from "../sections/home/Hero";
import ServicesPreview from "../sections/home/ServicesPreview";
import Stories from "../sections/home/Stories";
import LightingShowcase from "../sections/home/LightingShowcase";
import WhyOduzz from "../sections/home/WhyOduzz";
import CTAQuoteStrip from "../sections/home/CTAQuoteStrip";

export default function Home() {
  return (
    <>
      <SEO
        title="Oduzz Electrical Concept — Ikorodu, Lagos"
        description="Safety-first electrical wiring, solar/inverter, CCTV and smart home installations in Ikorodu, Lagos. Authentic materials only."
      />
      <Hero />
      <ServicesPreview />
      <Stories />
      <LightingShowcase />
      <WhyOduzz />
      <CTAQuoteStrip />
    </>
  );
}
