"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { CONTACT_LINKS } from "@/data/contact";
import { heroGallery } from "@/data/hero-gallery";

const HERO_ROTATE_MS = 5000;
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
            <Reveal key={activeSlide.id}>
              <p className="heroKicker">{activeSlide.kicker}</p>
              <h1 className="h1">
                {activeSlide.title}
              </h1>
              <p className="p">
                {activeSlide.copy}
              </p>
            </Reveal>

            <Reveal key={`${activeSlide.id}-actions`} delay={0.08}>
              <div className="heroCtaShell">
                <div className="heroCtas">
                  <Link href={activeSlide.ctaTo || "/quote"} className="btn primary heroPrimaryBtn">
                    {activeSlide.ctaLabel || "Request Quote"}
                  </Link>
                  <a
                    className="btn outline heroWhatsappBtn"
                    target="_blank"
                    rel="noreferrer"
                    href={CONTACT_LINKS.whatsapp}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="heroBenefits" aria-label="Service highlights">
                {activeSlide.benefits.map((benefit) => (
                  <span key={`${activeSlide.id}-${benefit}`} className="heroBenefit">
                    {benefit}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>

        {totalSlides > 1 ? (
          <div className="heroControls" aria-label="Hero gallery controls">
            {heroGallery.map((item, index) => (
              <button
                key={`hero-control-${item.id}`}
                type="button"
                className={`heroDot${index === safeActiveIndex ? " active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`Show slide ${index + 1}: ${item.title}`}
                aria-pressed={index === safeActiveIndex}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
