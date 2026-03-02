import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { CONTACT } from "../data/contact";
import { cableProducts } from "../data/products";

export default function Products() {
  return (
    <section className="section productsPage">
      <Container>
        <SectionHeader
          kicker="Products"
          title="Available electrical products"
          subtitle="Now available: electrical cable sizes from 1mm to 16mm."
        />

        <div className="productsGrid">
          {cableProducts.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04}>
              <article className="card productsCard">
                <span className="productsIndex">0{index + 1}</span>
                <h3 className="cardTitle productsTitle">{item.name}</h3>
                <p className="p">{item.bestFor}</p>
                <div className="productsMeta" aria-label={`${item.name} specifications`}>
                  <span className="productsChip">Size: {item.size}</span>
                  <span className="productsChip">{item.type}</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14}>
          <div className="productsFoot">
            <p className="productsNote">
              Need help selecting the right cable size? We respond in {CONTACT.whatsappResponseTime}.
            </p>
            <div className="productsActions">
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
