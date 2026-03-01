import React from "react";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { CONTACT, CONTACT_LINKS } from "../../data/contact.js";

export default function CTAQuoteStrip() {
  return (
    <section className="ctaStrip">
      <Container>
        <div className="ctaStripInner">
          <div className="ctaCopy">
            <p className="ctaEyebrow">Fast response</p>
            <div className="ctaTitle">Need an electrician?</div>
            <p className="ctaLead">Call now or request a quick quote for wiring, solar, CCTV, and lighting.</p>
            <p className="ctaMeta">
              Typical WhatsApp response: {CONTACT.whatsappResponseTime} ({CONTACT.businessHours}).
            </p>
          </div>
          <div className="ctaActions">
            <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
            <Link to="/quote"><Button variant="primary">Request Quote</Button></Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
