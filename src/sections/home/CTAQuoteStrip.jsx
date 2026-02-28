import React from "react";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { CONTACT_LINKS } from "../../data/contact.js";

export default function CTAQuoteStrip() {
  return (
    <section className="ctaStrip">
      <Container className="ctaStripInner">
        <div>
          <div className="ctaTitle">Need an electrician?</div>
          <div className="muted">Call now or request a quick quote.</div>
        </div>
        <div className="ctaActions">
          <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
          <Link to="/quote"><Button variant="primary">Request Quote</Button></Link>
        </div>
      </Container>
    </section>
  );
}
