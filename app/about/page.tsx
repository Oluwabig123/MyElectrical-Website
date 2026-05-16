import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { services } from "@/data/services";
import { buildMetadata } from "@/lib/seo";
import styles from "./AboutPage.module.css";

const trustPoints = [
  {
    title: "Safety-first process",
    text: "Every installation follows proper protection, balanced loading, and cleaner routing decisions from the start.",
  },
  {
    title: "Authentic material guidance",
    text: "Clients get practical help choosing cables, fittings, sockets, lighting, and other materials that actually suit the project.",
  },
  {
    title: "Reliable finishing standards",
    text: "Work is delivered with tidy conduit runs, better panel organization, and a more professional final handover.",
  },
] as const;

const operatingModel = [
  {
    step: "01",
    title: "Understand the real project need",
    text: "The work starts with the actual use case, load needs, finish expectations, and maintenance reality, not guesswork.",
  },
  {
    step: "02",
    title: "Specify the right materials",
    text: "Clients get guidance on cables, fittings, sockets, lighting, and accessories that match the job instead of generic substitutions.",
  },
  {
    step: "03",
    title: "Execute with clean standards",
    text: "Installations are delivered with proper protection, tidier routing, and better final finishing across residential and commercial spaces.",
  },
  {
    step: "04",
    title: "Keep communication practical",
    text: "Timelines, scope shifts, and quoting decisions stay clear so clients know what is being installed and why it matters.",
  },
] as const;

const trustSignals = [
  {
    label: "Base",
    value: "Ikorodu, Lagos",
  },
  {
    label: "Response",
    value: CONTACT.whatsappResponseTime,
  },
  {
    label: "Coverage",
    value: "Residential and commercial",
  },
] as const;

const clientPromises = [
  "You get guidance on verified materials, not pressure to accept whatever is easiest to source.",
  "You can expect a neater installation standard, from conduit routing to panel organization and finishing details.",
  "You get a faster decision path when you already have drawings, measurements, or site photos ready for review.",
] as const;

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "Learn about Oduzz Electrical Concept, our safety-first process, verified electrical materials approach, and electrical installation in Lagos delivery standards.",
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

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function AboutPage() {
  return (
    <section className={cn("section", "seoPage", styles.aboutPage)}>
      <Container className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <SectionHeader
              as="h1"
              kicker="About"
              title="Oduzz Electrical Concept"
              subtitle="Electrical services, verified product guidance, and cleaner installation standards for projects across Lagos, Nigeria."
            />

            <div className={styles.leadStack}>
              <p className={styles.lead}>
                Oduzz Electrical Concept works with homeowners, site supervisors, and businesses that
                want electrical jobs done with more clarity and fewer compromises. The work covers
                wiring, solar and inverter systems, CCTV, lighting, fittings, and practical guidance on
                the right materials for each project.
              </p>
              <p className={styles.lead}>
                The core value is simple: clients should not pay premium prices and still end up with
                substandard materials, weak protection choices, or untidy execution. Every project is
                approached with safety, durability, and transparency in mind.
              </p>
            </div>

            <div className={styles.statGrid}>
              {trustSignals.map((item) => (
                <article key={item.label} className={styles.statCard}>
                  <span className={styles.statLabel}>{item.label}</span>
                  <strong className={styles.statValue}>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className={cn("seoActionRow", styles.heroActions)}>
              <Link href="/quote" className="btn primary">
                Request quote
              </Link>
              <a href={CONTACT_LINKS.whatsapp} className="btn outline" target="_blank" rel="noreferrer">
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <Reveal delay={0.08}>
            <article className={cn("card", styles.heroCard)}>
              <div className={styles.heroMedia}>
                <Image
                  src="/hero/wiring.webp"
                  alt="Oduzz Electrical Concept wiring and installation work"
                  fill
                  priority
                  sizes="(max-width: 920px) 100vw, 42vw"
                  className={styles.heroImage}
                />
              </div>
              <div className={styles.heroPanel}>
                <p className={styles.panelKicker}>What clients rely on</p>
                <h2 className={styles.panelTitle}>A safer and more accountable electrical delivery standard</h2>
                <ul className={styles.checklist}>
                  {clientPromises.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        </div>

        <div className="seoContentSection">
          <div className={styles.sectionIntro}>
            <h2 className="h2">Why clients choose Oduzz</h2>
            <p className="p">
              The difference is not only technical skill. It is the combination of material honesty,
              clean execution, and practical site communication that makes the finished work more
              dependable over time.
            </p>
          </div>
          <div className={styles.grid}>
            {trustPoints.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <article className={cn("card", styles.point)}>
                  <span className={styles.pointIndex}>0{index + 1}</span>
                  <h3 className={cn("cardTitle", styles.pointTitle)}>{item.title}</h3>
                  <p className="p">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.12}>
          <div className={cn("seoContentCard", styles.missionCard)}>
            <div className="seoContentGrid">
              <div>
                <h2 className="h2">How the work is approached</h2>
                <p className="p">
                  Residential and commercial projects should be safe to use, easy to maintain, and
                  consistent with the finish level the client paid for. That means better decisions before
                  installation starts, not corrections after the fact.
                </p>
              </div>
              <div className={styles.missionNote}>
                <p className="p">
                  If you already know the service you need, the fastest path is to send your location,
                  scope, measurements, and any site photos on WhatsApp or through the quote page.
                </p>
              </div>
            </div>
            <div className={styles.modelGrid}>
              {operatingModel.map((item, index) => (
                <Reveal key={item.step} delay={index * 0.03}>
                  <article className={styles.modelCard}>
                    <span className={styles.modelStep}>{item.step}</span>
                    <h3 className="cardTitle">{item.title}</h3>
                    <p className="p">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="seoContentSection">
          <div className={styles.sectionIntro}>
            <h2 className="h2">Service coverage</h2>
            <p className="p">
              Oduzz Electrical Concept supports common electrical needs from first-fix wiring to final
              lighting and power accessories, with practical support for both installation and material
              choice.
            </p>
          </div>
          <div className={cn("seoCardGrid", styles.serviceGrid)}>
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.03}>
                <article className={cn("card", "seoInfoCard", styles.serviceCard)}>
                  <h3 className="cardTitle">{service.title}</h3>
                  <p className="p">{service.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.16}>
          <div className={styles.foot}>
            <div>
              <p className={styles.note}>
                Typical response time is {CONTACT.whatsappResponseTime} on WhatsApp during{" "}
                {CONTACT.businessHours}. For the quickest estimate, include your location, service type,
                and any useful photos.
              </p>
            </div>
            <div className={styles.actions}>
              <a href={CONTACT_LINKS.phone} className="btn outline">
                Call
              </a>
              <Link href="/contact" className="btn outline">
                Contact
              </Link>
              <Link href="/quote" className="btn primary">
                Start a quote
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
