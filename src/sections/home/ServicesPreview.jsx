import React from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import { CONTACT } from "../../data/contact";
import { services } from "../../data/services";

const FEATURED_SERVICE_SPECS = [
  {
    title: "Residential and Commercial Wiring",
    matches: ["Residential and Commercial Wiring", "Residential & Commercial Wiring"],
  },
  {
    title: "Solar & Inverter Installation",
    matches: ["Solar & Inverter Installation"],
  },
  {
    title: "CCTV & Security Systems",
    matches: ["CCTV & Security Systems"],
  },
];

export default function ServicesPreview() {
  const featuredServices = FEATURED_SERVICE_SPECS.map((spec) => {
    const service = services.find((item) => spec.matches.includes(item.title));
    if (!service) return null;
    return { ...service, title: spec.title };
  }).filter(Boolean);

  return (
    <section className="section servicesPreview">
      <Container>
        <SectionHeader
          kicker="Services"
          title="Core electrical services"
          subtitle="Choose what you need, then get a clear quote fast."
        />

        <div className="servicesPreviewGrid">
          {featuredServices.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <article className="card servicesPreviewCard">
                <div className="servicesPreviewCardHead">
                  <span className="servicesPreviewIndex">0{i + 1}</span>
                </div>
                <h3 className="cardTitle servicesPreviewTitle">{s.title}</h3>
                <p className="p">{s.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14}>
          <div className="servicesPreviewFoot">
            <p className="servicesPreviewNote">
              Typical response: {CONTACT.whatsappResponseTime} on WhatsApp ({CONTACT.businessHours}).
            </p>
            <div className="servicesPreviewActions">
              <Link to="/services">
                <Button variant="outline">View all services</Button>
              </Link>
              <Link to="/quote">
                <Button variant="primary">Request quote</Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
