import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <section className="section notFoundPage">
      <Container>
        {/* Recovery actions guide users back into valid site routes. */}
        <article className="card notFoundCard">
          <p className="notFoundCode">404</p>
          <h1 className="h2 notFoundTitle">Page not found</h1>
          <p className="p notFoundText">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="notFoundActions">
            <Link to="/">
              <Button variant="primary">Go home</Button>
            </Link>
            <Link to="/services">
              <Button variant="outline">View services</Button>
            </Link>
            <Link to="/quote">
              <Button variant="outline">Request quote</Button>
            </Link>
          </div>
        </article>
      </Container>
    </section>
  );
}
