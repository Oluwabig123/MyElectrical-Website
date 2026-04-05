import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/blog";
import { getAllProjectSlugs } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = await getAllBlogSlugs();
  const projectSlugs = getAllProjectSlugs();
  const now = new Date();

  const staticRoutes = ["/", "/services", "/products", "/contact", "/blog", "/projects"];
  const rootChangeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly";
  const defaultChangeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly";

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: now,
      changeFrequency: route === "/" ? rootChangeFrequency : defaultChangeFrequency,
      priority: route === "/" ? 1 : 0.8,
    })),
    ...blogSlugs.map((slug) => ({
      url: absoluteUrl(`/blog/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...projectSlugs.map((slug) => ({
      url: absoluteUrl(`/projects/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
