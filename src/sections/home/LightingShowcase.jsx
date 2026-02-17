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
    desc: "Straight, balanced light channels with clean edge finishing and proper circuit separation.",
    tags: ["Aligned layout", "Neat channels", "Safe terminations"],
    src: "https://images.unsplash.com/photo-1540932239986-30128078f3c1?auto=format&fit=crop&w=2400&q=80",
  },
  {
    projectId: "lighting-chandelier-1",
    title: "Chandelier Installation",
    desc: "Accurate centering, reinforced mounting points, and concealed routing for a polished look.",
    tags: ["Centerline accuracy", "Reinforced support", "Hidden wiring"],
    src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2400&q=80",
  },
  {
    projectId: "lighting-accent-1",
    title: "Decorative Accent Lighting",
    desc: "Layered warm and task lighting that upgrades ambiance without compromising safety.",
    tags: ["Mood layering", "Glare control", "Code-compliant setup"],
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2400&q=80",
  },
];

export default function LightingShowcase() {
  return (
    <section className="section lightingShowcase">
      <Container>
        <SectionHeader
          kicker="Interior finishing"
          title="Precision lighting that completes your interior"
          subtitle="From POP line lights to chandeliers and modern fixtures, every install is aligned, neat, and safety-checked."
        />

        <Reveal>
          <div className="lightingMarquee" aria-label="Interior finishing moving gallery">
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
                      <span className="lightingMarqueeDesc">{it.desc}</span>
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
                      <span className="lightingMarqueeDesc">{it.desc}</span>
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

                <div className="lightingTags" aria-label={`${it.title} highlights`}>
                  {it.tags.map((tag) => (
                    <span key={tag} className="lightingTag">{tag}</span>
                  ))}
                </div>

                <div className="lightingCardMedia">
                  <ParallaxImage src={it.src} alt={it.title} height={280} intensity={60} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14}>
          <div className="lightingActions">
            <Link to="/projects"><Button variant="outline">See lighting projects</Button></Link>
            <Link to="/quote"><Button variant="primary">Get a Quote</Button></Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
