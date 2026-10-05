import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import ServicesCatalogClient from "@/components/services/ServicesCatalogClient";
import ServiceScopeCalculator from "@/components/services/ServiceScopeCalculator";
import { services } from "@/data/services";
import { buildMetadata } from "@/lib/seo";
import styles from "./ServicesPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Services in Lagos Nigeria",
  description:
    "Explore electrical services from Oduzz Electrical Concept including conduit wiring, solar & inverter installations, CCTV, architectural lighting, and maintenance in Lagos, Nigeria.",
  path: "/services",
  keywords: [
    "electrical services Lagos",
    "electrical installation Lagos",
    "solar installation Lagos",
    "lighting installation Lagos",
    "commercial wiring Nigeria",
  ],
  image: "/hero/wiring.webp",
});

const heroMetrics = [
  { label: "Execution Standard", val: "IEC & NEMSA Aligned" },
  { label: "Turnaround", val: "24–48h Site Survey" },
  { label: "Coverage", val: "Lagos & Interstate" },
] as const;

const processSteps = [
  {
    step: "01",
    title: "Real Site Review & Load Audits",
    text: "Phase balance, cable run lengths, conduit accessibility, and real appliance peak surges are mapped before any quote is final.",
  },
  {
    step: "02",
    title: "Original Material Specification",
    text: "Zero substandard components. Heavy-duty copper cables, certified breakers (Schneider/Havells), and Tier-1 solar equipment only.",
  },
  {
    step: "03",
    title: "Precision Execution & Clean Handover",
    text: "Laser-aligned conduits, neatly labeled distribution panels, terminal torque checks, and full multi-circuit testing under load.",
  },
] as const;

const trustFactors = [
  {
    title: "Protection-First Engineering",
    text: "Every distribution board is designed with surge arresters (SPDs), RCCBs against human shock, and calibrated thermal breaks.",
    icon: "shield",
  },
  {
    title: "Zero Counterfeit Guarantee",
    text: "Direct sourcing of certified pure-copper cables (Coleman/Nigerchin) with strict verification against undersized gauge scams.",
    icon: "check",
  },
  {
    title: "Architectural Neatness",
    text: "Clean flush-mounted fittings, disciplined trunking lines, and concealed cable runs that respect your building's interior beauty.",
    icon: "layout",
  },
  {
    title: "Direct WhatsApp Escalation",
    text: "Immediate access to lead engineers for troubleshooting, site progress photos, and emergency circuit stabilization.",
    icon: "chat",
  },
] as const;

export default function ServicesPage() {
  return (
    <section className={styles.servicesPage}>
      <Container>
        <div className={styles.pageShell}>
          {/* Hero Section */}
          <Reveal delay={0.04}>
            <section className={styles.hero}>
              <div className={styles.heroMedia}>
                <Image
                  src="/hero/wiring.webp"
                  alt="Oduzz electrical installation work in progress with clean professional finishing."
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 65vw"
                  className={styles.heroImage}
                />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={styles.heroContent}>
                  <div className={styles.heroBadges}>
                    <span className={styles.heroBrand}>Oduzz Electrical Concept</span>
                    <span className={styles.heroStatusDot}>
                      <span className={styles.pingDot} /> Available for Lagos Projects
                    </span>
                  </div>

                  <h1 className={styles.heroTitle}>
                    High-Reliability Electrical & Solar Engineering in Lagos.
                  </h1>

                  <p className={styles.heroSummary}>
                    From conduit-embedded residential wiring and commercial load centers to custom hybrid solar backup and smart lighting. Engineered for long-term safety, zero fires, and clean finishing.
                  </p>

                  <div className={styles.heroActions}>
                    <Link href="/quote" className="btn primary">
                      Request Project Inspection
                    </Link>
                    <a
                      href="https://wa.me/2348149723223?text=Hello%20Oduzz,%20I%20need%20guidance%20on%20an%20electrical%20service."
                      target="_blank"
                      rel="noreferrer"
                      className={styles.heroWhatsAppBtn}
                    >
                      <span>Instant WhatsApp Chat</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.532 1.942.847 2.796.847 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.733-5.768-5.733zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.456-.475-4.914-1.306l-5.086 1.333 1.357-4.957c-.914-1.503-1.428-3.262-1.428-5.07 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Hero Sidebar Cards */}
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
                  <p className={styles.panelTitle}>Priority Specializations</p>
                  <ul className={styles.priorityList}>
                    <li>
                      <Link href="/services/residential-commercial-wiring">
                        <span className={styles.priorityNumber}>01</span>
                        <div>
                          <strong>Wiring & Load Centers</strong>
                          <p>Balanced phases, zero neutral burnouts</p>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/services/solar-inverter-installation">
                        <span className={styles.priorityNumber}>02</span>
                        <div>
                          <strong>Solar & Inverter Storage</strong>
                          <p>Precision daily watt-hour sizing</p>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/services/lighting-interior-finishing">
                        <span className={styles.priorityNumber}>03</span>
                        <div>
                          <strong>Architectural Lighting</strong>
                          <p>POP spotlights, chandeliers & mood zones</p>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </aside>
            </section>
          </Reveal>

          {/* Interactive Scope Estimator */}
          <Reveal delay={0.08}>
            <section className={styles.estimatorSection}>
              <ServiceScopeCalculator />
            </section>
          </Reveal>

          {/* Main Filterable Service Catalog */}
          <section className={styles.catalogSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Comprehensive Portfolio</span>
              <h2 className={styles.sectionTitle}>Explore All Installation & Technical Capabilities</h2>
              <p className={styles.sectionSubtitle}>
                Filter between primary system installations or dedicated maintenance and control services.
              </p>
            </div>

            <ServicesCatalogClient services={services} />
          </section>

          {/* Engineering Process */}
          <Reveal delay={0.12}>
            <section className={styles.processSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionEyebrow}>Standardized Methodology</span>
                <h2 className={styles.sectionTitle}>How We Execute Without Surprises</h2>
                <p className={styles.sectionSubtitle}>
                  Every contract follows a disciplined 3-stage electrical delivery pipeline to prevent costly rework.
                </p>
              </div>

              <div className={styles.processTimeline}>
                {processSteps.map((step) => (
                  <article key={step.step} className={styles.processStepCard}>
                    <div className={styles.stepHeader}>
                      <span className={styles.stepNum}>{step.step}</span>
                      <span className={styles.stepPill}>Phase {step.step}</span>
                    </div>
                    <h3 className={styles.stepCardTitle}>{step.title}</h3>
                    <p className={styles.stepCardText}>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          {/* Why Oduzz Trust Grid */}
          <Reveal delay={0.16}>
            <section className={styles.trustSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionEyebrow}>The Oduzz Standard</span>
                <h2 className={styles.sectionTitle}>Why Lagos Property Owners Rely On Us</h2>
              </div>

              <div className={styles.trustGrid}>
                {trustFactors.map((factor) => (
                  <article key={factor.title} className={styles.trustCard}>
                    <div className={styles.trustIconBubble}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className={styles.trustTitle}>{factor.title}</h3>
                    <p className={styles.trustText}>{factor.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          {/* Final Call to Action */}
          <Reveal delay={0.2}>
            <section className={styles.finalCta}>
              <div className={styles.ctaCopy}>
                <span className={styles.finalEyebrow}>Take The Next Step</span>
                <h2 className={styles.finalHeading}>Have a site drawing, BOQ, or power challenge?</h2>
                <p className={styles.finalSub}>
                  Send your site plan, load requirements, or photos. We provide a transparent material bill of quantities and a realistic schedule within 24 hours.
                </p>
              </div>

              <div className={styles.ctaButtons}>
                <Link href="/quote" className="btn primary">
                  Start Project Quote
                </Link>
                <Link href="/contact" className="btn outline">
                  Contact Office
                </Link>
              </div>
            </section>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
