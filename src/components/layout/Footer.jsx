import React from "react";
import { Link } from "react-router-dom";
import { CONTACT, CONTACT_LINKS } from "../../data/contact.js";
import Container from "./Container.jsx";

const quickLinks = [
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Blog" },
  { to: "/academy", label: "Academy" },
  { to: "/products", label: "Products" },
  { to: "/test-your-memory", label: "Test Your Memory" },
  { to: "/projects", label: "Projects" },
  { to: "/assistant", label: "Assistant" },
  { to: "/about", label: "About" },
  { to: "/quote", label: "Request Quote" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container className="footerShell">
        <div className="footerTop">
          <section className="footerBrandBlock" aria-label="Business information">
            <img
              className="footerLogo"
              src="/oduzz-logo-transparent.webp"
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
          </section>

          <nav className="footerCol footerLinksCol" aria-label="Footer quick links">
            <div className="footerTitle">Quick Links</div>
            <div className="footerLinksGrid">
              {quickLinks.map((item) => (
                <Link key={item.to} className="footerLink" to={item.to}>{item.label}</Link>
              ))}
            </div>
          </nav>

          <div className="footerCol footerContactCol">
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
          <span className="muted">&copy; {year} Oduzz Electrical Concept</span>
          <span className="muted">Safety-first | Authentic materials only</span>
        </Container>
      </div>
    </footer>
  );
}
