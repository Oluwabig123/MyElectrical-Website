import Image from "next/image";
import Link from "next/link";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import Container from "@/components/layout/Container";
import styles from "@/components/layout/SiteChrome.module.css";

const primaryLinks = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/quote", label: "Request Quote" },
] as const;

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/locations", label: "Service Areas" },
] as const;

const resourceLinks = [
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
            <p className={styles.footerEyebrow}>Electrical installs and verified materials</p>
            <p className={styles.footerTagline}>Powering Homes. Brightening Futures.</p>
            <p className={styles.footerLead}>
              Installations, upgrades, and material sourcing shaped for homes, retail spaces, and commercial sites in
              Lagos.
            </p>
            <p className={styles.footerLocation}>Ikorodu, Lagos, Nigeria</p>
            <div className={styles.footerBadges}>
              <span className={styles.footerBadge}>Licensed Electricians</span>
              <span className={styles.footerBadge}>Safety-First Installs</span>
            </div>
          </section>

          <nav className={styles.footerCol} aria-label="Footer quick links">
            <div className={styles.footerTitle}>Navigate</div>
            <div className={styles.footerLinkColumns}>
              <div className={styles.footerLinkGroup}>
                <div className={styles.footerGroupTitle}>Main</div>
                <div className={styles.footerLinksList}>
                  {primaryLinks.map((item) => (
                    <Link key={item.href} className={styles.footerLink} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={styles.footerLinkGroup}>
                <div className={styles.footerGroupTitle}>Company</div>
                <div className={styles.footerLinksList}>
                  {companyLinks.map((item) => (
                    <Link key={item.href} className={styles.footerLink} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={styles.footerLinkGroup}>
                <div className={styles.footerGroupTitle}>Resources</div>
                <div className={styles.footerLinksList}>
                  {resourceLinks.map((item) => (
                    <Link key={item.href} className={styles.footerLink} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className={`${styles.footerCol} ${styles.footerContactCol}`}>
            <div className={styles.footerTitle}>Talk to Oduzz</div>
            <p className={styles.footerMeta}>For installs, product support, and guided quotations.</p>
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
