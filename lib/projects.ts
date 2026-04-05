import { projects } from "@/data/projects";

export type ProjectRecord = (typeof projects)[number] & {
  slug: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAllProjects(): ProjectRecord[] {
  return projects.map((project) => ({
    ...project,
    slug: slugify(project.id),
  }));
}

export function getAllProjectSlugs() {
  return getAllProjects().map((project) => project.slug);
}

export function getProjectBySlug(slug: string) {
  return getAllProjects().find((project) => project.slug === slug) ?? null;
}

export function buildProjectPath(project: Pick<ProjectRecord, "slug">) {
  return `/projects/${project.slug}`;
}
