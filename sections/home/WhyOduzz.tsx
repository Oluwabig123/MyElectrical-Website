import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import styles from "./WhyOduzz.module.css";

const principles = [
  {
    title: "100% Original Pure Copper (Anti-Fire Guarantee)",
    description:
      "We source certified Coleman & Nigerchin cables directly. Every single coil is verified against undersized gauge scams that cause building fires in Nigeria.",
  },
  {
    title: "Concealed Conduit & Clean Finishing",
    description:
      "Laser-aligned wall channelling, heavy-duty PVC pipe embedding, and neatly labeled distribution panels. Zero messy surface trunking or cracked plaster.",
  },
  {
    title: "Real-World Solar & Backup Engineering",
    description:
      "Systems sized to real Nigerian power realities: pure sine wave hybrid inverters, Tier-1 lithium storage, and seamless generator auto-changeover.",
  },
  {
    title: "Surge-Protected CCTV & Smart Controls",
    description:
      "Concealed CAT6 conduit pathways for 24/7 NVR recording, and neutral-line stabilized smart touch switches built to endure grid voltage spikes.",
  },
] as const;

const handoverChecks = [
  "100% verified pure-copper cables (Coleman / Nigerchin)",
  "Concealed conduit lines with laser-straight wall embedding",
  "Surge-protected breakers (Schneider / Havells) & Tier-1 solar",
  "Itemized Bill of Quantities with zero mid-project price surprises",
] as const;

export default function WhyOduzz() {
  return (
    <section className={`section ${styles.section}`}>
      <Container className={styles.container}>
        <div className={styles.shell}>
          <Reveal delay={0.03}>
            <div className={styles.intro}>
              <p className={styles.kicker}>The Oduzz Standard</p>
              <h2 className={styles.title}>Built for Clients Who Value Safety, Clean Finishing & Reliability</h2>
              <p className={styles.lead}>
                In a Nigerian market plagued by fake cables, fire risks, and sloppy surface wiring, Oduzz engineers electrical, solar, and smart security systems that protect your building for decades.
              </p>
              <div className={styles.assurance}>
                <span className={styles.assuranceLabel}>Our Handover Guarantee</span>
                <ul className={styles.assuranceList}>
                  {handoverChecks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.actions}>
                <Link href="/quote" className="btn primary">
                  Start Your Project
                </Link>
                <Link href="/projects" className="btn outline">
                  See Project Outcomes
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
