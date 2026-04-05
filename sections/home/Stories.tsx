import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import ParallaxImage from "@/components/ui/ParallaxImage";
import { projects } from "@/data/projects";

export default function Stories() {
  return (
    <section className="section storiesPreview">
      <Container>
        <SectionHeader
          kicker="Proof of work"
          title="Recent projects"
          subtitle="A few completed jobs."
        />

        <div className="storiesGrid">
          {projects.slice(0, 3).map((project, index) => (
            <Reveal key={project.id} delay={index * 0.05}>
              <article className="card storiesCard">
                <ParallaxImage src={project.image} alt={project.title} height={260} />
                <div className="storiesCardBody">
                  <div className="cardTitle">{project.title}</div>
                  <p className="p">{project.summary}</p>
                  {project.outcome ? <p className="projectOutcome">{project.outcome}</p> : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="storiesActions">
            <Link href="/projects" className="btn outline">
              View projects
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
