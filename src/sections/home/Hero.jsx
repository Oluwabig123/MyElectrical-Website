import React from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import Reveal from "../../components/ui/Reveal";
import { CONTACT_LINKS } from "../../data/contact.js";
import { projects } from "../../data/projects.js";

export default function Hero() {
  const heroSlides = projects.slice(0, 5);
  const marqueeSlides = heroSlides.length > 1 ? [...heroSlides, ...heroSlides] : heroSlides;
  const marqueeTrackClass = `heroSlidesTrack${heroSlides.length > 1 ? "" : " isStatic"}`;

  return (
    <section className="hero">
      <Container>
        <div className="heroStage">
          <div className="heroSlides" aria-hidden="true">
            <div className={marqueeTrackClass}>
              {marqueeSlides.map((slide, index) => (
                <figure key={`${slide.id}-${index}`} className="heroSlide">
                  <img src={slide.image} alt="" loading="lazy" decoding="async" />
                </figure>
              ))}
            </div>
          </div>

          <div className="heroOverlay" aria-hidden="true" />

          <div className="heroContent">
            <Reveal>
              <h1 className="h1">Premium Electrical Installation.</h1>
              <p className="p">Wiring, solar/inverter, CCTV, and lighting done right.</p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="heroCtas">
                <Link to="/quote">
                  <Button variant="primary">Request Quote</Button>
                </Link>
                <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

