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
          subtitle="Safety-first wiring, solar, CCTV, and lighting."
        />
        <div className="card">
          <p className="p">
            We serve Ikorodu and Lagos with clean, code-compliant installations built for long-term reliability.
          </p>
        </div>
      </Container>
    </section>
  );
}
