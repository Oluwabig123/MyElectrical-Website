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
          subtitle="Selected installations that show cleaner finishing, safer execution, and stronger handover quality."
        />

        <div className="storiesGrid">
          {projects.slice(0, 3).map((project, index) => (
            <Reveal key={project.id} delay={index * 0.05}>
              <article className="card storiesCard">
                <ParallaxImage src={project.image} alt={project.title} height={260} />
                <div className="storiesCardBody">
                  <p className="kicker">{project.category}</p>
                  <div className="cardTitle">{project.title}</div>
                  <p className="p">{project.summary}</p>
                  <p className="seoMetaLine">
                    {project.location} | {project.duration} | {project.scope}
                  </p>
                  {project.outcome ? <p className="projectOutcome">{project.outcome}</p> : null}
                  <div className="storiesActions">
                    <Link href={`/projects/${project.id}`} className="btn outline">
                      View case study
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="storiesActions">
            <Link href="/projects" className="btn outline">
              View all case studies
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
