import React from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";

export default function About() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="About"
          title="Oduzz Electrical Concept"
          subtitle="We focus on safety-first installations, load balancing, neat finishing, and authentic materials only."
        />
        <div className="card">
          <p className="p">
            We serve Ikorodu and Lagos with professional electrical wiring, solar & inverter installations,
            CCTV, smart home systems, and premium lighting finishes.
          </p>
          <p className="p">
            Our work is clean, properly protected, and designed for long-term reliability.
          </p>
        </div>
      </Container>
    </section>
  );
}
