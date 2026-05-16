import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/blog";
import { buildCollectionPath, buildProductCatalog, buildProductPath } from "@/lib/product-catalog";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";
import { getAllProjectSlugs } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";
import { serviceAreas } from "@/data/service-areas";
import { servicePages } from "@/data/service-pages";
import { productCategoryLandingPages } from "@/data/product-category-landing-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = await getAllBlogSlugs();
  const projectSlugs = getAllProjectSlugs();
  const { products } = await fetchOnlineProductsCached();
  const productCatalog = buildProductCatalog(products);
  const now = new Date();

  const staticRoutes = [
    "/",
    "/about",
    "/services",
    "/products",
    ...productCategoryLandingPages.map((page) => page.path),
    "/contact",
    "/blog",
    "/academy",
    "/projects",
    "/quote",
    "/assistant",
    "/locations",
  ];
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
    ...productCatalog.groups.map((group) => ({
      url: absoluteUrl(buildCollectionPath(group.key)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productCatalog.items.map((product) => ({
      url: absoluteUrl(buildProductPath(product)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...serviceAreas.map((area) => ({
      url: absoluteUrl(`/locations/${area.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...servicePages.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
