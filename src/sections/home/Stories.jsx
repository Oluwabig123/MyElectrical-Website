import React from "react";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import ParallaxImage from "../../components/ui/ParallaxImage";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { projects } from "../../data/projects";

export default function Stories() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Proof of work"
          title="Real projects. Clean finishing. Professional delivery."
          subtitle="We document our installations so clients can trust the process and results."
        />

        <div className="grid-3">
          {projects.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <div className="card">
                <ParallaxImage src={p.image} alt={p.title} height={260} intensity={55} />
                <div style={{ marginTop: 12 }}>
                  <div className="cardTitle">{p.title}</div>
                  <p className="p">{p.summary}</p>
                  <div className="quote">“{p.quote}”</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div style={{ marginTop: 16 }}>
            <Link to="/projects">
              <Button variant="outline">View all projects</Button>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
