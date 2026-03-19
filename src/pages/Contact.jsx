import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import { CONTACT, CONTACT_LINKS } from "../data/contact.js";

export default function Contact() {
  return (
    <section className="section contactPage">
      <Container>
        <SectionHeader
          kicker="Contact"
          title="Reach Oduzz"
          subtitle="Call, email, or chat with us on WhatsApp."
        />

        {/* Core contact channels shown as separate action cards. */}
        <div className="contactGrid">
          <article className="card contactCard">
            <div className="cardTitle">Phone</div>
            <a className="contactLink" href={CONTACT_LINKS.phone}>{CONTACT.phoneDisplay}</a>
            <p className="contactMeta">Best for urgent electrical issues and immediate booking.</p>
          </article>

          <article className="card contactCard">
            <div className="cardTitle">Email</div>
            <a className="contactLink" href={CONTACT_LINKS.email}>{CONTACT.email}</a>
            <p className="contactMeta">Use email for project details and documentation.</p>
          </article>

          <article className="card contactCard">
            <div className="cardTitle">WhatsApp</div>
            <a className="contactLink" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
              Chat on WhatsApp
            </a>
            <p className="contactMeta">Typical response: {CONTACT.whatsappResponseTime}.</p>
          </article>

          <article className="card contactCard contactCardAccent">
            <div className="cardTitle">Service Hours</div>
            <p className="contactMeta">{CONTACT.businessHours}</p>
            <p className="contactMeta">Ikorodu, Lagos, Nigeria</p>
            <div className="contactCardActions">
              <a className="btn outline" href={CONTACT_LINKS.phone}>Call now</a>
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </article>
        </div>

        {/* Quick fallback action for the fastest support channel. */}
        <div className="contactFoot">
          <p className="contactNote">Need fast support? WhatsApp is the quickest channel.</p>
          <a className="btn outline" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
            Open WhatsApp
          </a>
        </div>
      </Container>
    </section>
  );
}
