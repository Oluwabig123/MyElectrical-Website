import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import { serviceAreas } from "@/data/service-areas";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Service Areas in Lagos",
  description:
    "Explore Oduzz Electrical Concept coverage areas in Lagos, including Lekki, Ajah, and Victoria Island for electrical installation and material guidance.",
  path: "/locations",
  keywords: [
    "electrical service areas Lagos",
    "electrical company Lekki Ajah Victoria Island",
    "electrical contractor Lagos locations",
  ],
});

export default function LocationsPage() {
  return (
    <section className="section seoPage">
      <Container>
        <SectionHeader
          as="h1"
          kicker="Service Areas"
          title="Electrical support across key Lagos locations"
          subtitle="Find localized pages for Lekki, Ajah, and Victoria Island to match your project location and service needs."
        />

        <div className="seoCardGrid">
          {serviceAreas.map((area, index) => (
            <Reveal key={area.slug} delay={index * 0.04}>
              <article className="card seoInfoCard">
                <h2 className="cardTitle">{area.name}</h2>
                <p className="p">{area.summary}</p>
                <div className="seoActionRow">
                  <Link href={`/locations/${area.slug}`} className="btn primary">
                    View {area.name} page
                  </Link>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(area.mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn outline"
                  >
                    Open map
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
