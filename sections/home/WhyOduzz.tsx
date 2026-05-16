import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import styles from "./WhyOduzz.module.css";

const principles = [
  {
    title: "Verified Material Choices",
    description:
      "Clear guidance on brands, sizes, accessories, and protection choices.",
  },
  {
    title: "Protection-First Planning",
    description:
      "Load paths and routing are reviewed before finishing starts.",
  },
  {
    title: "Cleaner Final Handover",
    description:
      "The final installation should look tidy, test properly, and feel easy to inspect.",
  },
] as const;

const handoverChecks = [
  "Protection devices selected for the real load path",
  "Routing and fittings aligned with the final finish",
  "Clear updates before scope changes affect cost or timeline",
] as const;

export default function WhyOduzz() {
  return (
    <section className={`section ${styles.section}`}>
      <Container className={styles.container}>
        <div className={styles.shell}>
          <Reveal delay={0.03}>
            <div className={styles.intro}>
              <p className={styles.kicker}>Why Oduzz</p>
              <h2 className={styles.title}>Built for clients who care how the work ends</h2>
              <p className={styles.lead}>
                Safer technical choices early. Cleaner finishing later. Fewer surprises in between.
              </p>
              <div className={styles.assurance}>
                <span className={styles.assuranceLabel}>At handover</span>
                <ul className={styles.assuranceList}>
                  {handoverChecks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
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
