import React from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import Reveal from "../../components/ui/Reveal";
import ParallaxImage from "../../components/ui/ParallaxImage";
import { CONTACT_LINKS } from "../../data/contact.js";

export default function Hero() {
  return (
    <section className="hero">
      <Container className="heroInner">
        <div>
          <Reveal>
            <div className="kicker">Ikorodu, Lagos | Licensed Electricians</div>
            <h1 className="h1">Powering Homes. Brightening Futures.</h1>
            <p className="p">
              Wiring, solar/inverter, CCTV, and lighting installed to code with neat finishing.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="heroCtas">
              <Link to="/quote">
                <Button variant="primary">Request Quote</Button>
              </Link>
              <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
            </div>
            <p className="heroTrust">
              Reply in about 10 minutes on WhatsApp (8:00am to 8:00pm WAT).
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="heroBadges">
              <span className="pill">Licensed team</span>
              <span className="pill">Balanced circuits</span>
              <span className="pill">Neat routing</span>
              <span className="pill">Authentic materials</span>
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

