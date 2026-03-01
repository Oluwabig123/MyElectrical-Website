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
    <section className="section storiesPreview">
      <Container>
        <SectionHeader
          kicker="Proof of work"
          title="Recent projects"
          subtitle="A few completed jobs."
        />

        <div className="storiesGrid">
          {projects.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <article className="card storiesCard">
                <ParallaxImage src={p.image} alt={p.title} height={260} intensity={55} />
                <div className="storiesCardBody">
                  <div className="cardTitle">{p.title}</div>
                  <p className="p">{p.summary}</p>
                  {p.outcome ? <p className="projectOutcome">{p.outcome}</p> : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="storiesActions">
            <Link to="/projects">
              <Button variant="outline">View projects</Button>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
