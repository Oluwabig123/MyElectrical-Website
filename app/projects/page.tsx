import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import ProjectsGridClient from "@/components/projects/ProjectsGridClient";
import JsonLd from "@/components/seo/JsonLd";
import { CONTACT_LINKS } from "@/data/contact";
import { getAllProjects } from "@/lib/projects";
import { buildMetadata } from "@/lib/seo";
import { buildProjectsListSchema } from "@/lib/structured-data";
import styles from "./ProjectsPage.module.css";

type PageProps = {
  searchParams?: Promise<{
    project?: string | string[];
    category?: string | string[];
  }>;
};

export const metadata: Metadata = buildMetadata({
  title: "Electrical Installation Projects & Case Studies in Lagos",
  description:
    "Explore real electrical installation case studies across Lagos including solar inverter systems, conduit wiring, commercial sub-panels, POP lighting, and verified material execution.",
  path: "/projects",
  keywords: [
    "electrical projects Lagos",
    "electrical installation in Lagos",
    "solar inverter case studies Lagos",
    "conduit wiring projects Nigeria",
    "lighting installation Lagos",
    "verified electrical materials",
  ],
  image: "/hero/lightings.webp",
});

const heroMetrics = [
  { label: "Site Documentation", val: "100% Real Field Proof" },
  { label: "Cable Standard", val: "Original Pure Copper" },
  { label: "Coverage", val: "Lagos Mainland & Island" },
] as const;

const executionPillars = [
  {
    title: "Documented Photographic Proof",
    text: "Every stage—from raw trenching and conduit bends to final breaker terminations—is photographed before walls or ceilings are closed.",
  },
  {
    title: "Dedicated Circuit Segregation",
    text: "Heavy appliance lines are isolated from sensitive electronics and backup circuits to prevent overloads and breaker trips.",
  },
  {
    title: "Original Material Guarantee",
    text: "We only specify certified cables (Coleman/Nigerchin) and tested switchgear. Zero undersized gauges or counterfeit accessories.",
  },
  {
    title: "Clean Handover & Schematics",
    text: "Distribution boards are clearly indexed and labeled. Clients receive practical maintenance guidance and direct support access.",
  },
] as const;

export default async function ProjectsPage({ searchParams }: PageProps) {
  const projects = getAllProjects();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectId = Array.isArray(resolvedSearchParams?.project)
    ? resolvedSearchParams?.project[0] ?? ""
    : resolvedSearchParams?.project ?? "";
  const initialCategory = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams?.category[0] ?? ""
    : resolvedSearchParams?.category ?? "";

  return (
    <section className={styles.projectsPage}>
      <JsonLd data={buildProjectsListSchema(projects)} />
      <Container>
        <div className={styles.pageShell}>
          {/* Hero Section */}
          <Reveal delay={0.04}>
            <section className={styles.hero}>
              <div className={styles.heroMedia}>
                <Image
                  src="/hero/lightings.webp"
                  alt="Oduzz Electrical Concept completed electrical and lighting project in Lagos."
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 65vw"
                  className={styles.heroImage}
                />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={styles.heroContent}>
                  <div className={styles.heroBadges}>
                    <span className={styles.heroBrand}>Oduzz Project Archive</span>
                    <span className={styles.heroStatusDot}>
                      <span className={styles.pingDot} /> Verified Field Documentation
                    </span>
                  </div>

                  <h1 className={styles.heroTitle}>
                    Real Electrical & Solar Installations Delivered in Lagos.
                  </h1>

                  <p className={styles.heroSummary}>
                    Explore on-site case studies across hybrid solar systems, conduit wiring, distribution boards, POP line channels, and chandelier centerpieces. Verified with real site photos, scope details, and outcomes.
                  </p>

                  <div className={styles.heroActions}>
                    <Link href="/quote" className="btn primary">
                      Request Similar Project
                    </Link>
                    <a
                      href={CONTACT_LINKS.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.heroWhatsAppBtn}
                    >
                      <span>Chat on WhatsApp</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.532 1.942.847 2.796.847 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.733-5.768-5.733zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.456-.475-4.914-1.306l-5.086 1.333 1.357-4.957c-.914-1.503-1.428-3.262-1.428-5.07 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Hero Sidebar */}
              <aside className={styles.heroSidebar}>
                <div className={styles.metricsCard}>
                  <p className={styles.panelTitle}>Engineering Assurance</p>
                  <div className={styles.metricsList}>
                    {heroMetrics.map((m) => (
                      <div key={m.label} className={styles.metricRow}>
                        <span className={styles.metricLabel}>{m.label}</span>
                        <span className={styles.metricVal}>{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.quickNavCard}>
                  <p className={styles.panelTitle}>Featured Case Studies</p>
                  <ul className={styles.spotlightList}>
                    <li>
                      <Link href="/projects/solar-1">
                        <span className={styles.spotlightTag}>Solar</span>
                        <div>
                          <strong>5kVA Solar & Inverter Backup</strong>
                          <p>Ikorodu · Stable backup, neat trunking</p>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/projects/wiring-1">
                        <span className={styles.spotlightTag}>Wiring</span>
                        <div>
                          <strong>Conduit & Underground Runs</strong>
                          <p>Igbogbo · Controlled bends, zero rewires</p>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/projects/lighting-1">
                        <span className={styles.spotlightTag}>Lighting</span>
                        <div>
                          <strong>POP Lines & Chandelier Mount</strong>
                          <p>Ikorodu GRA · Balanced ambient finish</p>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </aside>
            </section>
          </Reveal>

          {/* Interactive Case Studies Grid */}
          <section className={styles.catalogSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Field Archive</span>
              <h2 className={styles.sectionTitle}>Browse Documented Installations</h2>
              <p className={styles.sectionSubtitle}>
                Filter by service discipline or search by location and system type to see technical solutions and results.
              </p>
            </div>

            <ProjectsGridClient
              projects={projects}
              selectedProjectId={selectedProjectId}
              initialCategory={initialCategory}
            />
          </section>

          {/* Quality Execution Pillars */}
          <Reveal delay={0.12}>
            <section className={styles.pillarsSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionEyebrow}>Quality Standards</span>
                <h2 className={styles.sectionTitle}>The Oduzz On-Site Engineering Protocol</h2>
              </div>

              <div className={styles.pillarsGrid}>
                {executionPillars.map((pillar) => (
                  <article key={pillar.title} className={styles.pillarCard}>
                    <div className={styles.pillarIconBox}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                    <p className={styles.pillarText}>{pillar.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          {/* Bottom Conversion Section */}
          <Reveal delay={0.16}>
            <section className={styles.finalCta}>
              <div className={styles.ctaCopy}>
                <span className={styles.finalEyebrow}>Start Your Installation</span>
                <h2 className={styles.finalHeading}>Have a site plan, renovation, or power challenge?</h2>
                <p className={styles.finalSub}>
                  Send your site photos, drawings, or load requirements. We provide transparent material estimates and a realistic schedule within 24 hours.
                </p>
              </div>

              <div className={styles.ctaButtons}>
                <Link href="/quote" className="btn primary">
                  Start Project Quote
                </Link>
                <Link href="/services" className="btn outline">
                  Explore Services
                </Link>
              </div>
            </section>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
