import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SEO from "../components/ui/SEO";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import {
  academyAudiences,
  academyIntro,
  academyOutcomes,
  academyResources,
  academyTracks,
} from "../data/academy";

export default function Academy() {
  return (
    <section className="section academyPage">
      <SEO
        title="Academy - Oduzz Electrical Concept"
        description="A structured learning hub for homeowners, business owners, and aspiring electrical learners."
      />
      <Container>
        <SectionHeader
          kicker="Academy"
          title={academyIntro.title}
          subtitle={academyIntro.subtitle}
        />

        <Reveal>
          <article className="card academyIntroCard">
            <div className="academyIntroCopy">
              {academyIntro.lead.map((paragraph) => (
                <p key={paragraph} className="academyLead">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="academyActionRow">
              <a className="btn outline" href="#academy-tracks">View tracks</a>
              <a className="btn outline" href="#academy-resources">View resources</a>
              <Link to="/assistant"><Button variant="primary">Ask assistant</Button></Link>
            </div>
          </article>
        </Reveal>

        <div className="academyAudienceGrid">
          {academyAudiences.map((audience, index) => (
            <Reveal key={audience.title} delay={index * 0.04}>
              <article className="card academyAudienceCard">
                <span className="academyLabel">{audience.label}</span>
                <h3 className="cardTitle academyAudienceTitle">{audience.title}</h3>
                <p className="p">{audience.summary}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <section id="academy-tracks" className="academySectionBlock" aria-labelledby="academy-tracks-title">
          <div className="sectionHeader academySectionIntro">
            <div className="kicker">Learning Tracks</div>
            <h2 className="h2" id="academy-tracks-title">What the academy can teach</h2>
            <p className="p">
              These tracks make the page feel like a real learning destination instead of a single generic sales block.
            </p>
          </div>

          <div className="academyTrackGrid">
            {academyTracks.map((track, index) => (
              <Reveal key={track.title} delay={index * 0.04}>
                <article className="card academyTrackCard">
                  <div className="blogMetaRow">
                    <span className="blogPill blogPillAccent">{track.level}</span>
                    <span className="blogPill">{track.duration}</span>
                    <span className="blogPill">{track.audience}</span>
                  </div>
                  <h3 className="cardTitle academyTrackTitle">{track.title}</h3>
                  <p className="p">{track.summary}</p>
                  <ul className="academyTrackList">
                    {track.modules.map((module) => (
                      <li key={module}>{module}</li>
                    ))}
                  </ul>
                  <p className="academyTrackOutcome">{track.outcome}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="academy-resources" className="academySectionBlock" aria-labelledby="academy-resources-title">
          <div className="sectionHeader academySectionIntro">
            <div className="kicker">Resources</div>
            <h2 className="h2" id="academy-resources-title">Formats this can support next</h2>
            <p className="p">
              These resource lanes make the hub flexible enough for articles, downloads, short classes, or workshop
              announcements.
            </p>
          </div>

          <div className="academyResourceGrid">
            {academyResources.map((resource, index) => (
              <Reveal key={resource.title} delay={index * 0.04}>
                <article className="card academyResourceCard">
                  <div className="academyResourceTop">
                    <span className="academyLabel">{resource.type}</span>
                    <span className="blogPill">{resource.status}</span>
                  </div>
                  <h3 className="cardTitle">{resource.title}</h3>
                  <p className="p">{resource.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="academySectionBlock" aria-labelledby="academy-outcomes-title">
          <div className="sectionHeader academySectionIntro">
            <div className="kicker">Outcomes</div>
            <h2 className="h2" id="academy-outcomes-title">What this adds to the business</h2>
          </div>

          <div className="academyOutcomeGrid">
            {academyOutcomes.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.04}>
                <article className="card academyOutcomeCard">
                  <h3 className="cardTitle">{item.title}</h3>
                  <p className="p">{item.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal delay={0.14}>
          <div className="academyFoot">
            <p className="blogSummary">
              Next layer after this hub: lesson detail pages, downloadable guides, workshop signups, and lead capture
              tied to each learning track.
            </p>
            <div className="projectsToolbarActions">
              <Link to="/blog"><Button variant="outline">Read blog</Button></Link>
              <Link to="/quote"><Button variant="primary">Start project</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
