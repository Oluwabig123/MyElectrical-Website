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
    keywords: ["wiring", "inspection", "safety", "maintenance"],
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
          <div className="overflow-hidden rounded-[40px] border border-[color:var(--editorial-border)] bg-[rgba(255,251,245,0.78)] px-5 py-8 shadow-[0_18px_50px_rgba(17,17,17,0.05)] md:px-8 md:py-10 xl:px-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5c564c] transition duration-200 hover:text-[#161512]"
            >
              <span aria-hidden="true">←</span>
              Back to journal
            </Link>

            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d6558]">
                  <span className="rounded-full bg-[#efe4d2] px-3 py-1 text-[#7a5c2e]">
                    {post.category}
                  </span>
                  <span>{formatBlogDate(post.publishedAt)}</span>
                  <span className="h-1 w-1 rounded-full bg-[#b9aa91]" aria-hidden="true" />
                  <span>{post.readingTime}</span>
                </div>

                <h1 className="mt-5 font-[family:var(--font-fraunces)] text-5xl leading-[0.95] font-semibold tracking-[-0.06em] text-[#161512] md:text-[5rem]">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#5c564c] md:text-lg">
                  {post.excerpt}
                </p>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#8f877b]">
                  By {post.author}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.6)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f877b]">
                    Published
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#161512]">
                    {formatBlogDate(post.publishedAt)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.6)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f877b]">
                    Read time
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#161512]">
                    {post.readingTime}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.6)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f877b]">
                    Tags
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#161512]">
                    {post.tags.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-8 aspect-[16/8.5] overflow-hidden rounded-[34px] border border-[color:var(--editorial-border)] bg-[#e8dfd1]">
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

            <div className="rounded-[34px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.66)] px-6 py-8 shadow-[0_18px_44px_rgba(17,17,17,0.04)] md:px-10 md:py-10">
              <p className="border-l-2 border-[#c9b084] pl-5 font-[family:var(--font-fraunces)] text-[1.65rem] leading-[1.2] tracking-[-0.03em] text-[#2a241d] md:text-[2rem]">
                {leadParagraph}
              </p>

              <div className="mt-8 h-px w-full bg-[color:var(--editorial-border)]" />

              <div className="mt-8 [&_a]:text-[#7a5c2e] [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:rounded-[24px] [&_blockquote]:border [&_blockquote]:border-[color:var(--editorial-border)] [&_blockquote]:bg-[#f6efe3] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-[#2a241d] [&_h2]:mt-12 [&_h2]:font-[family:var(--font-fraunces)] [&_h2]:text-[2.3rem] [&_h2]:leading-[1.02] [&_h2]:font-semibold [&_h2]:tracking-[-0.045em] [&_h3]:mt-8 [&_h3]:text-[1.45rem] [&_h3]:font-semibold [&_h3]:tracking-[-0.03em] [&_img]:rounded-[24px] [&_img]:border [&_img]:border-[color:var(--editorial-border)] [&_img]:shadow-[0_10px_28px_rgba(17,17,17,0.04)] [&_li]:text-[15px] [&_li]:leading-8 [&_ol]:my-6 [&_ol]:space-y-3 [&_p]:my-5 [&_p]:text-[15px] [&_p]:leading-8 [&_p]:text-[#4f493f] [&_strong]:text-[#161512] [&_ul]:my-6 [&_ul]:space-y-3">
                <MarkdownContent content={post.content} />
              </div>
            </div>

            <aside className="self-start space-y-6 xl:sticky xl:top-28">
              <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[#f6efe3] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
                  Editorial note
                </p>
                <p className="mt-4 text-sm leading-7 text-[#4f493f]">{articleTip}</p>
              </div>

              <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.58)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
                  Tags
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[color:var(--editorial-border)] bg-[#fffdf9] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#5c564c]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {relatedRoutes.serviceLinks.length > 0 || relatedRoutes.collectionLinks.length > 0 ? (
                <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.58)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
                    Related services and products
                  </p>
                  <div className="mt-4 space-y-2">
                    {relatedRoutes.serviceLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-2xl border border-[color:var(--editorial-border)] bg-[#fffdf9] px-3 py-2 text-sm font-medium text-[#2a241d] transition duration-200 hover:border-[#c9b084]"
                      >
                        Service: {item.label}
                      </Link>
                    ))}
                    {relatedRoutes.collectionLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-2xl border border-[color:var(--editorial-border)] bg-[#fffdf9] px-3 py-2 text-sm font-medium text-[#2a241d] transition duration-200 hover:border-[#c9b084]"
                      >
                        Products: {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {relatedPosts.length > 0 ? (
                <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.58)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
                    Related articles
                  </p>
                  <div className="mt-4 space-y-5">
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
