import React from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";

export default function Contact() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Contact"
          title="Reach Oduzz"
          subtitle="We respond fast on WhatsApp and calls."
        />

        <div className="grid-3">
          <div className="card">
            <div className="cardTitle">Phone</div>
            <a className="link" href="tel:+2347032258039">07032258039</a>
          </div>

          <div className="card">
            <div className="cardTitle">Email</div>
            <a className="link" href="mailto:tobiloba428@gmail.com">tobiloba428@gmail.com</a>
          </div>

          <div className="card">
            <div className="cardTitle">WhatsApp</div>
            <a className="link" target="_blank" rel="noreferrer" href="https://wa.me/2347032258039">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
