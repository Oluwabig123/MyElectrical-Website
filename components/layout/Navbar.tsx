"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import styles from "@/components/layout/SiteChrome.module.css";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current) return;
      if (headerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <header className={styles.nav} ref={headerRef}>
      <Container className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="Oduzz Electrical Concept home">
          <span className={styles.brandTraceWrap} aria-hidden="true">
            <svg className={styles.brandTrace} viewBox="0 0 100 36" preserveAspectRatio="none">
              <rect className={styles.brandTracePath} x="1" y="1" width="98" height="34" pathLength="100" />
            </svg>
          </span>
          <Image
            className={styles.brandLogo}
            src="/oduzz-logo-transparent.webp"
            alt="Oduzz Electrical Concept"
            width={186}
            height={60}
            priority
            sizes="(max-width: 920px) 150px, 186px"
          />
        </Link>

        <nav className={styles.navLinks} aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.navLink, isActivePath(pathname, item.href) && styles.active)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.navCtas}>
          <Link href="/quote" className={cn("btn", "primary", styles.navTopQuote)}>
            Request Quote
          </Link>
          <button
            type="button"
            className={styles.navBurger}
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </Container>

      {open ? (
        <div className={styles.navMobile} id="mobile-menu">
          <Container className={styles.navMobileInner}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.navMobileLink, isActivePath(pathname, item.href) && styles.active)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
