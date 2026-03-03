import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import Reveal from "../../components/ui/Reveal";
import { CONTACT, CONTACT_LINKS } from "../../data/contact.js";
import { heroGallery } from "../../data/heroGallery.js";

const HERO_ROTATE_MS = 5000;

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const titleRef = useRef(null);
  const copyRef = useRef(null);

  if (heroGallery.length === 0) return null;

  const activeSlide = heroGallery[activeIndex] ?? heroGallery[0];
  const shouldAutoRotate =
    heroGallery.length > 1 && !prefersReducedMotion && !isInteractionPaused && !isPageHidden;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setIsPageHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!shouldAutoRotate) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroGallery.length);
    }, HERO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [shouldAutoRotate]);

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
  }, [activeSlide.id]);

  function onHeroBlur(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsInteractionPaused(false);
  }

  return (
    <section className="hero">
      <div
        className="heroStage"
        onMouseEnter={() => setIsInteractionPaused(true)}
        onMouseLeave={() => setIsInteractionPaused(false)}
        onFocusCapture={() => setIsInteractionPaused(true)}
        onBlurCapture={onHeroBlur}
      >
        <div className="heroGallery">
          {heroGallery.map((item, index) => (
            <figure
              key={item.id}
              className={`heroGalleryItem${index === activeIndex ? " active" : ""}`}
              aria-hidden={index !== activeIndex}
            >
              <img
                src={item.image}
                alt={item.alt}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
            </figure>
          ))}
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

        {heroGallery.length > 1 ? (
          <div className="heroControls" aria-label="Hero gallery controls">
            {heroGallery.map((item, index) => (
              <button
                key={`hero-control-${item.id}`}
                type="button"
                className={`heroDot${index === activeIndex ? " active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show slide ${index + 1}: ${item.title}`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
