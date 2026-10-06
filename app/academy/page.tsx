import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/ui/Reveal";
import { CONTACT_LINKS } from "@/data/contact";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import styles from "./AcademyPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Academy | Practical Engineering Guides in Lagos",
  description:
    "Learn essential electrical engineering principles, pure copper cable verification, solar sizing formulas, and conduit wiring standards from Oduzz Electrical Concept.",
  path: "/academy",
  keywords: [
    "electrical academy Lagos",
    "pure copper cable test Nigeria",
    "solar inverter sizing guide Lagos",
    "conduit wiring standards Nigeria",
    "electrical installation guide",
  ],
  image: "/hero/wiring.webp",
});

const academyGuides = [
  {
    step: "01",
    badge: "Cable Standards & Fire Safety",
    featured: true,
    title: "Identifying Pure Copper Cables & Preventing Electrical Fires",
    summary:
      "Undersized copper-clad aluminium (CCA) wires cause silent overheating and are the leading cause of building fires in Lagos. Learn how to verify authentic Coleman & Nigerchin cables before installation.",
    takeaways: [
      "Spot the difference between virgin annealed copper and brittle copper-clad aluminium.",
      "Exact gauge rules: 1.5mm² for lighting, 2.5mm² for power rings, 4mm²–6mm² for high-draw ACs and pumps.",
      "The coil weight and factory embossing test to ensure you never pay for counterfeit reels.",
    ],
    primaryAction: {
      label: "Ask Assistant About Cables →",
      href: "/assistant",
    },
    secondaryAction: {
      label: "Consult Engineer on WhatsApp",
      href: CONTACT_LINKS.whatsapp,
    },
  },
  {
    step: "02",
    badge: "Solar & Inverter Architecture",
    featured: false,
    title: "Calculating Real Daily Watt-Hour Loads Before Buying Inverters",
    summary:
      "Avoid buying undersized inverter systems and dying battery banks. Discover how to calculate peak surge wattage versus continuous running load, and why LiFePO4 lithium outlasts tubular gel batteries.",
    takeaways: [
      "Audit inductive startup surges: AC compressors and water pumps draw 3x–5x their rated wattage at startup.",
      "Lithium LiFePO4 advantages: 4,000+ deep cycles at 90% DoD versus 1,200 cycles on lead-acid.",
      "Proper DC surge protection and clean isolator disconnects to prevent board burnouts.",
    ],
    primaryAction: {
      label: "Explore Solar Services →",
      href: "/services/solar-inverter-installation",
    },
    secondaryAction: {
      label: "Size Your System on WhatsApp",
      href: CONTACT_LINKS.whatsapp,
    },
  },
  {
    step: "03",
    badge: "Conduit Piping & DB Protection",
    featured: false,
    title: "Concealed Conduit Piping & Distribution Board Standards",
    summary:
      "What every site supervisor and homeowner must inspect before walls are plastered. Learn the danger of diagonal chasing, why ACs require dedicated radial circuits, and how RCBOs prevent fatal shocks.",
    takeaways: [
      "Orthogonal wall chasing: Only cut straight vertical and horizontal runs to preserve structural masonry.",
      "Human protection: Mandating 30mA Residual Current Circuit Breakers (RCCBs) on all socket rings.",
      "Pre-plaster testing: Conducting continuity and insulation resistance tests before closing up conduits.",
    ],
    primaryAction: {
      label: "View Conduit Installation →",
      href: "/services/residential-commercial-wiring",
    },
    secondaryAction: {
      label: "Request Project BOQ",
      href: "/quote",
    },
  },
] as const;

export default function AcademyPage() {
  const academySchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "@id": `${absoluteUrl("/academy")}#program`,
    name: "Oduzz Electrical Academy",
    description:
      "Practical electrical engineering knowledge for homeowners, developers, and learners in Lagos, Nigeria.",
    provider: {
      "@type": "Organization",
      name: "Oduzz Electrical Concept",
      url: absoluteUrl("/"),
    },
  };

  return (
    <section className={styles.academyPage}>
      <Container>
        <JsonLd data={[academySchema]} />

        <div className={styles.pageShell}>
          {/* Hero Section */}
          <Reveal delay={0.02}>
            <header className={styles.hero}>
              <div className={styles.heroBadges}>
                <span className={styles.heroBrand}>Oduzz Electrical Academy • Field Knowledge</span>
                <span className={styles.heroStatusDot}>
                  <span className={styles.pingDot} /> 3 Verified Engineering Guides
                </span>
              </div>

              <h1 className={styles.heroTitle}>Practical Electrical Knowledge Before You Build or Hire</h1>

              <p className={styles.heroDesc}>
                No complicated academic jargon. We distill decades of site engineering into three clear, practical
                guides that protect your building from counterfeit materials, weak solar designs, and hazardous wiring
                in Lagos.
              </p>

              <div className={styles.heroActions}>
                <Link href="/assistant" className={styles.btnPrimary}>
                  Ask AI Engineering Assistant →
                </Link>
                <Link href="/quote" className={styles.btnSecondary}>
                  Request Technical Quote
                </Link>
              </div>
            </header>
          </Reveal>

          {/* 3 Core Guides Section */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Curated Guides</span>
              <h2 className={styles.sectionTitle}>Three Essential Electrical Masterclasses</h2>
              <p className={styles.sectionSubtitle}>
                Master these three fundamentals to ensure your electrical installation is durable, safe, and cost-effective.
              </p>
            </div>

            <div className={styles.guidesGrid} style={{ marginTop: "28px" }}>
              {academyGuides.map((guide, idx) => (
                <Reveal key={guide.step} delay={idx * 0.05}>
                  <article
                    className={`${styles.guideCard} ${guide.featured ? styles.guideCardFeatured : ""}`}
                  >
                    <div className={styles.guideCardTop}>
                      <div className={styles.guideMetaRow}>
                        <span className={styles.guideIndex}>{guide.step}</span>
                        <span className={`${styles.guideBadge} ${guide.featured ? styles.guideBadgeGold : ""}`}>
                          {guide.badge}
                        </span>
                      </div>

                      <h3 className={styles.guideTitle}>{guide.title}</h3>
                      <p className={styles.guideSummary}>{guide.summary}</p>

                      <ul className={styles.takeawaysList}>
                        {guide.takeaways.map((item) => (
                          <li key={item} className={styles.takeawayItem}>
                            <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.guideActions}>
                      <Link href={guide.primaryAction.href} className={styles.guideBtnPrimary}>
                        {guide.primaryAction.label}
                      </Link>
                      {guide.secondaryAction.href.startsWith("http") ? (
                        <a
                          href={guide.secondaryAction.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.guideBtnOutline}
                        >
                          {guide.secondaryAction.label}
                        </a>
                      ) : (
                        <Link href={guide.secondaryAction.href} className={styles.guideBtnOutline}>
                          {guide.secondaryAction.label}
                        </Link>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Executive CTA Banner */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Have a Real Project in Lagos?</h2>
              <p className={styles.ctaText}>
                Put these engineering standards to work on your building. Our licensed engineers handle conduit wiring,
                solar backup, CCTV surveillance, and verified pure copper procurement.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/quote" className={styles.btnPrimary}>
                Start Your Quote →
              </Link>
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnWhatsapp}
              >
                Chat on WhatsApp Now
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
