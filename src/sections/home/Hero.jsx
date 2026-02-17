import React from "react";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import Reveal from "../../components/ui/Reveal";
import ParallaxImage from "../../components/ui/ParallaxImage";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      <Container className="heroInner">
        <div>
          <Reveal>
            <div className="kicker">Ikorodu, Lagos • Safety-first • Authentic only</div>
            <h1 className="h1">Powering Homes. Brightening Futures.</h1>
            <p className="p">
              Professional electrical wiring, solar & inverter installations, CCTV, smart home systems —
              delivered with neat finishing and safety standards.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="heroCtas">
              <a className="btn primary" href="tel:+2347032258039">Call Now</a>
              <a className="btn outline" target="_blank" rel="noreferrer" href="https://wa.me/2347032258039">
                WhatsApp
              </a>
              <Link to="/quote">
                <Button variant="primary">Get a Quote</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="heroBadges">
              <span className="pill">Load balancing expertise</span>
              <span className="pill">Neat conduit routing</span>
              <span className="pill">Authentic materials only</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ParallaxImage
            alt="Premium electrical finishing"
            height={420}
            intensity={70}
            src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=2400&q=80"
          />
        </Reveal>
      </Container>
    </section>
  );
}
