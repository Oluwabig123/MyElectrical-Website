"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTACT_LINKS } from "@/data/contact";
import styles from "@/components/layout/SiteChrome.module.css";

const HIDDEN_ROUTES = new Set(["/assistant", "/quote", "/contact", "/test-your-memory"]);

export default function FloatingContactCTA() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.has(pathname)) return null;

  return (
    <div className={styles.floatCta} role="region" aria-label="Quick contact">
      <Link className={`${styles.floatBtn} ${styles.assistantMobileBtn}`} href="/assistant">
        Oduzz Assistant
      </Link>
      <div className={styles.floatCtaRight}>
        <Link className={`${styles.floatBtn} ${styles.quoteDesktopBtn}`} href="/quote">
          Quote
        </Link>
        <a className={styles.floatBtn} href={CONTACT_LINKS.phone}>
          Call
        </a>
        <a
          className={`${styles.floatBtn} ${styles.floatBtnPrimary}`}
          target="_blank"
          rel="noreferrer"
          href={CONTACT_LINKS.whatsapp}
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
