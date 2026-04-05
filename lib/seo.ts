import type { Metadata } from "next";

export const SITE_NAME = "Oduzz Electrical Concept";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oduzzconcept.com.ng";
export const DEFAULT_OG_IMAGE = "/hero/lightings.webp";
export const BUSINESS_LOCATION = "Lagos, Nigeria";
export const BUSINESS_ADDRESS_LOCALITY = "Lagos";
export const BUSINESS_ADDRESS_COUNTRY = "NG";
export const BUSINESS_DESCRIPTION =
  "Oduzz Electrical Concept supplies carefully selected electrical products and provides expert guidance for residential and commercial projects in Lagos, Nigeria. From cables and wires to lighting systems, sockets, and fittings, every product is chosen for safety, durability, performance, and authenticity.";

export const DEFAULT_KEYWORDS = [
  "electrical products Lagos",
  "cables and wires Nigeria",
  "lighting systems Lagos",
  "electrical sockets Nigeria",
  "electrical installation Lagos",
];

type BuildMetadataArgs = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
};

function trimSlashes(value: string) {
  return value.replace(/\/+$/g, "");
}

export function normalizePath(path = "/") {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path = "/") {
  const base = trimSlashes(SITE_URL);
  const safePath = normalizePath(path);
  return safePath === "/" ? base : `${base}${safePath}`;
}

export function dedupeKeywords(keywords: string[] = []) {
  return Array.from(new Set([...DEFAULT_KEYWORDS, ...keywords].map((keyword) => keyword.trim()).filter(Boolean)));
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: BuildMetadataArgs): Metadata {
  const canonicalPath = normalizePath(path);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const resolvedImage = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    keywords: dedupeKeywords(keywords),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_NG",
      type,
      images: [
        {
          url: resolvedImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [resolvedImage],
    },
  };
}
