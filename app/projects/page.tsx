import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import ProjectsGridClient from "@/components/projects/ProjectsGridClient";
import { CONTACT_LINKS } from "@/data/contact";
import { buildMetadata } from "@/lib/seo";
import { buildProjectsListSchema } from "@/lib/structured-data";
import { getAllProjects } from "@/lib/projects";
import JsonLd from "@/components/seo/JsonLd";

type PageProps = {
  searchParams?: Promise<{
    project?: string | string[];
    category?: string | string[];
  }>;
};

export const metadata: Metadata = buildMetadata({
  title: "Our Projects | Electrical Installations Lagos",
  description:
    "Explore real electrical installation in Lagos case studies covering wiring, lighting installation Lagos projects, solar inverter installation Lagos work, and verified material decisions.",
  path: "/projects",
  keywords: [
    "electrical projects Lagos",
    "electrical installation in Lagos",
    "lighting installation Lagos",
    "solar inverter installation Lagos",
    "verified electrical materials",
  ],
  image: "/hero/lightings.webp",
});

export default async function ProjectsPage({ searchParams }: PageProps) {
  const projects = getAllProjects();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectId = Array.isArray(resolvedSearchParams?.project)
    ? resolvedSearchParams?.project[0] ?? ""
    : resolvedSearchParams?.project ?? "";
  const initialCategory = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams?.category[0] ?? ""
    : resolvedSearchParams?.category ?? "";

  return (
    <section className="section seoPage">
      <JsonLd data={buildProjectsListSchema(projects)} />
      <Container>
        <SectionHeader
          as="h1"
          kicker="Projects"
          title="Electrical case studies delivered across Lagos"
          subtitle="Browse selected electrical projects across wiring, lighting, solar, and finishing work with clear scope, duration, and outcome context."
        />

        <div className="seoCardGrid seoIntroCard">
          <article className="card seoInfoCard">
            <h2 className="cardTitle">What these projects show</h2>
            <p className="p">
              Selected case studies across solar, wiring, lighting, and finishing work completed
              with cleaner routing, safer planning, and better installation outcomes.
            </p>
          </article>
          <article className="card seoInfoCard">
            <h2 className="cardTitle">Why clients review them</h2>
            <p className="p">
              They help clients inspect the quality of execution, understand project scope, and
              request similar work with more confidence.
            </p>
          </article>
        </div>

        <div className="seoContentCard seoIntroCard">
          <div className="seoContentGrid">
            <div>
              <h2 className="h2">Need similar electrical work?</h2>
              <p className="p">
                Request a quote for wiring, solar, lighting, inverter setup, or finishing work.
              </p>
            </div>
            <div className="seoActionRow">
              <Link href="/quote" className="btn primary">
                Request Quote
              </Link>
              <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn outline">
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <ProjectsGridClient
          projects={projects}
          selectedProjectId={selectedProjectId}
          initialCategory={initialCategory}
        />
      </Container>
    </section>
  );
}
