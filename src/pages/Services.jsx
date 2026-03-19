import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "../data/contact";
import { services } from "../data/services";

export default function Services() {
  return (
    <section className="section servicesPage">
      <Container>
        <SectionHeader
          kicker="Services"
          title="What we offer"
          subtitle="Wiring, solar, CCTV, smart systems, lighting, and maintenance."
        />

        {/* Service cards rendered from the shared services dataset. */}
        <div className="servicesPageGrid">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <article className="card servicesPageCard">
                <span className="servicesPageIndex">0{i + 1}</span>
                <h3 className="cardTitle servicesPageTitle">{s.title}</h3>
                <p className="p">{s.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Footer actions for users ready to call or request a quote. */}
        <Reveal delay={0.14}>
          <div className="servicesPageFoot">
            <p className="servicesPageNote">
              Typical response {CONTACT.whatsappResponseTime} on WhatsApp ({CONTACT.businessHours}).
            </p>
            <div className="servicesPageActions">
              <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
