import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import Container from "./Container.jsx";
import Button from "../ui/Button.jsx";

const navItems = [
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Container className="navInner">
        <Link to="/" className="brand" aria-label="Oduzz Electrical Concept home">
          <span className="brandTraceWrap" aria-hidden="true">
            <svg className="brandTrace" viewBox="0 0 100 36" preserveAspectRatio="none">
              <rect className="brandTracePath" x="1" y="1" width="98" height="34" pathLength="100" />
            </svg>
          </span>
          <img
            className="brandLogo"
            src="/oduzz-logo-transparent.png"
            alt="Oduzz Electrical Concept"
            loading="eager"
            decoding="async"
          />
        </Link>

        <nav className="navLinks" aria-label="Primary">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="navCtas">
          <Link to="/quote" className="navTopQuote">
            <Button variant="primary">Get a Quote</Button>
          </Link>
          <button
            className="navBurger"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </Container>

      {open ? (
        <div className="navMobile" id="mobile-menu">
          <Container className="navMobileInner">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `navMobileLink ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/quote" onClick={() => setOpen(false)}>
              <Button variant="primary" style={{ width: "100%" }}>Get a Quote</Button>
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
