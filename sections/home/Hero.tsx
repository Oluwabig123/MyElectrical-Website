"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { CONTACT_LINKS } from "@/data/contact";
import { heroGallery } from "@/data/hero-gallery";

const HERO_ROTATE_MS = 6000;
const SWIPE_THRESHOLD_PX = 42;

export default function Hero() {
  const hasSlides = heroGallery.length > 0;
  const totalSlides = heroGallery.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const safeActiveIndex =
    hasSlides && totalSlides > 0 ? ((activeIndex % totalSlides) + totalSlides) % totalSlides : 0;
  const activeSlide = hasSlides ? (heroGallery[safeActiveIndex] ?? heroGallery[0]) : null;
  const shouldAutoRotate =
    hasSlides && totalSlides > 1 && !prefersReducedMotion && !isPageHidden;

  function goToNextSlide() {
    if (!hasSlides || totalSlides <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }

  function goToPrevSlide() {
    if (!hasSlides || totalSlides <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }

  function goToSlide(index: number) {
    if (!hasSlides || totalSlides <= 0) return;
    const normalizedIndex = ((index % totalSlides) + totalSlides) % totalSlides;
    setActiveIndex(normalizedIndex);
  }

  useEffect(() => {
    if (!hasSlides) return undefined;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, [hasSlides]);

  useEffect(() => {
    if (!hasSlides) return undefined;
    const onVisibilityChange = () => setIsPageHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hasSlides]);

  useEffect(() => {
    if (!shouldAutoRotate) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [shouldAutoRotate, totalSlides]);

  function handleHeroKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasSlides || totalSlides <= 1) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNextSlide();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevSlide();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      goToSlide(totalSlides - 1);
    }
  }

  function clearTouchTracking() {
    setTouchStartX(null);
    setTouchStartY(null);
  }

  function handleHeroTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!hasSlides || totalSlides <= 1) return;
    const touchPoint = event.touches?.[0];
    if (!touchPoint) return;
    setTouchStartX(touchPoint.clientX);
    setTouchStartY(touchPoint.clientY);
  }

  function handleHeroTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!hasSlides || totalSlides <= 1) return;
    const touchPoint = event.changedTouches?.[0];

    if (touchStartX == null || touchStartY == null || !touchPoint) {
      clearTouchTracking();
      return;
    }

    const deltaX = touchPoint.clientX - touchStartX;
    const deltaY = touchPoint.clientY - touchStartY;
    const isHorizontalSwipe =
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      if (deltaX < 0) goToNextSlide();
      if (deltaX > 0) goToPrevSlide();
    }

    clearTouchTracking();
  }

  if (!hasSlides || !activeSlide) return null;

  return (
    <section className="hero">
      <div
        className="heroStage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured services gallery"
        tabIndex={0}
        onKeyDown={handleHeroKeyDown}
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
        onTouchCancel={clearTouchTracking}
      >
        <div className="heroGallery">
          <figure key={activeSlide.id} className="heroGalleryItem active">
            <Image
              src={activeSlide.image}
              alt={activeSlide.alt}
              fill
              priority={safeActiveIndex === 0}
              loading={safeActiveIndex === 0 ? "eager" : "lazy"}
              fetchPriority={safeActiveIndex === 0 ? "high" : "auto"}
              sizes="100vw"
            />
          </figure>
        </div>

        <div className="heroOverlay" aria-hidden="true" />

        <Container className="heroContentWrap">
          <div className="heroContent">
            {/* Interactive Service Selector Pills */}
            <div className="heroServicePills" role="tablist" aria-label="Quick service selector">
              {heroGallery.map((item, index) => (
                <button
                  key={`hero-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={index === safeActiveIndex}
                  className={`heroServicePill${index === safeActiveIndex ? " active" : ""}`}
                  onClick={() => goToSlide(index)}
                >
                  <span>{item.tabLabel}</span>
                </button>
              ))}
            </div>

            <Reveal key={activeSlide.id}>
              <p className="heroKicker">{activeSlide.kicker}</p>
              <h1 className="h1">{activeSlide.title}</h1>
              <p className="p">{activeSlide.copy}</p>

              {/* Mobile benefit badges */}
              <div className="heroMobileBenefits" aria-label="Key guarantees">
                {activeSlide.benefits.map((benefit) => (
                  <span key={`${activeSlide.id}-${benefit}`} className="heroMobileBenefit">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{benefit}</span>
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal key={`${activeSlide.id}-actions`} delay={0.08}>
              <div className="heroCtaShell">
                <div className="heroCtas">
                  <Link href={activeSlide.ctaTo || "/quote"} className="btn primary heroPrimaryBtn">
                    {activeSlide.ctaLabel || "Request Site Inspection"}
                  </Link>
                  <a
                    className="btn outline heroWhatsappBtn"
                    target="_blank"
                    rel="noreferrer"
                    href={CONTACT_LINKS.whatsapp}
                  >
                    <span>WhatsApp</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.532 1.942.847 2.796.847 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.733-5.768-5.733zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.456-.475-4.914-1.306l-5.086 1.333 1.357-4.957c-.914-1.503-1.428-3.262-1.428-5.07 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                    </svg>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal key={`${activeSlide.id}-aside`} delay={0.14}>
            <aside className="heroAside" aria-label="Current service spotlight">
              <div className="heroAsideTop">
                <span className="heroAsideLabel">Focus Discipline</span>
                <span className="heroAsideCount">
                  0{safeActiveIndex + 1} / 0{totalSlides}
                </span>
              </div>

              <div className="heroBenefits" aria-label="Service highlights">
                {activeSlide.benefits.map((benefit) => (
                  <span key={`${activeSlide.id}-${benefit}`} className="heroBenefit">
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="heroAsideFoot">
                <p className="heroAsideText">Clean execution for homes, offices, and commercial builds.</p>
                <Link href="/projects" className="heroAsideLink">
                  See project work &rarr;
                </Link>
              </div>
            </aside>
          </Reveal>
        </Container>

        {totalSlides > 1 ? (
          <div className="heroControls" aria-label="Hero gallery indicators">
            {heroGallery.map((item, index) => (
              <button
                key={`hero-control-${item.id}`}
                type="button"
                className={`heroDot${index === safeActiveIndex ? " active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`Switch to ${item.tabLabel}`}
                aria-pressed={index === safeActiveIndex}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
