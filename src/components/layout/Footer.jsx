import React from "react";
import { Link } from "react-router-dom";
import Container from "./Container.jsx";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container className="footerShell">
        <div className="footerTop">
          <div className="footerBrandBlock">
            <span className="footerTraceWrap" aria-hidden="true">
              <svg className="footerTrace" viewBox="0 0 100 100" preserveAspectRatio="none">
                <rect className="footerTracePath" x="1" y="1" width="98" height="98" pathLength="100" />
              </svg>
            </span>
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
            <Link className="footerLink" to="/about">About</Link>
            <Link className="footerLink" to="/quote">Get a Quote</Link>
            <Link className="footerLink" to="/contact">Contact</Link>
          </div>

          <div className="footerCol">
            <div className="footerTitle">Contact</div>
            <a className="footerLink" href="tel:+2347032258039">07032258039</a>
            <a className="footerLink" href="mailto:tobiloba428@gmail.com">tobiloba428@gmail.com</a>
            <a
              className="footerLink"
              target="_blank"
              rel="noreferrer"
              href="https://wa.me/2347032258039"
            >
              WhatsApp Chat
            </a>
            <a
              className="footerLink footerLinkHighlight"
              href="https://wa.me/2347032258039"
              target="_blank"
              rel="noreferrer"
            >
              Start a Quick Consultation
            </a>
          </div>
        </div>
      </Container>

      <div className="footerBottom">
        <Container className="footerBottomInner">
          <span className="muted">© {year} Oduzz Electrical Concept</span>
          <span className="muted">Safety-first • Authentic materials only</span>
        </Container>
      </div>
    </footer>
  );
}
