import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import ParallaxImage from "@/components/ui/ParallaxImage";
import { projects } from "@/data/projects";

export default function Stories() {
  const leadProject = projects[0];
  const supportingProjects = projects.slice(1, 3);

  return (
    <section className="section storiesPreview">
      <Container>
        <SectionHeader
          kicker="Proof of work"
          title="Recent projects"
          subtitle="A quick look at the standard of finish."
        />

        <div className="storiesMosaic">
          {leadProject ? (
            <Reveal delay={0.02}>
              <article className="storiesFeature">
                <ParallaxImage src={leadProject.image} alt={leadProject.title} height={460} />
                <div className="storiesFeatureBody">
                  <p className="kicker">{leadProject.category}</p>
                  <div className="storiesFeatureTitle">{leadProject.title}</div>
                  <p className="storiesFeatureMeta">
                    {leadProject.location} | {leadProject.duration}
                  </p>
                  <p className="storiesFeatureScope">{leadProject.scope}</p>
                  <Link href={`/projects/${leadProject.id}`} className="btn primary">
                    View case study
                  </Link>
                </div>
              </article>
            </Reveal>
          ) : null}

          <div className="storiesRail">
            {supportingProjects.map((project, index) => (
              <Reveal key={project.id} delay={0.08 + index * 0.05}>
                <article className="storiesRailCard">
                  <ParallaxImage src={project.image} alt={project.title} height={220} />
                  <div className="storiesCardBody">
                    <p className="kicker">{project.category}</p>
                    <div className="cardTitle">{project.title}</div>
                    <p className="seoMetaLine">
                      {project.location} | {project.duration}
                    </p>
                    <Link href={`/projects/${project.id}`} className="storiesRailLink">
                      Open project
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
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
