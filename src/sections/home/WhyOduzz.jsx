import React from "react";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";

const points = [
  { t: "Safety-first installs", d: "Correct protection and proper cable sizing." },
  { t: "Clean finishing", d: "Neat routing with tidy final delivery." },
  { t: "Reliable updates", d: "Clear communication from start to finish." },
];

export default function WhyOduzz() {
  return (
    <section className="section whyOduzz">
      <Container>
        <SectionHeader
          kicker="Why Oduzz"
          title="Why clients choose Oduzz"
          subtitle="Safe work. Clean delivery."
        />

        <div className="whyOduzzGrid">
          {points.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.04}>
              <article className="card whyOduzzCard">
                <span className="whyOduzzIndex">0{i + 1}</span>
                <h3 className="cardTitle whyOduzzTitle">{p.t}</h3>
                <p className="p">{p.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
