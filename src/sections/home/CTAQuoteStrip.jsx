import React from "react";
import Container from "../../components/layout/Container";
import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";

export default function CTAQuoteStrip() {
  return (
    <section className="ctaStrip">
      <Container className="ctaStripInner">
        <div>
          <div className="ctaTitle">Ready to start your project?</div>
          <div className="muted">Get a clean, safety-first installation with authentic materials.</div>
        </div>
        <div className="ctaActions">
          <a className="btn outline" href="tel:+2347032258039">Call</a>
          <Link to="/quote"><Button variant="primary">Request Quote</Button></Link>
        </div>
      </Container>
    </section>
  );
}
