import React from "react";
import { Link } from "react-router-dom";
import { CONTACT, CONTACT_LINKS } from "../../data/contact.js";
import Container from "./Container.jsx";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container className="footerShell">
        <div className="footerTop">
          <div className="footerBrandBlock">
            <img
              className="footerLogo"
              src="/oduzz-logo-transparent.png"
              alt="Oduzz Electrical Concept"
              loading="lazy"
              decoding="async"
            />
            <p className="footerTagline">Powering Homes. Brightening Futures.</p>
            <p className="footerLocation">Ikorodu, Lagos, Nigeria</p>
            <div className="footerBadges">
              <span className="footerBadge">Licensed Electricians</span>
              <span className="footerBadge">Safety-First Installs</span>
            </div>
          </div>

          <div className="footerCol">
            <div className="footerTitle">Quick Links</div>
            <Link className="footerLink" to="/services">Services</Link>
            <Link className="footerLink" to="/projects">Projects</Link>
            <Link className="footerLink" to="/assistant">Assistant</Link>
            <Link className="footerLink" to="/about">About</Link>
            <Link className="footerLink" to="/quote">Request Quote</Link>
            <Link className="footerLink" to="/contact">Contact</Link>
          </div>

          <div className="footerCol">
            <div className="footerTitle">Contact</div>
            <a className="footerLink" href={CONTACT_LINKS.phone}>{CONTACT.phoneDisplay}</a>
            <a className="footerLink" href={CONTACT_LINKS.email}>{CONTACT.email}</a>
            <p className="footerMeta">Hours: {CONTACT.businessHours}</p>
            <p className="footerMeta">Typical response: {CONTACT.whatsappResponseTime} on WhatsApp</p>
            <a className="footerLink" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
              WhatsApp Chat
            </a>
            <a
              className="footerLink footerLinkHighlight"
              href={CONTACT_LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Start Quick Consultation
            </a>
          </div>
        </div>
      </Container>

      <div className="footerBottom">
        <Container className="footerBottomInner">
          <span className="muted">{"\u00C2\u00A9"} {year} Oduzz Electrical Concept</span>
          <span className="muted">Safety-first {"\u00E2\u20AC\u00A2"} Authentic materials only</span>
        </Container>
      </div>
    </footer>
  );
}
