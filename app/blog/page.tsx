import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BlogNewsletterCta from "@/components/blog/BlogNewsletterCta";
import Container from "@/components/layout/Container";
import { BLOG_IMAGE_GALLERY } from "@/data/blog-image-gallery";
import {
  ALL_BLOG_CATEGORY,
  filterBlogPostsByCategory,
  getBlogCategories,
  resolveBlogCategory,
  resolveBlogVisual,
} from "@/lib/blog-editorial";
import { formatBlogDate, getAllBlogPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

type PageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

type SupplementalStory = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  image: {
    src: string;
    alt: string;
  };
  meta: string;
};

export const metadata: Metadata = buildMetadata({
  title: "Journal",
  description:
    "A refined editorial blog layout for lighting, wiring, solar, and installation stories.",
  path: "/blog",
  keywords: [
    "electrical blog design",
    "lighting stories",
    "solar ideas",
    "wiring journal",
  ],
  image: "/blog/chandelier-installation.jpg",
});

function buildSupplementalStories(
  categories: string[],
  usedImageSources: string[],
  count: number,
): SupplementalStory[] {
  if (count <= 0) return [];

  return BLOG_IMAGE_GALLERY.filter((image) => !usedImageSources.includes(image.src))
    .slice(0, count)
    .map((image, index) => {
      const category = image.categories[0] ?? categories[1] ?? "Ideas";
      const href =
        category && categories.includes(category)
          ? `/blog?category=${encodeURIComponent(category)}`
          : "/blog";

      return {
        id: `visual-${image.id}-${index}`,
        href,
        title: `${category} story cues for cleaner spaces`,
        excerpt: image.alt,
        category,
        image: {
          src: image.src,
          alt: image.alt,
        },
        meta: "Visual archive",
      };
    });
}

export const dynamic = "force-dynamic";

export default async function BlogPage({ searchParams }: PageProps) {
  const posts = await getAllBlogPosts();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedCategory = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams.category[0] ?? ""
    : resolvedSearchParams?.category ?? "";

  const categories = getBlogCategories(posts);
  const activeCategory = resolveBlogCategory(requestedCategory, categories);
  const filteredPosts = filterBlogPostsByCategory(posts, activeCategory);
  const featuredPost = filteredPosts.find((post) => post.featured) ?? filteredPosts[0] ?? null;
  const featuredVisual = featuredPost ? resolveBlogVisual(featuredPost) : null;
  const archivePosts = featuredPost
    ? filteredPosts.filter((post) => post.slug !== featuredPost.slug)
    : filteredPosts;
  const topStoryPosts = archivePosts.slice(0, 3);
  const lowerStoryPosts = archivePosts.slice(3, 5);

  const usedImageSources = filteredPosts.map((post) => resolveBlogVisual(post).src);
  const topStoryFillers = buildSupplementalStories(
    categories,
    usedImageSources,
    Math.max(0, 3 - topStoryPosts.length),
  );
  const lowerStoryFillers = buildSupplementalStories(
    categories,
    [...usedImageSources, ...topStoryFillers.map((story) => story.image.src)],
    Math.max(0, 2 - lowerStoryPosts.length),
  );

  const topStories = [
    ...topStoryPosts.map((post) => ({
      id: post.slug,
      href: `/blog/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      image: resolveBlogVisual(post),
      meta: `${formatBlogDate(post.publishedAt)} · ${post.readingTime}`,
    })),
    ...topStoryFillers,
  ];

  const lowerStories = [
    ...lowerStoryPosts.map((post) => ({
      id: post.slug,
      href: `/blog/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      image: resolveBlogVisual(post),
      meta: `${formatBlogDate(post.publishedAt)} · ${post.readingTime}`,
      tags: post.tags.slice(0, 2),
    })),
    ...lowerStoryFillers.map((story) => ({
      id: story.id,
      href: story.href,
      title: story.title,
      excerpt: story.excerpt,
      category: story.category,
      image: story.image,
      meta: story.meta,
      tags: [story.category],
    })),
  ];

  const introLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="pb-20 pt-8 md:pb-28 md:pt-12">
      <Container className="max-w-[1060px]">
        <section className="overflow-hidden rounded-[10px] bg-[var(--editorial-surface)] px-6 py-5 shadow-[0_30px_80px_rgba(11,16,32,0.12)] md:px-10 md:py-8">
          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--editorial-border)] pb-4">
            <Link
              href="/blog"
              className="text-sm font-semibold tracking-[-0.03em] text-[var(--editorial-ink)]"
            >
              Oduzz Journal
            </Link>

            <nav className="hidden items-center gap-7 text-xs font-medium text-[var(--editorial-muted)] md:flex">
              {introLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-[var(--editorial-ink)]">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 text-xs text-[var(--editorial-muted)]">
              <span className="hidden md:inline">Search</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 stroke-current"
                fill="none"
                strokeWidth="1.6"
              >
                <circle cx="9" cy="9" r="5.5" />
                <path d="M13 13l4 4" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="mx-auto max-w-[760px] px-1 pb-10 pt-10 text-center md:pb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c8a300]">
              Our Blog
            </p>
            <h1 className="mt-3 font-[family:var(--font-fraunces)] text-[2.5rem] leading-[0.98] font-semibold tracking-[-0.05em] text-[var(--editorial-ink)] md:text-[3.35rem]">
              Stories &amp; Ideas
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--editorial-muted)]">
              Clear installation stories, lighting ideas, and practical notes shaped around the
              Oduzz brand palette and our generated image library.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_280px]">
            {featuredPost ? (
              <article>
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <div className="relative aspect-[1.45] overflow-hidden bg-[#e9edf4]">
                    <Image
                      src={featuredVisual?.src ?? "/blog/chandelier-installation.jpg"}
                      alt={featuredVisual?.alt ?? featuredPost.title}
                      fill
                      priority
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 620px"
                    />
                  </div>
                  <div className="pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a300]">
                      {featuredPost.category}
                    </p>
                    <h2 className="mt-2 max-w-xl font-[family:var(--font-fraunces)] text-[2rem] leading-[1.02] font-semibold tracking-[-0.045em] text-[var(--editorial-ink)] md:text-[2.35rem]">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--editorial-muted)]">
                      {featuredPost.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ) : null}

            <aside>
              <div className="border-t border-[color:var(--editorial-border)] pt-4 lg:border-t-0 lg:pt-0">
                <h2 className="font-[family:var(--font-fraunces)] text-[1.8rem] leading-none font-semibold tracking-[-0.04em] text-[var(--editorial-ink)]">
                  Top Stories
                </h2>
                <div className="mt-4 space-y-4">
                  {topStories.map((story, index) => (
                    <Link
                      key={story.id}
                      href={story.href}
                      className="group grid grid-cols-[26px_minmax(0,1fr)_72px] items-start gap-3 border-b border-[color:var(--editorial-border)] pb-4 last:border-b-0 last:pb-0"
                    >
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--editorial-border)] text-[10px] font-semibold text-[var(--editorial-muted)]">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm leading-5 font-medium text-[var(--editorial-ink)] transition duration-200 group-hover:text-[#8f7300]">
                          {story.title}
                        </h3>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--editorial-muted)]">
                          {story.meta}
                        </p>
                      </div>
                      <div className="relative aspect-[1.1] overflow-hidden bg-[#e9edf4]">
                        <Image
                          src={story.image.src}
                          alt={story.image.alt}
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-10 grid gap-8 border-t border-[color:var(--editorial-border)] pt-8 md:grid-cols-2">
            {lowerStories.map((story) => (
              <article key={story.id}>
                <Link href={story.href} className="group block">
                  <div className="relative aspect-[1.7] overflow-hidden bg-[#e9edf4]">
                    <Image
                      src={story.image.src}
                      alt={story.image.alt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 420px"
                    />
                  </div>
                  <div className="pt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--editorial-muted)]">
                      {story.meta}
                    </p>
                    <h3 className="mt-2 font-[family:var(--font-fraunces)] text-[1.45rem] leading-[1.08] font-semibold tracking-[-0.04em] text-[var(--editorial-ink)] transition duration-200 group-hover:text-[#8f7300]">
                      {story.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[var(--editorial-muted)]">
                      {story.excerpt}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8a300]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 border-t border-[color:var(--editorial-border)] pt-6">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => {
                const isActive = category === activeCategory;
                const href =
                  category === ALL_BLOG_CATEGORY
                    ? "/blog"
                    : `/blog?category=${encodeURIComponent(category)}`;

                return (
                  <Link
                    key={category}
                    href={href}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                      isActive
                        ? "bg-[var(--editorial-ink)] text-white"
                        : "bg-[rgba(11,16,32,0.04)] text-[var(--editorial-muted)] hover:text-[var(--editorial-ink)]"
                    }`}
                  >
                    {category}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-[1060px]">
          <BlogNewsletterCta />
        </div>
      </Container>
    </div>
  );
}
