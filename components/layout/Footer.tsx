import Image from "next/image";
import Link from "next/link";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import Container from "@/components/layout/Container";
import styles from "@/components/layout/SiteChrome.module.css";

const quickLinks = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/locations", label: "Service Areas" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/quote", label: "Request Quote" },
  { href: "/blog", label: "Blog" },
  { href: "/academy", label: "Academy" },
  { href: "/assistant", label: "Assistant" },
] as const;

export default function Footer() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className={styles.footer}>
      <Container className={styles.footerShell}>
        <div className={styles.footerTop}>
          <section className={styles.footerBrandBlock} aria-label="Business information">
            <Image
              className={styles.footerLogo}
              src="/oduzz-logo-transparent.webp"
              alt="Oduzz Electrical Concept"
              width={180}
              height={58}
              loading="lazy"
              sizes="180px"
            />
            <p className={styles.footerTagline}>Powering Homes. Brightening Futures.</p>
            <p className={styles.footerLocation}>Ikorodu, Lagos, Nigeria</p>
            <div className={styles.footerBadges}>
              <span className={styles.footerBadge}>Licensed Electricians</span>
              <span className={styles.footerBadge}>Safety-First Installs</span>
            </div>
          </section>

          <nav className={styles.footerCol} aria-label="Footer quick links">
            <div className={styles.footerTitle}>Quick Links</div>
            <div className={styles.footerLinksGrid}>
              {quickLinks.map((item) => (
                <Link key={item.href} className={styles.footerLink} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className={`${styles.footerCol} ${styles.footerContactCol}`}>
            <div className={styles.footerTitle}>Contact</div>
            <a className={styles.footerLink} href={CONTACT_LINKS.phone}>
              {CONTACT.phoneDisplay}
            </a>
            <a className={styles.footerLink} href={CONTACT_LINKS.email}>
              {CONTACT.email}
            </a>
            <p className={styles.footerMeta}>Hours: {CONTACT.businessHours}</p>
            <p className={styles.footerMeta}>Typical response: {CONTACT.whatsappResponseTime} on WhatsApp</p>
            <a className={styles.footerLink} target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
              WhatsApp Chat
            </a>
            <a
              className={`${styles.footerLink} ${styles.footerLinkHighlight}`}
              href={CONTACT_LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Start Quick Consultation
            </a>
          </div>
        </div>
      </Container>

      <div className={styles.footerBottom}>
        <Container className={styles.footerBottomInner}>
          <span className="muted" suppressHydrationWarning>
            &copy; {year} Oduzz Electrical Concept
          </span>
          <span className="muted">Safety-first | Authentic materials only</span>
        </Container>
      </div>
    </footer>
  );
}
