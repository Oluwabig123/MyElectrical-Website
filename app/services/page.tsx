import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { services } from "@/data/services";
import { buildMetadata } from "@/lib/seo";
import styles from "./ServicesPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Services in Lagos Nigeria",
  description:
    "Explore electrical services from Oduzz Electrical Concept including wiring, solar and inverter installation, CCTV setup, lighting systems, smart controls, and maintenance support in Lagos, Nigeria.",
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

const heroHighlights = [
  "Wiring upgrades",
  "Solar backup systems",
  "Lighting finishing",
] as const;

const sectors = [
  "Residential",
  "Commercial",
  "Retail Fit-Outs",
  "Hospitality",
  "Warehousing",
] as const;

const processSteps = [
  {
    step: "01",
    title: "Inspect the real site conditions",
    text: "Scope starts with load, routing, finish level, and access realities instead of guesswork.",
  },
  {
    step: "02",
    title: "Specify the right materials",
    text: "Cables, fittings, fixtures, and protection devices are matched to the job before installation starts.",
  },
  {
    step: "03",
    title: "Install with cleaner standards",
    text: "Execution focuses on protection, neat runs, better placement, and a more accountable handover.",
  },
] as const;

const benefits = [
  {
    title: "Protection-first electrical work",
    text: "Projects are designed around safer distribution, better protection decisions, and long-term reliability.",
  },
  {
    title: "Sharper material choices",
    text: "Clients get practical guidance on materials that fit the actual project, not generic substitutions.",
  },
  {
    title: "Cleaner visual finishing",
    text: "Conduit lines, lighting placement, panel organization, and device alignment are handled with more discipline.",
  },
  {
    title: "Faster quoting decisions",
    text: "When scope, measurements, and site photos are ready, quoting and planning move much faster.",
  },
] as const;

const heroImage = {
  src: "/hero/wiring.webp",
  alt: "Oduzz electrical installation work in progress with clean professional finishing.",
} as const;

const heroServices = services.slice(0, 3);
const featureServices = [services[0], services[2], services[5]] as const;
const supportServices = [services[1], services[3], services[4]] as const;

export default function ServicesPage() {
  return (
    <section className={styles.servicesPage}>
      <Container>
        <div className={styles.pageShell}>
          <Reveal delay={0.04}>
            <section className={styles.hero}>
              <div className={styles.heroMedia}>
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 68vw"
                  className={styles.heroImage}
                />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={styles.heroContent}>
                  <p className={styles.heroBrand}>Oduzz Electrical Concept</p>
                  <p className={styles.heroKicker}>Services</p>
                  <h1 className={styles.heroTitle}>
                    Electrical systems delivered with cleaner standards in Lagos.
                  </h1>
                  <p className={styles.heroSummary}>
                    Wiring, solar and inverter backup, CCTV, smart controls, and lighting installation
                    handled with sharper material guidance and a more premium finish.
                  </p>

                  <div className={styles.heroActions}>
                    <Link href="/quote" className="btn primary">
                      Request a quote
                    </Link>
                    <Link href="/contact" className={styles.heroSecondary}>
                      Contact Oduzz
                    </Link>
                  </div>
                </div>
              </div>

              <aside className={styles.heroPanel}>
                <p className={styles.panelLabel}>Most requested scope</p>
                <div className={styles.panelPills}>
                  {heroHighlights.map((item) => (
                    <span key={item} className={styles.panelPill}>
                      {item}
                    </span>
                  ))}
                </div>

                <div className={styles.panelList}>
                  {heroServices.map((service) => (
                    <article key={service.title} className={styles.panelListItem}>
                      <div>
                        <p className={styles.panelItemTitle}>
                          <Link href={`/services/${service.slug}`} className={styles.panelItemLink}>
                            {service.title}
                          </Link>
                        </p>
                        <p className={styles.panelItemText}>{service.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className={styles.panelFoot}>
                  <div>
                    <p className={styles.panelMetaLabel}>Coverage</p>
                    <p className={styles.panelMetaValue}>Lagos residential and commercial projects</p>
                  </div>
                  <Link href="/quote" className={styles.panelLink}>
                    Start project
                  </Link>
                </div>
              </aside>
            </section>
          </Reveal>

          <Reveal delay={0.08}>
            <section className={styles.sectorStrip} aria-label="Project sectors">
              <p className={styles.sectorLabel}>Built for</p>
              <div className={styles.sectorTrack}>
                {sectors.map((sector) => (
                  <span key={sector} className={styles.sectorWordmark}>
                    {sector}
                  </span>
                ))}
              </div>
            </section>
          </Reveal>

          <section className={styles.featureSection}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Premium service coverage</p>
              <h2 className={styles.sectionTitle}>Installation quality starts before the first cable is fixed.</h2>
              <p className={styles.sectionSummary}>
                Oduzz combines execution with material judgment, so the finished work looks better,
                performs better, and lasts better.
              </p>
            </div>

            <div className={styles.featureStack}>
              {featureServices.map((service, index) => (
                <Reveal key={service.title} delay={index * 0.05}>
                  <article
                    className={`${styles.featureRow} ${index % 2 === 1 ? styles.featureRowReverse : ""}`}
                  >
                    <div className={styles.featureMedia}>
                      <Image
                        src={service.image}
                        alt={service.alt}
                        fill
                        sizes="(max-width: 960px) 100vw, 50vw"
                        className={styles.featureImage}
                      />
                    </div>

                    <div className={styles.featureCopy}>
                      <p className={styles.featureEyebrow}>{service.eyebrow}</p>
                      <h3 className={styles.featureTitle}>{service.title}</h3>
                      <p className={styles.featureDesc}>{service.desc}</p>
                      <p className={styles.featureDetail}>{service.detail}</p>
                      <Link href={`/services/${service.slug}`} className={styles.featureLink}>
                        View service details
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <Reveal delay={0.12}>
            <section className={styles.processBand}>
              <div className={styles.processIntro}>
                <p className={styles.processLabel}>How Oduzz works</p>
                <h2 className={styles.processTitle}>A tighter process from site review to handover.</h2>
                <p className={styles.processSummary}>
                  The point is not only technical installation. It is disciplined routing, better material
                  decisions, and a cleaner final result that matches what the client paid for.
                </p>
              </div>

              <div className={styles.processSteps}>
                {processSteps.map((item) => (
                  <article key={item.step} className={styles.processCard}>
                    <span className={styles.processStep}>{item.step}</span>
                    <h3 className={styles.processCardTitle}>{item.title}</h3>
                    <p className={styles.processCardText}>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className={styles.supportGrid}>
                {supportServices.map((service) => (
                  <article key={service.title} className={styles.supportCard}>
                    <div className={styles.supportCardMedia}>
                      <Image
                        src={service.image}
                        alt={service.alt}
                        fill
                        sizes="(max-width: 960px) 100vw, 33vw"
                        className={styles.supportCardImage}
                      />
                      <div className={styles.supportCardShade} aria-hidden="true" />
                    </div>
                    <div className={styles.supportCardBody}>
                      <p className={styles.supportCardEyebrow}>{service.eyebrow}</p>
                      <h3 className={styles.supportCardTitle}>{service.title}</h3>
                      <p className={styles.supportCardText}>{service.detail}</p>
                      <Link href={`/services/${service.slug}`} className={styles.supportCardLink}>
                        View service page
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.16}>
            <section className={styles.benefitSection}>
              <div className={styles.benefitIntro}>
                <p className={styles.sectionLabel}>Why clients stay with Oduzz</p>
                <h2 className={styles.sectionTitle}>Electrical work that feels more deliberate from the first day.</h2>
              </div>

              <div className={styles.benefitGrid}>
                {benefits.map((item) => (
                  <article key={item.title} className={styles.benefitCard}>
                    <h3 className={styles.benefitTitle}>{item.title}</h3>
                    <p className="p">{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.2}>
            <section className={styles.finalCta}>
              <div>
                <p className={styles.finalLabel}>Ready to start</p>
                <h2 className={styles.finalTitle}>Request a project quote or get direct guidance on your scope.</h2>
              </div>
              <div className={styles.finalActions}>
                <Link href="/quote" className="btn primary">
                  Start a quote
                </Link>
                <Link href="/contact" className="btn outline">
                  Contact Oduzz
                </Link>
              </div>
            </section>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
