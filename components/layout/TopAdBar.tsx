import Container from "@/components/layout/Container";
import styles from "@/components/layout/SiteChrome.module.css";

export default function TopAdBar() {
  return (
    <div className={styles.topAdBar} aria-label="Promotions and announcements">
      <Container className={styles.topAdBarInner}>
        <div className={styles.topAdBarViewport}>
          <div className={styles.topAdBarTrack}>
            <span className={styles.topAdBarLabel}>Lagos</span>
            <span className={styles.topAdBarText}>
              Premium electrical installations, verified materials, and fast quote response for
              homes and commercial spaces.
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
}
