import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import cardStyles from "@/components/projects/ProjectCard.module.css";
import JsonLd from "@/components/seo/JsonLd";
import { buildProjectPath, getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/projects";
import { buildMetadata } from "@/lib/seo";
import { buildProjectSchema } from "@/lib/structured-data";
import styles from "./ProjectDetailPage.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return buildMetadata({
      title: "Project Not Found",
      description: "Project details from Oduzz Electrical Concept in Lagos, Nigeria.",
      path: `/projects/${slug}`,
    });
  }

  return buildMetadata({
    title: `${project.title} | ${project.location}`,
    description: `${project.summary} ${project.outcome} Delivered by Oduzz Electrical Concept in ${project.location}.`,
    path: buildProjectPath(project),
    keywords: [
      `${project.category} project Lagos`,
      project.location,
      "electrical installation Lagos",
      "Oduzz Electrical Concept projects",
    ],
    image: project.image,
  });
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  const relatedProjects = getAllProjects()
    .filter((item) => item.slug !== project.slug)
    .slice(0, 3);

  return (
    <section className="section seoPage">
      <JsonLd data={buildProjectSchema(project)} />
      <Container>
        <Link href="/projects" className="productDetailBackLink">
          Back to projects
        </Link>

        <div className={styles.hero}>
          <div className={cn("card", styles.mediaCard)}>
            <div className={cn(cardStyles.media, cardStyles.mediaLarge)}>
              <Image
                src={project.image}
                alt={project.title}
                className={cardStyles.image}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
          </div>

          <div className={cn("card", styles.bodyCard)}>
            <p className="kicker">{project.category}</p>
            <h1 className="h1">{project.title}</h1>
            <p className="p">{project.summary}</p>

            <div className={styles.factsGrid}>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Location</span>
                <strong>{project.location}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Scope</span>
                <strong>{project.scope}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Duration</span>
                <strong>{project.duration}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Outcome</span>
                <strong>{project.outcome}</strong>
              </div>
            </div>

            <blockquote className={styles.quote}>
              <q>{project.quote}</q>
            </blockquote>

            <div className="seoActionRow">
              <a href={project.mapUrl} target="_blank" rel="noreferrer" className="btn outline">
                View location
              </a>
              <Link href="/quote" className="btn primary">
                Request similar work
              </Link>
            </div>
          </div>
        </div>

        {relatedProjects.length > 0 ? (
          <div className={styles.relatedSection}>
            <div className="sectionHeader">
              <div className="kicker">More Projects</div>
              <h2 className="h2">Related installations</h2>
            </div>

            <div className={cn("seoCardGrid", cardStyles.grid)}>
              {relatedProjects.map((item) => (
                <Link key={item.slug} href={buildProjectPath(item)} className={cn("card", cardStyles.card)}>
                  <div className={cardStyles.media}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      className={cardStyles.image}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className={cardStyles.body}>
                    <p className="kicker">{item.category}</p>
                    <h3 className="cardTitle">{item.title}</h3>
                    <p className="p">{item.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
