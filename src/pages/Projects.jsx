import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import ParallaxImage from "../components/ui/ParallaxImage";
import { projectCategories, projects } from "../data/projects";
import { safeExternalUrl } from "../utils/safeExternalUrl";

export default function Projects() {
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    if (cat === "All") return projects;
    return projects.filter((p) => p.category === cat);
  }, [cat]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const el = document.getElementById(`project-${selectedProjectId}`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [selectedProjectId, filtered]);

  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Projects"
          title="Work gallery"
          subtitle="Verified installs with neat finishing and safe protection."
        />

        <div className="filters">
          {projectCategories.map((c) => (
            <button
              key={c}
              className={`chip ${c === cat ? "active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid-3">
          {filtered.map((p, i) => {
            const mapUrl = safeExternalUrl(p.mapUrl);
            return (
              <Reveal key={p.id} delay={i * 0.03}>
                <article
                  id={`project-${p.id}`}
                  className={`card ${selectedProjectId === p.id ? "projectCardActive" : ""}`}
                >
                  <ParallaxImage src={p.image} alt={p.title} height={280} intensity={60} />
                  <div style={{ marginTop: 12 }}>
                    <div className="cardTitle">{p.title}</div>
                    <p className="p">{p.summary}</p>

                    <div className="projectMetaGrid" aria-label={`${p.title} metadata`}>
                      {p.scope ? (
                        <p className="projectMeta">
                          <span>Scope</span>
                          <strong>{p.scope}</strong>
                        </p>
                      ) : null}
                      {p.duration ? (
                        <p className="projectMeta">
                          <span>Duration</span>
                          <strong>{p.duration}</strong>
                        </p>
                      ) : null}
                      {p.location ? (
                        <p className="projectMeta">
                          <span>Location</span>
                          <strong>{p.location}</strong>
                        </p>
                      ) : null}
                    </div>

                    {p.outcome ? <p className="projectOutcome">{p.outcome}</p> : null}

                    {mapUrl ? (
                      <a
                        className="projectMapLink"
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open map
                      </a>
                    ) : null}

                    <div className="quote">"{p.quote}"</div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
