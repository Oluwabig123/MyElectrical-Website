import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/components/blog/BlogCard";
import BlogNewsletterCta from "@/components/blog/BlogNewsletterCta";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import MarkdownContent from "@/components/blog/MarkdownContent";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import { getServicePageBySlug } from "@/data/service-pages";
import {
  extractMarkdownHeadings,
  formatBlogDate,
  getAllBlogPosts,
  getAllBlogSlugs,
  getBlogPostBySlug,
} from "@/lib/blog";
import {
  extractArticleLead,
  extractArticleTip,
  getRelatedBlogPosts,
  resolveBlogVisual,
} from "@/lib/blog-editorial";
import type { BlogPost } from "@/lib/blog-shared";
import { buildCollectionPath, type ProductCategoryKey, resolveProductCategory } from "@/lib/product-catalog";
import { buildMetadata } from "@/lib/seo";
import { buildBlogArticleSchema } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Article Not Found",
    };
  }

  const visual = resolveBlogVisual(post);

  return {
    ...buildMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${slug}`,
      keywords: [post.category, ...post.tags],
      image: visual.src,
      type: "article",
    }),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      siteName: "Oduzz Electrical Concept",
      type: "article",
      publishedTime: `${post.publishedAt}T00:00:00Z`,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: visual.src,
          alt: visual.alt,
        },
      ],
    },
  };
}

type RelatedRoute = {
  label: string;
  href: string;
};

const BLOG_RELATION_RULES: Array<{
  keywords: string[];
  serviceSlug: string;
  categoryKey: ProductCategoryKey;
}> = [
  {
    keywords: ["wiring", "inspection", "safety", "maintenance", "planning", "checklist"],
    serviceSlug: "residential-commercial-wiring",
    categoryKey: "wiring-cables",
  },
  {
    keywords: ["lighting", "ceiling", "finishing"],
    serviceSlug: "lighting-interior-finishing",
    categoryKey: "lighting",
  },
  {
    keywords: ["solar", "inverter", "energy"],
    serviceSlug: "solar-inverter-installation",
    categoryKey: "power-backup-solar",
  },
  {
    keywords: ["cctv", "security", "camera"],
    serviceSlug: "cctv-security-systems",
    categoryKey: "cctv-cameras",
  },
  {
    keywords: ["materials", "quality", "original", "fake"],
    serviceSlug: "fault-diagnosis-maintenance",
    categoryKey: "electrical-accessories",
  },
];

function resolveRelatedRoutes(post: BlogPost) {
  const tokens = [post.category, ...post.tags]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const serviceLinks: RelatedRoute[] = [];
  const collectionLinks: RelatedRoute[] = [];
  const serviceSeen = new Set<string>();
  const collectionSeen = new Set<string>();

  BLOG_RELATION_RULES.forEach((rule) => {
    const isMatch = rule.keywords.some((keyword) =>
      tokens.some((token) => token.includes(keyword) || keyword.includes(token)),
    );
    if (!isMatch) return;

    const service = getServicePageBySlug(rule.serviceSlug);
    if (service && !serviceSeen.has(service.slug)) {
      serviceSeen.add(service.slug);
      serviceLinks.push({
        label: service.shortTitle,
        href: `/services/${service.slug}`,
      });
    }

    const category = resolveProductCategory(rule.categoryKey);
    if (category && !collectionSeen.has(category.key)) {
      collectionSeen.add(category.key);
      collectionLinks.push({
        label: category.label,
        href: buildCollectionPath(category.key),
      });
    }
  });

  return {
    serviceLinks: serviceLinks.slice(0, 2),
    collectionLinks: collectionLinks.slice(0, 2),
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getBlogPostBySlug(slug), getAllBlogPosts()]);

  if (!post) notFound();

  const visual = resolveBlogVisual(post);
  const headings = extractMarkdownHeadings(post.content);
  const relatedPosts = getRelatedBlogPosts(allPosts, post, 3);
  const leadParagraph = extractArticleLead(post.content, post.excerpt);
  const articleTip = extractArticleTip(post.content, post.excerpt);
  const relatedRoutes = resolveRelatedRoutes(post);

  return (
    <article className="pb-20 pt-8 md:pb-28 md:pt-12">
      <JsonLd data={buildBlogArticleSchema(post)} />

      <section>
        <Container>
          <div className="overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-[#10192a]/85 to-[#080e18]/95 px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)] text-white md:px-10 md:py-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60 transition duration-200 hover:text-[#ffd400]"
            >
              <span aria-hidden="true">←</span>
              Back to Journal
            </Link>

            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd400]">
                  <span className="rounded-full border border-[#ffd400]/30 bg-[#ffd400]/15 px-3 py-1 text-[#ffd400]">
                    {post.category}
                  </span>
                  <span className="text-white/60">{formatBlogDate(post.publishedAt)}</span>
                  <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
                  <span className="text-white/60">{post.readingTime}</span>
                </div>

                <h1 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl lg:text-[3.5rem]">
                  {post.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
                  {post.excerpt}
                </p>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#ffd400]">
                  By {post.author}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd400]">
                    Published
                  </p>
                  <p className="mt-1 text-base font-bold tracking-[-0.02em] text-white">
                    {formatBlogDate(post.publishedAt)}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd400]">
                    Read Time
                  </p>
                  <p className="mt-1 text-base font-bold tracking-[-0.02em] text-white">
                    {post.readingTime}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd400]">
                    Tags
                  </p>
                  <p className="mt-1 text-base font-bold tracking-[-0.02em] text-white">
                    {post.tags.length} Topics
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-8 aspect-[16/8.5] overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1624]">
              <Image
                src={visual.src}
                alt={visual.alt}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1120px"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-10 md:pt-14">
        <Container>
          <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
            <aside className="self-start xl:sticky xl:top-28">
              <BlogTableOfContents headings={headings} />
            </aside>

            <div className="rounded-[34px] border border-white/10 bg-gradient-to-b from-[#10192a]/85 to-[#080e18]/95 px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-white md:px-10 md:py-10">
              <p className="border-l-2 border-[#ffd400] pl-5 text-xl font-bold leading-relaxed tracking-[-0.02em] text-white md:text-2xl">
                {leadParagraph}
              </p>

              <div className="mt-8 h-px w-full bg-white/10" />

              <div className="mt-8 [&_a]:text-[#ffd400] [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:rounded-[20px] [&_blockquote]:border [&_blockquote]:border-white/10 [&_blockquote]:bg-white/[0.04] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-white/85 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.02em] [&_h2]:text-white [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_img]:rounded-[20px] [&_img]:border [&_img]:border-white/10 [&_li]:text-[15px] [&_li]:leading-7 [&_li]:text-white/75 [&_ol]:my-5 [&_ol]:space-y-2 [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-white/75 [&_strong]:text-white [&_ul]:my-5 [&_ul]:space-y-2">
                <MarkdownContent content={post.content} />
              </div>
            </div>

            <aside className="self-start space-y-6 xl:sticky xl:top-28">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd400]">
                  Engineering Takeaway
                </p>
                <p className="mt-3 text-sm leading-6 text-white/75">{articleTip}</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd400]">
                  Article Tags
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {relatedRoutes.serviceLinks.length > 0 || relatedRoutes.collectionLinks.length > 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd400]">
                    Related Services &amp; Products
                  </p>
                  <div className="mt-3 space-y-2">
                    {relatedRoutes.serviceLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition duration-200 hover:border-[#ffd400]/40 hover:text-[#ffd400]"
                      >
                        Service: {item.label} →
                      </Link>
                    ))}
                    {relatedRoutes.collectionLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition duration-200 hover:border-[#ffd400]/40 hover:text-[#ffd400]"
                      >
                        Catalog: {item.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {relatedPosts.length > 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd400]">
                    Related Articles
                  </p>
                  <div className="mt-4 space-y-4">
                    {relatedPosts.map((item) => (
                      <BlogCard key={item.slug} post={item} variant="compact" />
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>

          <div className="mt-10 md:mt-14">
            <BlogNewsletterCta />
          </div>
        </Container>
      </section>
    </article>
  );
}
