import React from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import ParallaxImage from "../../components/ui/ParallaxImage";
import Button from "../../components/ui/Button";
import { projects } from "../../data/projects";

export default function Stories() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Proof of work"
          title="Recent projects"
          subtitle="A few completed jobs."
        />

        <div className="grid-3">
          {projects.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <article className="card">
                <ParallaxImage src={p.image} alt={p.title} height={260} intensity={55} />
                <div style={{ marginTop: 12 }}>
                  <div className="cardTitle">{p.title}</div>
                  <p className="p">{p.summary}</p>
                  {p.outcome ? <p className="projectOutcome">{p.outcome}</p> : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div style={{ marginTop: 16 }}>
            <Link to="/projects">
              <Button variant="outline">View projects</Button>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
