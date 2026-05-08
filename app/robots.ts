import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const canonicalBase = SITE_URL.replace(/\/+$/g, "");
  const host = new URL(canonicalBase).host;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${canonicalBase}/sitemap.xml`,
    host,
  };
}
