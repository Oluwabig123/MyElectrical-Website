import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import ParallaxImage from "../components/ui/ParallaxImage";
import { CONTACT } from "../data/contact";
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
    <section className="section projectsPage">
      <Container>
        <SectionHeader
          kicker="Projects"
          title="Work gallery"
          subtitle="Verified installs with neat finishing and safe protection."
        />

        <div className="projectsToolbar">
          <p className="projectsSummary">
            {filtered.length} project{filtered.length === 1 ? "" : "s"} shown
            {cat !== "All" ? ` in ${cat}` : ""}. Typical response {CONTACT.whatsappResponseTime}.
          </p>
          <div className="projectsToolbarActions">
            <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
          </div>
        </div>

        <div className="projectsFiltersWrap">
          <div className="filters" aria-label="Filter projects by category">
            {projectCategories.map((c) => (
              <button
                type="button"
                key={c}
                className={`chip ${c === cat ? "active" : ""}`}
                onClick={() => setCat(c)}
                aria-pressed={c === cat}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <article className="card projectsEmpty">
            <h3 className="cardTitle">No projects in this category yet</h3>
            <p className="p">Try another filter or request a similar service quote.</p>
            <div className="projectsToolbarActions">
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </article>
        ) : (
          <div className="projectsGrid">
            {filtered.map((p, i) => {
              const mapUrl = safeExternalUrl(p.mapUrl);
              return (
                <Reveal key={p.id} delay={i * 0.03}>
                  <article
                    id={`project-${p.id}`}
                    className={`card projectCard ${selectedProjectId === p.id ? "projectCardActive" : ""}`}
                  >
                    <ParallaxImage src={p.image} alt={p.title} height={280} intensity={60} />

                    <div className="projectCardBody">
                      <div className="projectCardHead">
                        <span className="projectCategory">{p.category}</span>
                      </div>

                      <h3 className="cardTitle projectTitle">{p.title}</h3>
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
        )}

        <Reveal delay={0.12}>
          <div className="projectsFoot">
            <p className="projectsFootNote">
              Need a similar installation? Share your location and service type for a fast estimate.
            </p>
            <div className="projectsToolbarActions">
              <Link to="/quote"><Button variant="primary">Start quote</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
