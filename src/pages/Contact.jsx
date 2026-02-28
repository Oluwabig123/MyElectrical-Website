import React from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import { CONTACT, CONTACT_LINKS } from "../data/contact.js";

export default function Contact() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Contact"
          title="Reach Oduzz"
          subtitle="Call or chat with us."
        />

        <div className="grid-3">
          <div className="card">
            <div className="cardTitle">Phone</div>
            <a className="link" href={CONTACT_LINKS.phone}>{CONTACT.phoneDisplay}</a>
          </div>

          <div className="card">
            <div className="cardTitle">Email</div>
            <a className="link" href={CONTACT_LINKS.email}>{CONTACT.email}</a>
          </div>

          <div className="card">
            <div className="cardTitle">WhatsApp</div>
            <a className="link" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
