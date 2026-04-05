import Link from "next/link";
import Container from "@/components/layout/Container";
import styles from "@/components/layout/SiteChrome.module.css";

const adItems = [
  {
    href: "/quote",
    text: "Fast site visits in Ikorodu and Lagos mainland. Request a quote and get scoped properly.",
  },
  {
    href: "/assistant",
    text: "Ask Oduzz AI to narrow your service type before booking wiring, solar, CCTV, or lighting work.",
  },
  {
    href: "/projects",
    text: "Review recent installations before you commit, from panel cleanup to chandelier finishing.",
  },
  {
    href: "/products",
    text: "Need electrical materials too? Check available products while planning your project.",
  },
] as const;

export default function TopAdBar() {
  return (
    <div className={styles.topAdBar} aria-label="Promotions and announcements">
      <Container className={styles.topAdBarInner}>
        <div className={styles.topAdBarViewport}>
          <div className={styles.topAdBarTrack}>
            {[...adItems, ...adItems].map((item, index) => (
              <Link key={`${item.href}-${index}`} href={item.href} className={styles.topAdBarLink}>
                <span className={styles.topAdBarLabel}>Notice</span>
                <span className={styles.topAdBarText}>{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
