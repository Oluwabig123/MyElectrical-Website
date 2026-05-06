import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import {
  academyAudiences,
  academyIntro,
  academyOutcomes,
  academyResources,
  academyTracks,
} from "@/data/academy";
import { buildMetadata } from "@/lib/seo";
import styles from "./AcademyPage.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Academy",
  description:
    "A structured learning hub for homeowners, business owners, and aspiring electrical learners from Oduzz Electrical Concept.",
  path: "/academy",
  keywords: [
    "electrical academy Nigeria",
    "electrical learning hub Lagos",
    "wiring tutorials Lagos",
    "solar basics Nigeria",
  ],
  image: "/hero/wiring.webp",
});

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function AcademyPage() {
  return (
    <section className={cn("section", styles.academyPage)}>
      <Container className={styles.container}>
        <SectionHeader
          as="h1"
          kicker="Academy"
          title={academyIntro.title}
          subtitle={academyIntro.subtitle}
        />

        <Reveal>
          <article className={cn("card", styles.introCard)}>
            <div className="academyIntroCopy">
              {academyIntro.lead.map((paragraph) => (
                <p key={paragraph} className={styles.lead}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="seoActionRow">
              <a className="btn outline" href="#academy-tracks">
                View tracks
              </a>
              <a className="btn outline" href="#academy-resources">
                View resources
              </a>
              <Link href="/assistant" className="btn primary">
                Ask assistant
              </Link>
            </div>
          </article>
        </Reveal>

        <div className={styles.audienceGrid}>
          {academyAudiences.map((audience, index) => (
            <Reveal key={audience.title} delay={index * 0.04}>
              <article className={cn("card", styles.audienceCard)}>
                <span className="academyLabel">{audience.label}</span>
                <h2 className={cn("cardTitle", styles.audienceTitle)}>{audience.title}</h2>
                <p className="p">{audience.summary}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <section
          id="academy-tracks"
          className={styles.sectionBlock}
          aria-labelledby="academy-tracks-title"
        >
          <div className={cn("sectionHeader", styles.sectionIntro)}>
            <div className="kicker">Learning Tracks</div>
            <h2 className="h2" id="academy-tracks-title">
              What the academy can teach
            </h2>
            <p className="p">
              Choose a track that matches what you want to understand before a project, repair,
              or training conversation.
            </p>
          </div>

          <div className={styles.trackGrid}>
            {academyTracks.map((track, index) => (
              <Reveal key={track.title} delay={index * 0.04}>
                <article className={cn("card", styles.trackCard)}>
                  <div className={styles.metaRow}>
                    <span className={cn(styles.pill, styles.pillAccent)}>{track.level}</span>
                    <span className={styles.pill}>{track.duration}</span>
                    <span className={styles.pill}>{track.audience}</span>
                  </div>
                  <h3 className={cn("cardTitle", styles.trackTitle)}>{track.title}</h3>
                  <p className="p">{track.summary}</p>
                  <ul className={styles.trackList}>
                    {track.modules.map((module) => (
                      <li key={module}>{module}</li>
                    ))}
                  </ul>
                  <p className={styles.trackOutcome}>{track.outcome}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section
          id="academy-resources"
          className={styles.sectionBlock}
          aria-labelledby="academy-resources-title"
        >
          <div className={cn("sectionHeader", styles.sectionIntro)}>
            <div className="kicker">Resources</div>
            <h2 className="h2" id="academy-resources-title">
              Resources coming into the hub
            </h2>
            <p className="p">
              These resource lanes will support practical guides, downloads, short classes, and
              workshop announcements as the academy grows.
            </p>
          </div>

          <div className={styles.resourceGrid}>
            {academyResources.map((resource, index) => (
              <Reveal key={resource.title} delay={index * 0.04}>
                <article className={cn("card", styles.resourceCard)}>
                  <div className="academyResourceTop">
                    <span className="academyLabel">{resource.type}</span>
                    <span className={styles.pill}>{resource.status}</span>
                  </div>
                  <h3 className="cardTitle">{resource.title}</h3>
                  <p className="p">{resource.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock} aria-labelledby="academy-outcomes-title">
          <div className={cn("sectionHeader", styles.sectionIntro)}>
            <div className="kicker">Outcomes</div>
            <h2 className="h2" id="academy-outcomes-title">
              What this adds to the business
            </h2>
          </div>

          <div className={styles.outcomeGrid}>
            {academyOutcomes.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <article className={cn("card", styles.outcomeCard)}>
                  <h3 className="cardTitle">{item.title}</h3>
                  <p className="p">{item.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal delay={0.14}>
          <div className={styles.foot}>
            <p className={styles.summary}>
              Need help applying any of these ideas to a real site? Start with the assistant,
              read a practical article, or request a quote with your project details.
            </p>
            <div className="seoActionRow">
              <Link href="/blog" className="btn outline">
                Read blog
              </Link>
              <Link href="/quote" className="btn primary">
                Start project
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
