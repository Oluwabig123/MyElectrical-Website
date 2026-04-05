import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";

const points = [
  { title: "Safety-first installs", description: "Correct protection and proper cable sizing." },
  { title: "Clean finishing", description: "Neat routing with tidy final delivery." },
  { title: "Reliable updates", description: "Clear communication from start to finish." },
] as const;

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
          {points.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.04}>
              <article className="card whyOduzzCard">
                <span className="whyOduzzIndex">0{index + 1}</span>
                <h3 className="cardTitle whyOduzzTitle">{point.title}</h3>
                <p className="p">{point.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
