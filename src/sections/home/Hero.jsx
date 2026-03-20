import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Reveal from "../../components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "../../data/contact.js";
import { heroGallery } from "../../data/heroGallery.js";

const HERO_ROTATE_MS = 5000;
const SWIPE_THRESHOLD_PX = 42;

function fitSingleLineText(element, minFontSizePx) {
  if (!element || typeof window === "undefined") return;

  element.style.removeProperty("font-size");

  const availableWidth = element.clientWidth;
  if (!availableWidth) return;

  let currentSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
  if (Number.isNaN(currentSize)) return;

  while (element.scrollWidth > availableWidth && currentSize > minFontSizePx) {
    currentSize -= 0.5;
    element.style.fontSize = `${currentSize}px`;
  }
}

export default function Hero() {
  const hasSlides = heroGallery.length > 0;
  const totalSlides = heroGallery.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const titleRef = useRef(null);
  const copyRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

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

  function goToSlide(index) {
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
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, HERO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [shouldAutoRotate, totalSlides]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let frame = 0;

    const fitText = () => {
      fitSingleLineText(titleRef.current, 14);
      fitSingleLineText(copyRef.current, 11);
    };

    const queueFit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitText);
    };

    queueFit();
    window.addEventListener("resize", queueFit);

    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) queueFit();
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", queueFit);
    };
  }, [activeSlide?.id]);

  function handleHeroKeyDown(event) {
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
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }

  function handleHeroTouchStart(event) {
    if (!hasSlides || totalSlides <= 1) return;
    const touchPoint = event.touches?.[0];
    if (!touchPoint) return;
    touchStartXRef.current = touchPoint.clientX;
    touchStartYRef.current = touchPoint.clientY;
  }

  function handleHeroTouchEnd(event) {
    if (!hasSlides || totalSlides <= 1) return;

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const touchPoint = event.changedTouches?.[0];

    if (startX == null || startY == null || !touchPoint) {
      clearTouchTracking();
      return;
    }

    const deltaX = touchPoint.clientX - startX;
    const deltaY = touchPoint.clientY - startY;
    const isHorizontalSwipe = Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      if (deltaX < 0) goToNextSlide();
      if (deltaX > 0) goToPrevSlide();
    }

    clearTouchTracking();
  }

  function handleHeroTouchCancel() {
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
        onTouchCancel={handleHeroTouchCancel}
      >
        <div className="heroGallery">
          <figure key={activeSlide.id} className="heroGalleryItem active">
            <img
              src={activeSlide.image}
              alt={activeSlide.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </figure>
        </div>

        <div className="heroOverlay" aria-hidden="true" />

        <Container className="heroContentWrap">
          <div className="heroContent">
            <Reveal key={activeSlide.id}>
              <p className="heroContactLead">
                <a href={CONTACT_LINKS.phone}>Call {CONTACT.phoneDisplay}</a>
                <span aria-hidden="true">|</span>
                <a target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>WhatsApp</a>
              </p>
              <p className="heroKicker">{activeSlide.kicker}</p>
              <h1 ref={titleRef} className="h1">{activeSlide.title}</h1>
              <p ref={copyRef} className="p">{activeSlide.copy}</p>
            </Reveal>

            <Reveal key={`${activeSlide.id}-actions`} delay={0.08}>
              <div className="heroCtas">
                <Link to={activeSlide.ctaTo || "/quote"} className="btn primary">
                  {activeSlide.ctaLabel || "Request Quote"}
                </Link>
                <a className="btn outline heroCallBtn" href={CONTACT_LINKS.phone}>Call Now</a>
              </div>
            </Reveal>

            <p className="heroServicesPrompt">
              Need details first? <Link to="/services">See our services</Link>
            </p>
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
