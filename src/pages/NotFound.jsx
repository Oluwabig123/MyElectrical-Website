import React from "react";
import Container from "../components/layout/Container";

export default function NotFound() {
  return (
    <section className="section">
      <Container>
        <div className="card">
          <div className="cardTitle">Page not found</div>
          <p className="p">The page you’re looking for does not exist.</p>
        </div>
      </Container>
    </section>
  );
}
