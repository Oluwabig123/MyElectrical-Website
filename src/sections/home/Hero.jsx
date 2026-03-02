import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import Reveal from "../../components/ui/Reveal";
import { CONTACT_LINKS } from "../../data/contact.js";
import { heroGallery } from "../../data/heroGallery.js";

const HERO_ROTATE_MS = 5000;

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (heroGallery.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroGallery.length);
    }, HERO_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <Container>
        <div className="heroStage">
          <div className="heroGallery" aria-hidden="true">
            {heroGallery.map((item, index) => (
              <figure
                key={item.id}
                className={`heroGalleryItem${index === activeIndex ? " active" : ""}`}
              >
                <img src={item.image} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" />
              </figure>
            ))}
          </div>

          <div className="heroOverlay" aria-hidden="true" />

          <div className="heroContent">
            <Reveal>
              <h1 className="h1">Premium Electrical Installation</h1>
              <p className="p">Residential and commercial wiring, solar & inverter installation, and CCTV security systems.</p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="heroCtas">
                <Link to="/quote">
                  <Button variant="primary">Request Quote</Button>
                </Link>
                <a className="btn outline heroCallBtn" href={CONTACT_LINKS.phone}>Call</a>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
