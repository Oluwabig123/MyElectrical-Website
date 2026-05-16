import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { CONTACT } from "@/data/contact";
import { serviceAreas } from "@/data/service-areas";
import { getAllProjects } from "@/lib/projects";
import styles from "./HomeTrustBand.module.css";

const projectCategories = Array.from(
  new Set(getAllProjects().map((project) => project.category).filter(Boolean)),
);

const proofItems = [
  {
    value: CONTACT.whatsappResponseTime,
    label: "Typical WhatsApp response",
    detail: `During ${CONTACT.businessHours}`,
  },
  {
    value: String(serviceAreas.length),
    label: "Core Lagos service areas",
    detail: "With wider support by project scope",
  },
  {
    value: String(projectCategories.length),
    label: "Active project tracks",
    detail: projectCategories.join(", "),
  },
  {
    value: "Homes + commercial",
    label: "Working scope",
    detail: "Planned for reliability, finishing, and handover quality",
  },
] as const;

export default function HomeTrustBand() {
  return (
    <section className={`section ${styles.section}`} aria-label="Trust and proof">
      <Container className={styles.container}>
        <div className={styles.shell}>
          <Reveal delay={0.02}>
            <div className={styles.head}>
              <p className={styles.kicker}>Proof and coverage</p>
              <h2 className={styles.title}>The trust layer clients look for before committing</h2>
              <p className={styles.lead}>
                Fast response matters, but premium electrical work is usually judged by planning,
                material discipline, finishing quality, and how confidently the job is handed over.
              </p>
            </div>
          </Reveal>

          <div className={styles.metrics}>
            {proofItems.map((item, index) => (
              <Reveal key={item.label} delay={0.05 + index * 0.04}>
                <div className={styles.metric}>
                  <strong className={styles.metricValue}>{item.value}</strong>
                  <span className={styles.metricLabel}>{item.label}</span>
                  <span className={styles.metricDetail}>{item.detail}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.18}>
            <div className={styles.actions}>
              <Link href="/projects" className="btn outline">
                Review project proof
              </Link>
              <Link href="/quote" className="btn primary">
                Start a project conversation
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
