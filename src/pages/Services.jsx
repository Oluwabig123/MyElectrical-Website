import React from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { services } from "../data/services";

export default function Services() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Services"
          title="What we offer"
          subtitle="Professional electrical solutions across wiring, solar, CCTV, smart systems, and finishing."
        />
        <div className="grid-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <div className="card">
                <div className="cardTitle">{s.title}</div>
                <p className="p">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
