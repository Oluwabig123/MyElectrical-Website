import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import ProjectsGridClient from "@/components/projects/ProjectsGridClient";
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
          subtitle="Browse selected installations covering wiring, lighting, solar, and finishing work with scope, duration, and outcome context."
        />

        <div className="seoContentCard seoIntroCard">
          <div className="seoContentGrid">
            <p className="p">
              These case studies show the type of work Oduzz Electrical Concept delivers in Lagos:
              cleaner routing, better protection choices, balanced lighting layouts, and more
              dependable power systems.
            </p>
            <p className="p">
              They also show how the work is judged: scope clarity, finishing quality, safer
              planning, and outcomes clients can inspect with confidence at handover.
            </p>
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
