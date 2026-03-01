import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "../data/contact";

const trustPoints = [
  {
    title: "Safety-first process",
    text: "Every installation follows proper protection, balanced loading, and clean routing.",
  },
  {
    title: "Neat finishing standards",
    text: "We deliver tidy conduit runs, clean panel organization, and polished final handover.",
  },
  {
    title: "Reliable communication",
    text: "Clear updates, realistic timelines, and quick response from first contact to completion.",
  },
];

export default function About() {
  return (
    <section className="section aboutPage">
      <Container>
        <SectionHeader
          kicker="About"
          title="Oduzz Electrical Concept"
          subtitle="Safety-first wiring, solar, CCTV, and lighting."
        />

        <Reveal>
          <article className="card aboutLeadCard">
            <p className="aboutLead">
              We serve Ikorodu and Lagos with clean, code-compliant installations built for long-term reliability.
            </p>
            <p className="aboutLead">
              From residential wiring to solar and interior lighting, our focus is safe execution, authentic materials,
              and practical solutions that stay reliable over time.
            </p>
          </article>
        </Reveal>

        <div className="aboutGrid">
          {trustPoints.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.04}>
              <article className="card aboutPoint">
                <span className="aboutPointIndex">0{i + 1}</span>
                <h3 className="cardTitle aboutPointTitle">{item.title}</h3>
                <p className="p">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="aboutFoot">
            <p className="aboutNote">
              Typical response {CONTACT.whatsappResponseTime} on WhatsApp ({CONTACT.businessHours}).
            </p>
            <div className="aboutActions">
              <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
