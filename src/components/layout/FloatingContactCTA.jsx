import React from "react";

export default function FloatingContactCTA() {
  return (
    <div className="floatCta" role="region" aria-label="Quick contact">
      <a className="floatBtn" href="tel:+2347032258039">Call</a>
      <a className="floatBtn primary" target="_blank" rel="noreferrer" href="https://wa.me/2347032258039">
        WhatsApp
      </a>
    </div>
  );
}
