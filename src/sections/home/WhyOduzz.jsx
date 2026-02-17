import React from "react";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";

const points = [
  { t: "Safety-first installations", d: "Correct protection, proper cable sizing, and structured distribution." },
  { t: "Load balancing expertise", d: "Circuits planned to avoid overloads and reduce faults." },
  { t: "Authentic materials only", d: "We recommend genuine components for durability and safety." },
  { t: "Neat finishing", d: "Clean routing, proper trunking, and a professional final look." },
  { t: "Customer satisfaction", d: "Clear communication and reliable delivery." },
];

export default function WhyOduzz() {
  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Why Oduzz"
          title="Professional work you can trust"
          subtitle="We combine clean workmanship with safety standards — because electricity must be done right."
        />

        <div className="grid-3">
          {points.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.04}>
              <div className="card">
                <div className="cardTitle">{p.t}</div>
                <p className="p">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
