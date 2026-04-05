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
    "Explore our completed electrical projects including wiring, lighting, solar, and smart solutions in Lagos Nigeria.",
  path: "/projects",
  keywords: ["electrical projects Lagos", "lighting projects Lagos", "solar projects Nigeria", "electrical installations Lagos"],
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
          title="Electrical installations delivered across Lagos"
          subtitle="Browse completed project snapshots covering wiring, lighting, solar, and electrical finishing work."
        />

        <div className="seoContentCard seoIntroCard">
          <div className="seoContentGrid">
            <p className="p">
              These projects show the type of work Oduzz Electrical Concept delivers in Lagos:
              cleaner routing, better protection choices, balanced lighting layouts, and more dependable
              power systems.
            </p>
            <p className="p">
              They also demonstrate the business approach behind the installations: practical material
              selection, neat execution, and outcomes that are easy for clients to inspect and trust.
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
