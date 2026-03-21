import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import SmartImage from "../../components/ui/SmartImage";

const showcaseItems = [
  {
    id: "showcase-pop-line",
    type: "Service",
    title: "POP Line Lighting",
    src: "/marquee/pop.webp",
    to: "/projects?project=lighting-pop-1",
  },
  {
    id: "showcase-chandelier-fit",
    type: "Fitting",
    title: "Chandelier Install",
    src: "/marquee/chandelier.webp",
    to: "/projects?project=lighting-chandelier-1",
  },
  {
    id: "showcase-accent-lighting",
    type: "Feature",
    title: "Accent Lighting",
    src: "/marquee/accent.webp",
    to: "/projects?project=lighting-accent-1",
  },
  {
    id: "showcase-premium-finish",
    type: "Showcase",
    title: "Premium Finish",
    src: "/hero/lightings.webp",
    to: "/projects?project=lighting-1",
  },
  {
    id: "showcase-chandelier-detail",
    type: "Showcase",
    title: "Fixture Detail",
    src: "/hero/2c4a14a2-dabe-4a0a-8fb0-d8821c69ccbf-1_all_9315.jpg",
    to: "/projects?project=lighting-1",
  },
  {
    id: "showcase-ceiling-piece",
    type: "Product",
    title: "Ceiling Piece",
    src: "/blog/chandelier-ceiling.webp",
    to: "/products",
  },
  {
    id: "showcase-ambient-idea",
    type: "Product",
    title: "Ambient Idea",
    src: "/blog/decorative-lighting.webp",
    to: "/products",
  },
  {
    id: "showcase-track-layout",
    type: "Layout",
    title: "Track Layout",
    src: "/blog/accent-track.webp",
    to: "/projects?project=lighting-pop-1",
  },
];

export default function LightingShowcase() {
  const railRef = useRef(null);
  const tileRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function syncViewportMode() {
      if (window.innerWidth <= 720) {
        setSlidesPerView(1);
        return;
      }

      if (window.innerWidth <= 1040) {
        setSlidesPerView(3);
        return;
      }

      setSlidesPerView(4);
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);
    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  function scrollToIndex(index) {
    const safeIndex = Math.max(0, Math.min(index, maxIndex));
    const target = tileRefs.current[safeIndex];
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(safeIndex);
  }

  function handleRailScroll() {
    const rail = railRef.current;
    if (!rail) return;

    const railLeft = rail.getBoundingClientRect().left;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    tileRefs.current.forEach((tile, index) => {
      if (!tile) return;
      const distance = Math.abs(tile.getBoundingClientRect().left - railLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex !== activeIndex) setActiveIndex(bestIndex);
  }

  function showPrev() {
    scrollToIndex(activeIndex - 1);
  }

  function showNext() {
    scrollToIndex(activeIndex + 1);
  }

  const maxIndex = Math.max(0, showcaseItems.length - slidesPerView);
  const isAtStart = activeIndex <= 0;
  const isAtEnd = activeIndex >= maxIndex;
  const paginationSteps = Array.from({ length: maxIndex + 1 }, (_, index) => index);

  return (
    <section className="section lightingShowcase">
      <Container>
        <SectionHeader
          kicker="Featured"
          title="Services and Product Highlights"
          subtitle="An image-led horizontal slider for fittings, lighting services, and showcase ideas."
        />

        <Reveal>
          <div className="showcaseCarousel">
            <div className="showcaseViewport">
              <div className="showcaseControls" aria-label="Carousel navigation">
                <button
                  type="button"
                  className="showcaseArrow showcaseArrowPrev"
                  onClick={showPrev}
                  aria-label="Show previous images"
                  disabled={isAtStart}
                >
                  <span className="showcaseArrowGlyph" aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  className="showcaseArrow showcaseArrowNext"
                  onClick={showNext}
                  aria-label="Show next images"
                  disabled={isAtEnd}
                >
                  <span className="showcaseArrowGlyph" aria-hidden="true">›</span>
                </button>
              </div>

              <div
                ref={railRef}
                className="showcaseRail"
                role="region"
                aria-roledescription="carousel"
                aria-label="Services and product highlights"
                onScroll={handleRailScroll}
              >
                {showcaseItems.map((item, index) => (
                  <Link
                    key={item.id}
                    ref={(node) => {
                      tileRefs.current[index] = node;
                    }}
                    to={item.to}
                    className="showcaseTile"
                    aria-label={`Open ${item.title}`}
                  >
                    <figure className="showcaseFigure">
                      <SmartImage src={item.src} alt={item.title} className="showcaseImage" />
                    </figure>
                    <div className="showcaseMeta">
                      <span className="showcaseType">{item.type}</span>
                      <strong className="showcaseTitle">{item.title}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="showcaseDots" aria-label="Select carousel image">
              {paginationSteps.map((index) => (
                <button
                  key={index}
                  type="button"
                  className={`showcaseDot ${index === activeIndex ? "active" : ""}`}
                  onClick={() => scrollToIndex(index)}
                  aria-label={`Show carousel position ${index + 1}`}
                  aria-pressed={index === activeIndex}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
