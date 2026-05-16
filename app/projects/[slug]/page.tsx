import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import cardStyles from "@/components/projects/ProjectCard.module.css";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import { getServicePageBySlug } from "@/data/service-pages";
import { buildProjectPath, getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/projects";
import {
  buildCollectionPath,
  type ProductCategoryKey,
  resolveProductCategory,
} from "@/lib/product-catalog";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema, buildProjectSchema } from "@/lib/structured-data";
import styles from "./ProjectDetailPage.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const PROJECT_SERVICE_MAP: Record<string, string> = {
  solar: "solar-inverter-installation",
  wiring: "residential-commercial-wiring",
  lighting: "lighting-interior-finishing",
};

function getProjectFaqs(project: { title: string; location: string; category: string; duration: string }) {
  return [
    {
      question: `Can Oduzz deliver a similar ${project.category.toLowerCase()} project in ${project.location}?`,
      answer:
        "Yes. Similar projects can be scoped based on your site conditions, load needs, and finishing expectations.",
    },
    {
      question: "What details help Oduzz scope this type of work faster?",
      answer:
        "Share location, intended outcome, timeline, and clear before-photos. That helps refine route, materials, and protection decisions earlier.",
    },
    {
      question: `How long does a project like this usually take?`,
      answer: `Typical duration depends on scope, but this featured project was completed in ${project.duration}.`,
    },
  ];
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
    title: `${project.title} | Electrical Installation in Lagos`,
    description: `${project.summary} ${project.outcome} Case study delivered in ${project.location} with verified electrical materials and safety-first execution.`,
    path: buildProjectPath(project),
    keywords: [
      `${project.category} project Lagos`,
      project.location,
      "electrical installation Lagos",
      "electrical installation in Lagos",
      "verified electrical materials",
      "authentic electrical products",
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

  const relatedService = getServicePageBySlug(
    PROJECT_SERVICE_MAP[project.category.toLowerCase()] ?? "",
  );

  const relatedCategories = (project.relatedCategoryKeys ?? [])
    .map((key) => resolveProductCategory(key as ProductCategoryKey))
    .filter((item): item is NonNullable<ReturnType<typeof resolveProductCategory>> => Boolean(item));

  const projectFaqs = getProjectFaqs(project);
  const faqSchema = buildFaqSchema(projectFaqs, { id: `${absoluteUrl(buildProjectPath(project))}#faq` });

  return (
    <section className="section seoPage">
      <JsonLd data={[...buildProjectSchema(project), faqSchema]} />
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

        <section className={styles.caseStudySection}>
          <h2 className="h2">Case study breakdown</h2>
          <div className={styles.caseStudyGrid}>
            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Client problem</h3>
              <p className="p">{project.clientProblem}</p>
            </article>

            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Site condition</h3>
              <p className="p">{project.siteCondition}</p>
            </article>
          </div>

          <div className={styles.caseStudyColumns}>
            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Work completed</h3>
              <ul className={styles.caseList}>
                {project.workCompleted.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Materials and solutions used</h3>
              <ul className={styles.caseList}>
                {project.materialsSolutions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Safety and protection decisions</h3>
              <ul className={styles.caseList}>
                {project.safetyDecisions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={cn("card", styles.caseCard)}>
              <h3 className="cardTitle">Final outcome</h3>
              <p className="p">{project.finalOutcome}</p>
              <div className="seoActionRow">
                <Link href="/quote" className="btn primary">
                  Request similar work
                </Link>
              </div>
            </article>
          </div>
        </section>

        {project.evidence.length > 0 ? (
          <section className={styles.evidenceSection}>
            <h2 className="h2">Before, during, and after evidence</h2>
            <div className={styles.evidenceGrid}>
              {project.evidence.map((entry) => (
                <article key={`${entry.phase}-${entry.title}`} className={cn("card", styles.evidenceCard)}>
                  <div className={styles.evidenceMedia}>
                    <Image
                      src={entry.image}
                      alt={`${entry.phase} evidence for ${project.title}`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className={styles.evidenceBody}>
                    <p className="kicker">{entry.phase}</p>
                    <h3 className="cardTitle">{entry.title}</h3>
                    <p className="p">{entry.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

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

        <section className="seoContentSection">
          <h2 className="h2">Related products and services</h2>
          <div className="seoActionRow">
            {relatedService ? (
              <Link href={`/services/${relatedService.slug}`} className="btn outline">
                {relatedService.shortTitle}
              </Link>
            ) : null}
            {relatedCategories.map((category) => (
              <Link key={category.key} href={buildCollectionPath(category.key)} className="btn outline">
                {category.label}
              </Link>
            ))}
            <Link href="/projects" className="btn outline">
              More case studies
            </Link>
            <Link href="/quote" className="btn primary">
              Request similar work
            </Link>
          </div>
        </section>

        <section className="seoContentSection">
          <h2 className="h2">Project FAQs</h2>
          <FaqAccordion items={projectFaqs} />
        </section>
      </Container>
    </section>
  );
}
