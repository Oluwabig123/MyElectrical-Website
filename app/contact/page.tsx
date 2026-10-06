import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/ui/Reveal";
import FaqAccordion from "@/components/ui/FaqAccordion";
import ContactQuickInquiry from "@/components/contact/ContactQuickInquiry";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/structured-data";
import styles from "./ContactPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Contact Oduzz Electrical Concept in Lagos",
  description:
    "Contact Oduzz Electrical Concept for electrical installation in Lagos, verified product guidance, and project quotes with photo-based planning support.",
  path: "/contact",
  keywords: [
    "contact electrician Lagos",
    "electrical quote Lagos",
    "electrical materials in Lagos",
    "verified electrical materials",
    "authentic electrical products",
    "Oduzz Electrical Concept contact",
  ],
});

const contactFaqs = [
  {
    question: "What details should I send for a faster electrical quote?",
    answer:
      "Send your building location in Lagos, the project type (e.g., conduit piping, solar backup, DB board upgrade), the building stage, and clear site photos or architectural drawings.",
  },
  {
    question: "Can Oduzz support both installation and material guidance?",
    answer:
      "Yes. Oduzz provides complete turnkey installation as well as verified material procurement guidance, ensuring you only receive 100% pure copper cables (Coleman/Nigerchin) and authentic switchgear.",
  },
  {
    question: "Which locations in Lagos do you commonly support?",
    answer:
      "We operate out of Ikorodu with active mobilization across all parts of Lagos, including Ikeja, Mainland, Lekki Phase 1, Ikoyi, Victoria Island, Ajah, Surulere, and the Epe corridor.",
  },
  {
    question: "How fast do you respond on WhatsApp?",
    answer:
      "During regular operating hours (Monday to Saturday, 8:00 AM to 8:00 PM), our lead engineers typically respond within under 10 minutes to review site photos and questions.",
  },
] as const;

const lagosCoverageAreas = [
  "Ikorodu & Environs",
  "Ikeja & Maryland",
  "Lekki Phase 1 & Chevron",
  "Ikoyi & Victoria Island",
  "Ajah & Sangotedo",
  "Surulere & Yaba",
  "Magodo & Omole",
  "Epe & Free Zone Corridor",
] as const;

export default function ContactPage() {
  const faqSchema = buildFaqSchema([...contactFaqs], {
    id: `${absoluteUrl("/contact")}#faq`,
  });

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${absoluteUrl("/contact")}#contact-page`,
    url: absoluteUrl("/contact"),
    name: "Contact Oduzz Electrical Concept",
    description:
      "Contact page for electrical installation, product guidance, and project quote support in Lagos, Nigeria.",
    mainEntity: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
    },
  };

  return (
    <section className={styles.contactPage}>
      <Container>
        <JsonLd data={[contactPageSchema, faqSchema]} />

        <div className={styles.pageShell}>
          {/* Hero Section */}
          <Reveal delay={0.02}>
            <header className={styles.hero}>
              <div className={styles.heroContent}>
                <div className={styles.heroBadges}>
                  <span className={styles.heroBrand}>Oduzz Electrical Concept • Lagos Direct Line</span>
                  <span className={styles.heroStatusDot}>
                    <span className={styles.pingDot} /> Available for Lagos Projects
                  </span>
                </div>

                <h1 className={styles.heroTitle}>Direct Line to Qualified Electrical Engineers in Lagos</h1>

                <p className={styles.heroDesc}>
                  Whether you are planning full concealed conduit piping for a new build, upgrading distribution
                  boards, installing solar power, or verifying pure copper cable procurement — our technical desk responds
                  promptly.
                </p>

                <div className={styles.heroActions}>
                  <a
                    href={CONTACT_LINKS.whatsapp}
                    className={styles.btnWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.531 1.77.82 2.796.82 3.18 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.251 5.766c-.001 4.017-3.267 7.284-7.282 7.284-1.255 0-2.454-.325-3.513-.935l-3.907 1.025 1.047-3.824c-.7-1.12-1.071-2.42-1.07-3.75 0-4.018 3.267-7.285 7.285-7.285 4.018 0 7.44 3.463 7.44 7.485z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <a href={CONTACT_LINKS.phone} className={styles.btnPhone}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call {CONTACT.phoneDisplay}
                  </a>
                  <Link href="/quote" className={styles.btnQuote}>
                    Request Full BOQ →
                  </Link>
                </div>
              </div>

              {/* Right Side Dispatch Summary Card */}
              <div className={styles.heroDispatchCard}>
                <div className={styles.dispatchHeader}>
                  <span className={styles.dispatchKicker}>Engineering Operations</span>
                  <h2 className={styles.dispatchTitle}>Live Dispatch & Support</h2>
                </div>

                <div className={styles.dispatchMetrics}>
                  <div className={styles.dispatchRow}>
                    <span className={styles.dispatchLabel}>Operating Base</span>
                    <span className={styles.dispatchVal}>Ikorodu, Lagos State</span>
                  </div>
                  <div className={styles.dispatchRow}>
                    <span className={styles.dispatchLabel}>WhatsApp Response</span>
                    <span className={styles.dispatchValHighlight}>{CONTACT.whatsappResponseTime}</span>
                  </div>
                  <div className={styles.dispatchRow}>
                    <span className={styles.dispatchLabel}>Operating Hours</span>
                    <span className={styles.dispatchVal}>{CONTACT.businessHours}</span>
                  </div>
                  <div className={styles.dispatchRow}>
                    <span className={styles.dispatchLabel}>Service Coverage</span>
                    <span className={styles.dispatchVal}>All Lagos Mainland & Island</span>
                  </div>
                </div>

                <div className={styles.dispatchFooter}>
                  For urgent site emergencies or immediate cable verifications, WhatsApp remains our fastest communication route.
                </div>
              </div>
            </header>
          </Reveal>

          {/* Direct Communication Channels Grid */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Direct Channels</span>
              <h2 className={styles.sectionTitle}>Four Ways to Connect With Our Engineers</h2>
              <p className={styles.subtitle}>
                Choose the channel best suited for your documentation, urgency, or project consultation.
              </p>
            </div>

            <div className={styles.channelGrid} style={{ marginTop: "24px" }}>
              {/* WhatsApp Card */}
              <Reveal delay={0.04}>
                <article className={`${styles.channelCard} ${styles.featuredCard}`}>
                  <div className={styles.cardTop}>
                    <span className={`${styles.cardBadge} ${styles.cardBadgeFeatured}`}>⚡ Most Popular • Instant</span>
                    <div className={styles.cardIconTitle}>
                      <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.531 1.77.82 2.796.82 3.18 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.251 5.766c-.001 4.017-3.267 7.284-7.282 7.284-1.255 0-2.454-.325-3.513-.935l-3.907 1.025 1.047-3.824c-.7-1.12-1.071-2.42-1.07-3.75 0-4.018 3.267-7.285 7.285-7.285 4.018 0 7.44 3.463 7.44 7.485z" />
                        </svg>
                      </div>
                      <h3 className={styles.cardTitle}>WhatsApp Desk</h3>
                    </div>
                    <p className={styles.cardText}>
                      Ideal for sending site photos, video walkthroughs, architectural sketches, and quick technical inquiries.
                    </p>
                  </div>
                  <a
                    href={CONTACT_LINKS.whatsapp}
                    className={`${styles.cardAction} ${styles.cardActionPrimary}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open WhatsApp Chat →
                  </a>
                </article>
              </Reveal>

              {/* Phone Card */}
              <Reveal delay={0.08}>
                <article className={styles.channelCard}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardBadge}>Voice Consultation</span>
                    <div className={styles.cardIconTitle}>
                      <div className={styles.cardIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <h3 className={styles.cardTitle}>Direct Phone</h3>
                    </div>
                    <p className={styles.cardText}>
                      Speak with our technical engineering lead about urgent site deadlines, power faults, or same-day inspections.
                    </p>
                  </div>
                  <a href={CONTACT_LINKS.phone} className={`${styles.cardAction} ${styles.cardActionSecondary}`}>
                    Call {CONTACT.phoneDisplay}
                  </a>
                </article>
              </Reveal>

              {/* Email Card */}
              <Reveal delay={0.12}>
                <article className={styles.channelCard}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardBadge}>Engineering BOQ</span>
                    <div className={styles.cardIconTitle}>
                      <div className={styles.cardIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <h3 className={styles.cardTitle}>Formal Email</h3>
                    </div>
                    <p className={styles.cardText}>
                      Submit CAD drawings, detailed Bills of Quantities, tender packages, and corporate service agreements.
                    </p>
                  </div>
                  <a href={CONTACT_LINKS.email} className={`${styles.cardAction} ${styles.cardActionSecondary}`}>
                    Send Email ({CONTACT.email})
                  </a>
                </article>
              </Reveal>

              {/* Operational Hub Card */}
              <Reveal delay={0.16}>
                <article className={styles.channelCard}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardBadge}>Operational Hub</span>
                    <div className={styles.cardIconTitle}>
                      <div className={styles.cardIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <h3 className={styles.cardTitle}>Ikorodu & Lagos</h3>
                    </div>
                    <p className={styles.cardText}>
                      Our crews operate from Ikorodu with prompt site dispatch across all districts of Lagos Mainland and the Island.
                    </p>
                  </div>
                  <Link href="/quote" className={`${styles.cardAction} ${styles.cardActionSecondary}`}>
                    Book Site Inspection →
                  </Link>
                </article>
              </Reveal>
            </div>
          </section>

          {/* Interactive Quick Scope Inquiry Widget */}
          <Reveal delay={0.06}>
            <ContactQuickInquiry />
          </Reveal>

          {/* What to Prepare for Faster Quotation */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Fast-Track Checklist</span>
              <h2 className={styles.sectionTitle}>What to Share for an Instant, Accurate Quote</h2>
              <p className={styles.subtitle}>
                Providing these key project indicators ensures our engineers can deliver an itemized estimate without delay.
              </p>
            </div>

            <div className={styles.blueprintGrid} style={{ marginTop: "24px" }}>
              <article className={styles.blueprintCard}>
                <span className={styles.blueprintIndex}>01</span>
                <h3 className={styles.blueprintTitle}>Exact Site Location</h3>
                <p className={styles.blueprintText}>
                  Your specific area in Lagos (e.g., Lekki Phase 1, Ikeja GRA, Ikorodu) for logistics and dispatch timing.
                </p>
              </article>

              <article className={styles.blueprintCard}>
                <span className={styles.blueprintIndex}>02</span>
                <h3 className={styles.blueprintTitle}>Building Stage</h3>
                <p className={styles.blueprintText}>
                  Let us know if the site is at blockwork/decking stage, ready for conduit chasing, plaster stage, or finished renovation.
                </p>
              </article>

              <article className={styles.blueprintCard}>
                <span className={styles.blueprintIndex}>03</span>
                <h3 className={styles.blueprintTitle}>Site Photos or Drawings</h3>
                <p className={styles.blueprintText}>
                  Snapshots of the walls, distribution board, roof structure (for solar), or PDF architectural electrical plans.
                </p>
              </article>

              <article className={styles.blueprintCard}>
                <span className={styles.blueprintIndex}>04</span>
                <h3 className={styles.blueprintTitle}>Target Mobilization Date</h3>
                <p className={styles.blueprintText}>
                  Whether you need emergency immediate dispatch, material staging this week, or planning for upcoming contract phases.
                </p>
              </article>
            </div>
          </section>

          {/* What Happens After You Reach Out */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Engineering Intake</span>
              <h2 className={styles.sectionTitle}>What Happens After You Reach Out</h2>
              <p className={styles.subtitle}>
                We run a structured, transparent intake process so your site gets professional clarity right from the first exchange.
              </p>
            </div>

            <div className={styles.workflowGrid} style={{ marginTop: "24px" }}>
              <article className={styles.workflowCard}>
                <span className={styles.workflowStep}>01</span>
                <h3 className={styles.workflowTitle}>Triage & Technical Scoping</h3>
                <p className={styles.workflowText}>
                  Within minutes, our lead engineer examines your photos, requirements, and location to determine whether an immediate estimate, phone call, or on-site physical survey is required.
                </p>
              </article>

              <article className={styles.workflowCard}>
                <span className={styles.workflowStep}>02</span>
                <h3 className={styles.workflowTitle}>Itemized Material & Labor BOQ</h3>
                <p className={styles.workflowText}>
                  We specify only certified components — pure copper cables (Coleman/Nigerchin), heavy-gauge PVC conduits, and proper breaker protection — with full pricing transparency.
                </p>
              </article>

              <article className={styles.workflowCard}>
                <span className={styles.workflowStep}>03</span>
                <h3 className={styles.workflowTitle}>Scheduled On-Site Mobilization</h3>
                <p className={styles.workflowText}>
                  Our installation crew arrives with calibrated laser levels, wall-chasing tools, and protective safety gear to execute cleanly without compromising structural integrity.
                </p>
              </article>
            </div>
          </section>

          {/* Lagos Service Area Details */}
          <section className={styles.coverageWrapper}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Geographic Scope</span>
              <h2 className={styles.sectionTitle}>Active Coverage Across Lagos State</h2>
              <p className={styles.subtitle}>
                We regularly mobilize teams for residential estates, luxury private builds, and commercial facilities in:
              </p>
            </div>

            <div className={styles.coveragePills}>
              {lagosCoverageAreas.map((area) => (
                <div key={area} className={styles.coveragePill}>
                  <span className={styles.coveragePillDot} />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Frequently Asked Questions */}
          <section className={styles.faqSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>Direct Answers</span>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            </div>
            <FaqAccordion items={[...contactFaqs]} />
          </section>

          {/* Bottom Conversion Banner */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to Secure Your Electrical Installation?</h2>
              <p className={styles.ctaText}>
                Speak directly with an engineer now. We will verify your material requirements and map out the cleanest installation pathway for your building.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <a
                href={CONTACT_LINKS.whatsapp}
                className={styles.btnWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp Now
              </a>
              <Link href="/quote" className={styles.btnQuote}>
                Start a Formal Quote →
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
