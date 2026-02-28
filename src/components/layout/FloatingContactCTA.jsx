import React from "react";
import { Link } from "react-router-dom";
import { CONTACT_LINKS } from "../../data/contact.js";

export default function FloatingContactCTA() {
  return (
    <div className="floatCta" role="region" aria-label="Quick contact">
      <Link className="floatBtn assistantMobileBtn" to="/assistant">Oduzz Assistant</Link>
      <div className="floatCtaRight">
        <Link className="floatBtn quoteDesktopBtn" to="/quote">Quote</Link>
        <a className="floatBtn" href={CONTACT_LINKS.phone}>Call</a>
        <a className="floatBtn primary" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
