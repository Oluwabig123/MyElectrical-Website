import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import styles from "./WhyOduzz.module.css";

const principles = [
  {
    title: "Safety-Led Electrical Decisions",
    description:
      "Protection devices, cable sizing, and routing choices are planned before work starts so reliability is built in, not patched later.",
  },
  {
    title: "Clean Site Discipline",
    description:
      "Installations are executed with tidy routing and precise finishing so the handover looks organized and performs predictably.",
  },
  {
    title: "Transparent Project Communication",
    description:
      "Clients get clear progress updates and practical next steps, which reduces delays and keeps scope decisions aligned.",
  },
] as const;

export default function WhyOduzz() {
  return (
    <section className={`section ${styles.section}`}>
      <Container className={styles.container}>
        <div className={styles.shell}>
          <Reveal delay={0.03}>
            <div className={styles.intro}>
              <p className={styles.kicker}>Why Oduzz</p>
              <h2 className={styles.title}>Built for safe installs, clean delivery, and trusted follow-through</h2>
              <p className={styles.lead}>
                Oduzz supports residential and commercial projects with a practical operating standard:
                do the safety work properly, keep execution neat, and communicate clearly at every
                stage.
              </p>
              <div className={styles.actions}>
                <Link href="/quote" className="btn primary">
                  Start your project
                </Link>
                <Link href="/projects" className="btn outline">
                  See project outcomes
                </Link>
              </div>
            </div>
          </Reveal>

          <div className={styles.rail} aria-label="Why clients choose Oduzz">
            {principles.map((item, index) => (
              <Reveal key={item.title} delay={0.08 + index * 0.05}>
                <article className={styles.row}>
                  <span className={styles.index}>0{index + 1}</span>
                  <div className={styles.copy}>
                    <h3 className={styles.rowTitle}>{item.title}</h3>
                    <p className={styles.rowText}>{item.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
