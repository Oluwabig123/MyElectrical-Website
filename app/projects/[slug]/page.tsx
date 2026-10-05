import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/ui/FaqAccordion";
import Reveal from "@/components/ui/Reveal";
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
        "Yes. Similar projects can be scoped based on your site conditions, load profile, and finishing expectations.",
    },
    {
      question: "What details help Oduzz scope this work faster?",
      answer:
        "Share location, intended outcome, timing, and clear site photos. That helps refine route, materials, and protection decisions earlier.",
    },
    {
      question: `How long does an installation like this take?`,
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
    <section className={styles.page}>
      <JsonLd data={[...buildProjectSchema(project), faqSchema]} />
      <Container>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.crumbDivider}>/</span>
          <Link href="/projects">Projects</Link>
          <span className={styles.crumbDivider}>/</span>
          <span className={styles.crumbCurrent}>{project.title}</span>
        </nav>

        {/* Hero Section */}
        <Reveal delay={0.04}>
          <div className={styles.heroGrid}>
            <div className={styles.mediaCard}>
              <Image
                src={project.image}
                alt={project.title}
                fill
                priority
                sizes="(max-width: 980px) 100vw, 58vw"
                className={styles.mediaImage}
              />
              <div className={styles.mediaOverlay} aria-hidden="true" />
              <div className={styles.mediaContent}>
                <span className={styles.categoryBadge}>{project.category} Project</span>
                <h1 className={styles.heroTitle}>{project.title}</h1>
                <p className={styles.heroSummary}>{project.summary}</p>
              </div>
            </div>

            <div className={styles.quickSpecsCard}>
              <div className={styles.specHeader}>
                <span className={styles.specEyebrow}>Installation Matrix</span>
                <h2 className={styles.specTitle}>Project Snapshot</h2>
              </div>

              <div className={styles.specsList}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Location</span>
                  <span className={styles.specValue}>
                    {project.location}
                    {project.mapUrl && (
                      <a
                        href={project.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.mapLink}
                      >
                        (View on Map)
                      </a>
                    )}
                  </span>
                </div>

                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Project Scope</span>
                  <span className={styles.specValue}>{project.scope}</span>
                </div>

                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Turnaround Duration</span>
                  <span className={styles.specValue}>{project.duration}</span>
                </div>

                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Key Deliverable</span>
                  <span className={styles.specValue}>{project.outcome}</span>
                </div>
              </div>

              {project.quote && (
                <div className={styles.siteQuote}>
                  <q>{project.quote}</q>
                </div>
              )}

              <div className={styles.specActions}>
                <Link href={`/quote?project=${project.id}`} className="btn primary">
                  Request Similar Installation
                </Link>
                <a
                  href={`https://wa.me/2348149723223?text=Hello%20Oduzz,%20I'm%20asking%20about%20the%20${encodeURIComponent(project.title)}%20project.`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.specWhatsApp}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.532 1.942.847 2.796.847 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.733-5.768-5.733zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.456-.475-4.914-1.306l-5.086 1.333 1.357-4.957c-.914-1.503-1.428-3.262-1.428-5.07 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                  <span>Chat with Project Lead</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Site Challenge & Layout Realities */}
        <Reveal delay={0.08}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>Context & Problem</span>
              <h2 className={styles.sectionTitle}>The On-Site Challenge</h2>
              <p className={styles.sectionIntro}>
                Before mounting equipment or running cables, existing site constraints and customer concerns had to be isolated.
              </p>
            </div>

            <div className={styles.challengeGrid}>
              <article className={styles.challengeCard}>
                <div className={styles.challengeIconBox}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className={styles.challengeTitle}>Client Problem</h3>
                <p className={styles.challengeText}>{project.clientProblem}</p>
              </article>

              <article className={styles.challengeCard}>
                <div className={styles.challengeIconBox}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h3 className={styles.challengeTitle}>Site Condition & Constraints</h3>
                <p className={styles.challengeText}>{project.siteCondition}</p>
              </article>
            </div>
          </section>
        </Reveal>

        {/* 3-Pillar Technical Execution */}
        <Reveal delay={0.12}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>Engineering Delivery</span>
              <h2 className={styles.sectionTitle}>Technical Execution Protocol</h2>
              <p className={styles.sectionIntro}>
                How Oduzz designed, sourced, and executed this scope from start to finish.
              </p>
            </div>

            <div className={styles.executionGrid}>
              <article className={styles.executionCard}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIndex}>01</span>
                  <h3 className={styles.executionCardTitle}>Work Completed</h3>
                </div>
                <ul className={styles.executionList}>
                  {project.workCompleted.map((item, idx) => (
                    <li key={idx}>
                      <span className={styles.listDot} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className={styles.executionCard}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIndex}>02</span>
                  <h3 className={styles.executionCardTitle}>Materials & Solutions</h3>
                </div>
                <ul className={styles.executionList}>
                  {project.materialsSolutions.map((item, idx) => (
                    <li key={idx}>
                      <span className={styles.listDot} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className={styles.executionCard}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIndex}>03</span>
                  <h3 className={styles.executionCardTitle}>Safety & Protection</h3>
                </div>
                <ul className={styles.executionList}>
                  {project.safetyDecisions.map((item, idx) => (
                    <li key={idx}>
                      <span className={styles.listDot} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className={styles.outcomeCard}>
              <div className={styles.outcomeCopy}>
                <h3 className={styles.outcomeHeading}>Delivered Project Result</h3>
                <p className={styles.outcomeBody}>{project.finalOutcome}</p>
              </div>
              <Link href={`/quote?project=${project.id}`} className="btn primary">
                Request Similar Work
              </Link>
            </div>
          </section>
        </Reveal>

        {/* Photographic Evidence Showcase (Before, During, After) */}
        {project.evidence.length > 0 && (
          <Reveal delay={0.16}>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionKicker}>Field Documentation</span>
                <h2 className={styles.sectionTitle}>Before, During & After Evidence</h2>
                <p className={styles.sectionIntro}>
                  Photographic logs documenting site preparation, execution runs, and the finished result.
                </p>
              </div>

              <div className={styles.evidenceGrid}>
                {project.evidence.map((entry) => (
                  <article key={`${entry.phase}-${entry.title}`} className={styles.evidenceCard}>
                    <div className={styles.evidenceMedia}>
                      <Image
                        src={entry.image}
                        alt={`${entry.phase} evidence for ${project.title}`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.evidenceImg}
                      />
                      <span className={styles.phaseBadge}>{entry.phase} Stage</span>
                    </div>

                    <div className={styles.evidenceBody}>
                      <h3 className={styles.evidenceTitle}>{entry.title}</h3>
                      <p className={styles.evidenceNote}>{entry.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* Related Products & Service Links */}
        {(relatedService || relatedCategories.length > 0) && (
          <Reveal delay={0.18}>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionKicker}>Materials & Service</span>
                <h2 className={styles.sectionTitle}>Related Services & Components</h2>
              </div>

              <div className={styles.categoriesRow}>
                {relatedService && (
                  <Link href={`/services/${relatedService.slug}`} className={styles.categoryChip}>
                    <span>Service: {relatedService.shortTitle}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </Link>
                )}

                {relatedCategories.map((category) => (
                  <Link key={category.key} href={buildCollectionPath(category.key)} className={styles.categoryChip}>
                    <span>{category.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* Frequently Asked Questions */}
        <Reveal delay={0.2}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionKicker}>Clarifications</span>
              <h2 className={styles.sectionTitle}>Project Questions & Answers</h2>
            </div>
            <div className={styles.faqWrapper}>
              <FaqAccordion items={projectFaqs} />
            </div>
          </section>
        </Reveal>

        {/* Bottom Conversion Banner */}
        <Reveal delay={0.22}>
          <section className={styles.conversionBanner}>
            <div className={styles.bannerContent}>
              <span className={styles.bannerTag}>Book an Inspection</span>
              <h2 className={styles.bannerHeading}>Planning a similar electrical or solar project?</h2>
              <p className={styles.bannerText}>
                Send your site location and load profile. We provide a transparent material bill of quantities and a realistic execution schedule within 24 hours.
              </p>
            </div>
            <div className={styles.bannerActions}>
              <Link href={`/quote?project=${project.id}`} className="btn primary">
                Request Project Quote
              </Link>
              <Link href="/projects" className="btn outline">
                More Case Studies
              </Link>
            </div>
          </section>
        </Reveal>
      </Container>
    </section>
  );
}
