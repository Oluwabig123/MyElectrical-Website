import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { services } from "@/data/services";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import styles from "./AboutPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "About Oduzz Electrical Concept | Lagos Electrical Engineers",
  description:
    "Learn about Oduzz Electrical Concept, our safety-first engineering process, 100% verified pure copper standard, and precision electrical installations across Lagos, Nigeria.",
  path: "/about",
  keywords: [
    "about Oduzz Electrical Concept",
    "electrical contractor Lagos",
    "electrician Ikorodu",
    "electrical installation in Lagos",
    "verified electrical materials",
    "authentic electrical products",
  ],
  image: "/hero/wiring.webp",
});

const companyMetrics = [
  {
    val: "100% Pure Copper",
    label: "Exclusively certified Coleman & Nigerchin cables",
  },
  {
    val: "< 10 Mins WhatsApp",
    label: "Direct engineering consultation & photo triage",
  },
  {
    val: "Concealed Conduit",
    label: "Flush channelling to Nigerian & IEE wiring codes",
  },
  {
    val: "Lagos-Wide Base",
    label: "Crews mobilizing from Ikorodu across all zones",
  },
] as const;

const engineeringPrinciples = [
  {
    step: "01",
    title: "Arc-Fault & Fire Prevention",
    text: "We calculate exact thermal loads for heavy equipment (air conditioners, pumps, inverters) and install coordinated RCBO/MCB breakers to eliminate electrical fire hazards.",
  },
  {
    step: "02",
    title: "Verified Material Integrity",
    text: "Zero substandard substitutions. We procure all cables, heavy conduits, and switchgear directly from authorized distributors, guaranteeing virgin electrolytic copper conductors.",
  },
  {
    step: "03",
    title: "Architectural Neatness",
    text: "Disciplined wall-chasing with laser-guided horizontal and vertical runs, precision back-box alignment, and loomed distribution panels that elevate luxury interiors.",
  },
] as const;

const deliveryPipeline = [
  {
    step: "01",
    title: "Site Survey & Load Audit",
    text: "We audit floor plans, measure appliance power demands, and map conduit pathways before cutting a single block.",
  },
  {
    step: "02",
    title: "Transparent BOQ & Sourcing",
    text: "You receive an itemized schedule of materials with verified brand names and cable cross-sections with zero ambiguity.",
  },
  {
    step: "03",
    title: "Precision Channelling & Pulling",
    text: "Heavy-duty PVC pipes are embedded with uniform depth, followed by strain-free cable drawing and solid loop-in terminations.",
  },
  {
    step: "04",
    title: "Insulation Testing & Handover",
    text: "We test insulation resistance, verify neutral-earth integrity, and label distribution panels clearly before commissioning.",
  },
] as const;

const shortcutsComparison = {
  shortcuts: [
    "Undersized copper-clad aluminium (CCA) wires that overheat under heavy AC load",
    "Crooked, diagonal wall chases that weaken building masonry and plaster",
    "Overloading multiple rooms onto single uncalibrated breakers",
    "Tangled, unlabelled 'bird's nest' wires inside the distribution panel",
  ],
  standards: [
    "100% Pure annealed copper cables (Coleman / Nigerchin) with factory certification",
    "Laser-level horizontal and vertical conduit chases preserving structural integrity",
    "Dedicated radial circuits with calibrated RCBO/MCB trip protection",
    "Precision-loomed, color-coded DB wiring with clear circuit directory schedules",
  ],
};

const clientPromises = [
  "Strict anti-counterfeit cable sourcing with authentic manufacturer stamps",
  "Flush conduit chasing that preserves structural masonry and plaster",
  "Calibrated breaker protection to eliminate overheating and fire hotspots",
  "Itemized Bill of Engineering Quantities (BOQ) with zero hidden markups",
] as const;

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${absoluteUrl("/about")}#about-page`,
    url: absoluteUrl("/about"),
    name: "About Oduzz Electrical Concept",
    description:
      "Electrical installation contractor, verified product guidance, and precision engineering delivery standards in Lagos, Nigeria.",
    mainEntity: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: "Oduzz Electrical Concept",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ikorodu",
        addressRegion: "Lagos",
        addressCountry: "NG",
      },
      telephone: CONTACT.phoneE164,
      email: CONTACT.email,
    },
  };

  return (
    <section className={styles.aboutPage}>
      <Container>
        <JsonLd data={[aboutSchema]} />

        <div className={styles.pageShell}>
          {/* Hero Section */}
          <Reveal delay={0.02}>
            <header className={styles.hero}>
              <div className={styles.heroContent}>
                <div className={styles.heroBadges}>
                  <span className={styles.heroBrand}>Oduzz Electrical Concept • Lagos, Nigeria</span>
                  <span className={styles.heroStatusDot}>
                    <span className={styles.pingDot} /> Verified Engineering Standards
                  </span>
                </div>

                <h1 className={styles.heroTitle}>Engineering Integrity. Pure Copper Cables. Zero Shortcuts.</h1>

                <p className={styles.heroDesc}>
                  Oduzz Electrical Concept was founded on an uncompromising principle: Nigerian property owners deserve
                  electrical installations that safeguard lives, eliminate fire hazards, and operate reliably for decades.
                  We eliminate deceptive cable substitutions, undersized conduits, and untidy workmanship across Lagos.
                </p>

                <div className={styles.statGrid}>
                  {companyMetrics.map((metric) => (
                    <article key={metric.val} className={styles.statCard}>
                      <span className={styles.statVal}>{metric.val}</span>
                      <span className={styles.statLabel}>{metric.label}</span>
                    </article>
                  ))}
                </div>

                <div className={styles.heroActions}>
                  <Link href="/quote" className={styles.btnPrimary}>
                    Request Engineering BOQ →
                  </Link>
                  <a
                    href={CONTACT_LINKS.whatsapp}
                    className={styles.btnWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.531 1.77.82 2.796.82 3.18 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.251 5.766c-.001 4.017-3.267 7.284-7.282 7.284-1.255 0-2.454-.325-3.513-.935l-3.907 1.025 1.047-3.824c-.7-1.12-1.071-2.42-1.07-3.75 0-4.018 3.267-7.285 7.285-7.285 4.018 0 7.44 3.463 7.44 7.485z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <Link href="/projects" className={styles.btnSecondary}>
                    View Our Projects
                  </Link>
                </div>
              </div>

              {/* Hero Visual Card */}
              <div className={styles.heroMediaCard}>
                <Image
                  src="/hero/wiring.webp"
                  alt="Oduzz Electrical Concept conduit wiring and distribution installation"
                  fill
                  priority
                  sizes="(max-width: 920px) 100vw, 45vw"
                  className={styles.heroImage}
                />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={styles.heroBadgeFloat}>
                  <span>⚡ Inspected & Tested Before Plastering</span>
                </div>

                <div className={styles.heroPanel}>
                  <p className={styles.panelKicker}>The Oduzz Standard</p>
                  <h2 className={styles.panelTitle}>Built for Safety & Decades of Heavy Load</h2>
                  <ul className={styles.checklist}>
                    {clientPromises.map((promise) => (
                      <li key={promise} className={styles.checklistItem}>
                        <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{promise}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </header>
          </Reveal>

          {/* Core Engineering Principles (3 Pillars) */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Engineering Standards</span>
              <h2 className={styles.sectionTitle}>Three Pillars of Every Oduzz Installation</h2>
              <p className={styles.subtitle}>
                We combine certified materials with rigorous installation discipline so that your electrical infrastructure remains safe, cool, and efficient.
              </p>
            </div>

            <div className={styles.principlesGrid} style={{ marginTop: "24px" }}>
              {engineeringPrinciples.map((principle, idx) => (
                <Reveal key={principle.title} delay={idx * 0.04}>
                  <article className={styles.principleCard}>
                    <span className={styles.principleIndex}>{principle.step}</span>
                    <h3 className={styles.principleTitle}>{principle.title}</h3>
                    <p className={styles.principleText}>{principle.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* The Contrast: Common Industry Shortcuts vs Oduzz Standard */}
          <section className={styles.comparisonWrapper}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Direct Comparison</span>
              <h2 className={styles.sectionTitle}>Common Industry Shortcuts vs. The Oduzz Standard</h2>
              <p className={styles.subtitle}>
                In Lagos, the difference between an installation that causes frequent breaker trips and one that lasts decades comes down to material honesty and channelling precision.
              </p>
            </div>

            <div className={styles.contrastGrid}>
              <div className={styles.contrastCardShortcut}>
                <div className={`${styles.contrastHeader} ${styles.contrastHeaderShortcut}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Common Market Compromises</span>
                </div>
                <ul className={styles.contrastList}>
                  {shortcutsComparison.shortcuts.map((sc) => (
                    <li key={sc} className={styles.contrastItem}>
                      <svg className={styles.contrastCross} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>{sc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.contrastCardStandard}>
                <div className={`${styles.contrastHeader} ${styles.contrastHeaderStandard}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>The Oduzz Engineering Standard</span>
                </div>
                <ul className={styles.contrastList}>
                  {shortcutsComparison.standards.map((st) => (
                    <li key={st} className={styles.contrastItem}>
                      <svg className={styles.contrastCheck} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 4-Stage Precision Delivery Pipeline */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Disciplined Delivery</span>
              <h2 className={styles.sectionTitle}>Our 4-Stage Project Execution Pipeline</h2>
              <p className={styles.subtitle}>
                From initial site inspection to final megger testing, every phase is engineered with clear checklists and accountability.
              </p>
            </div>

            <div className={styles.pipelineGrid} style={{ marginTop: "24px" }}>
              {deliveryPipeline.map((phase, idx) => (
                <Reveal key={phase.title} delay={idx * 0.04}>
                  <article className={styles.pipelineCard}>
                    <span className={styles.pipelineStep}>{phase.step}</span>
                    <h3 className={styles.pipelineTitle}>{phase.title}</h3>
                    <p className={styles.pipelineText}>{phase.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Core Service Specializations */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Specialized Capabilities</span>
              <h2 className={styles.sectionTitle}>What We Deliver Across Lagos</h2>
              <p className={styles.subtitle}>
                Turnkey electrical engineering services tailored for residential luxury homes, commercial offices, and private developments.
              </p>
            </div>

            <div className={styles.servicesGrid} style={{ marginTop: "24px" }}>
              {services.map((service, idx) => (
                <Reveal key={service.slug} delay={idx * 0.03}>
                  <Link href={`/services/${service.slug}`} className={styles.serviceCard}>
                    <div className={styles.serviceCardTop}>
                      <span className={styles.serviceEyebrow}>{service.eyebrow}</span>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.serviceDesc}>{service.desc}</p>
                    </div>
                    <span className={styles.serviceLinkText}>
                      Explore Technical Scope →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Executive Conversion Banner */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Discuss Your Upcoming Project with Our Lead Engineers</h2>
              <p className={styles.ctaText}>
                Whether you have architectural CAD drawings ready for tender or need a rapid site inspection in Lagos,
                our engineering team will guide you with verified material schedules and transparent pricing.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/quote" className={styles.btnPrimary}>
                Request Project Quote
              </Link>
              <a
                href={CONTACT_LINKS.whatsapp}
                className={styles.btnWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp Now
              </a>
              <Link href="/contact" className={styles.btnSecondary}>
                View All Contact Channels
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
