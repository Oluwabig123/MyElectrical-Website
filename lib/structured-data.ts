import {
  BUSINESS_ADDRESS_COUNTRY,
  BUSINESS_ADDRESS_LOCALITY,
  BUSINESS_DESCRIPTION,
  BUSINESS_LOCATION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { resolveBlogVisual } from "@/lib/blog-editorial";
import { getProductAvailability, type Product } from "@/lib/product-catalog";
import type { BlogPost } from "@/lib/blog-shared";
import type { ProjectRecord } from "@/lib/projects";

type JsonLdObject = Record<string, unknown>;

function toKoboCurrencyAmount(product: Product) {
  const amount = Number(product.priceAmount || 0);
  return amount > 0 ? Number((amount / 100).toFixed(2)) : 0;
}

function resolveImage(image?: string) {
  if (!image) return absoluteUrl("/hero/lightings.webp");
  return image.startsWith("http") ? image : absoluteUrl(image);
}

function resolveAvailability(product: Product) {
  const availability = getProductAvailability(product);
  if (availability === "In stock" || availability === "Low stock") {
    return "https://schema.org/InStock";
  }
  if (availability === "Out of stock") {
    return "https://schema.org/OutOfStock";
  }
  return "https://schema.org/LimitedAvailability";
}

export function buildLocalBusinessSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#localbusiness"),
    name: SITE_NAME,
    description: BUSINESS_DESCRIPTION,
    url: absoluteUrl("/"),
    image: absoluteUrl("/hero/lightings.webp"),
    telephone: CONTACT.phoneE164,
    email: CONTACT.email,
    areaServed: BUSINESS_LOCATION,
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS_ADDRESS_LOCALITY,
      addressRegion: BUSINESS_ADDRESS_LOCALITY,
      addressCountry: BUSINESS_ADDRESS_COUNTRY,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phoneE164,
      email: CONTACT.email,
      contactType: "customer service",
      areaServed: BUSINESS_LOCATION,
      availableLanguage: ["English"],
    },
    sameAs: [CONTACT_LINKS.whatsapp],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Electrical products and services",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Cables and wires",
        },
        {
          "@type": "OfferCatalog",
          name: "Lighting systems",
        },
        {
          "@type": "OfferCatalog",
          name: "Sockets and fittings",
        },
      ],
    },
  };
}

export function buildProductSchema(product: Product): JsonLdObject {
  const price = toKoboCurrencyAmount(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${product.slug}`)}#product`,
    name: product.name,
    description: product.description || `${product.name} from Oduzz Electrical Concept in Lagos, Nigeria.`,
    image: resolveImage(product.imageUrl),
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
    category: product.categoryLabel,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: product.currency || "NGN",
      price: price > 0 ? price : undefined,
      availability: resolveAvailability(product),
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function buildProductListSchema(products: Product[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Electrical products in Lagos",
    itemListElement: products.slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };
}

export function buildBlogArticleSchema(post: BlogPost): JsonLdObject {
  const visual = resolveBlogVisual(post);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
    headline: post.title,
    description: post.excerpt,
    image: resolveImage(visual.src),
    datePublished: `${post.publishedAt}T00:00:00Z`,
    dateModified: `${post.publishedAt}T00:00:00Z`,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/oduzz-logo-transparent.webp"),
      },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: post.tags.join(", "),
  };
}

export function buildProjectsListSchema(projects: ProjectRecord[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Electrical installation projects in Lagos",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/projects/${project.slug}`),
      name: project.title,
    })),
  };
}

export function buildProjectSchema(project: ProjectRecord): JsonLdObject[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${absoluteUrl(`/projects/${project.slug}`)}#project`,
      name: project.title,
      description: `${project.summary} ${project.outcome}`,
      image: resolveImage(project.image),
      locationCreated: {
        "@type": "Place",
        name: project.location,
        address: {
          "@type": "PostalAddress",
          addressLocality: BUSINESS_ADDRESS_LOCALITY,
          addressCountry: BUSINESS_ADDRESS_COUNTRY,
        },
      },
      provider: {
        "@type": "LocalBusiness",
        name: SITE_NAME,
        url: absoluteUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${absoluteUrl(`/projects/${project.slug}`)}#provider`,
      name: SITE_NAME,
      areaServed: BUSINESS_LOCATION,
      serviceArea: BUSINESS_LOCATION,
      makesOffer: {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `${project.category} installation`,
          areaServed: BUSINESS_LOCATION,
        },
      },
    },
  ];
}
