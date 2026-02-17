import React from "react";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import { services } from "../../data/services";

export default function ServicesPreview() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="What we do"
          title="Electrical services built for safety and long-term reliability"
          subtitle="Residential & commercial installations with clean finishing and correct protection devices."
        />

        <div className="grid-3">
          {services.slice(0, 6).map((s, i) => (
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
