import React from "react";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import ParallaxImage from "../../components/ui/ParallaxImage";
import SmartImage from "../../components/ui/SmartImage";
import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";

const lightingItems = [
  {
    projectId: "lighting-pop-1",
    title: "POP Line Lighting",
    desc: "Straight channels, clean edges, and safe circuit separation.",
    src: "https://images.unsplash.com/photo-1540932239986-30128078f3c1?auto=format&fit=crop&w=2400&q=80",
  },
  {
    projectId: "lighting-chandelier-1",
    title: "Chandelier Installation",
    desc: "Accurate centering, reinforced mounting, and concealed routing.",
    src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2400&q=80",
  },
  {
    projectId: "lighting-accent-1",
    title: "Decorative Accent Lighting",
    desc: "Layered ambient and task lighting with controlled glare.",
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2400&q=80",
  },
];

export default function LightingShowcase() {
  return (
    <section className="section lightingShowcase">
      <Container>
        <SectionHeader
          kicker="Interior finishing"
          title="Lighting highlights"
          subtitle="POP lines, chandeliers, and accent setups."
        />

        <Reveal>
          <div className="lightingMarquee" aria-label="Lighting project gallery">
            <div className="lightingMarqueeTrack">
              <div className="lightingMarqueeGroup">
                {lightingItems.map((it) => (
                  <figure key={`group-a-${it.title}`} className="lightingMarqueeItem">
                    <Link
                      to={`/projects?project=${it.projectId}`}
                      className="lightingMarqueeLink"
                      aria-label={`View ${it.title} information and location`}
                    >
                      <SmartImage src={it.src} alt={it.title} />
                    </Link>
                    <figcaption className="lightingMarqueeCaption">
                      <span className="lightingMarqueeTitle">{it.title}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="lightingMarqueeGroup" aria-hidden="true">
                {lightingItems.map((it) => (
                  <figure key={`group-b-${it.title}`} className="lightingMarqueeItem">
                    <Link
                      to={`/projects?project=${it.projectId}`}
                      className="lightingMarqueeLink"
                      aria-label={`View ${it.title} information and location`}
                    >
                      <SmartImage src={it.src} alt={it.title} />
                    </Link>
                    <figcaption className="lightingMarqueeCaption">
                      <span className="lightingMarqueeTitle">{it.title}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid-3 lightingGrid">
          {lightingItems.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.05}>
              <article className="card lightingCard">
                <div className="cardTitle">{it.title}</div>
                <p className="p">{it.desc}</p>

                <div className="lightingCardMedia">
                  <ParallaxImage src={it.src} alt={it.title} height={280} intensity={60} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14}>
          <div className="lightingActions">
            <Link to="/projects"><Button variant="outline">View projects</Button></Link>
            <Link to="/quote"><Button variant="primary">Get quote</Button></Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
