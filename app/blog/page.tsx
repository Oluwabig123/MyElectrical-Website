import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BlogNewsletterCta from "@/components/blog/BlogNewsletterCta";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { servicePages } from "@/data/service-pages";
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
import styles from "./BlogPage.module.css";

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
  title: "Electrical Blog & Guides for Lagos Projects",
  description:
    "Read practical electrical engineering guides from Oduzz on wiring safety, lighting layout, solar and inverter sizing, and quality material standards for Lagos projects.",
  path: "/blog",
  keywords: [
    "electrical blog Lagos",
    "wiring safety checklist",
    "solar inverter planning guide",
    "lighting installation tips",
    "electrical materials quality guide",
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
        title: `${category} Standards & Installation Insights`,
        excerpt: image.alt,
        category,
        image: {
          src: image.src,
          alt: image.alt,
        },
        meta: "Field Guide",
      };
    });
}

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedCategory = Array.isArray(resolvedParams?.category)
    ? resolvedParams.category[0]
    : resolvedParams?.category;

  const allPosts = await getAllBlogPosts();
  const categories = getBlogCategories(allPosts);
  const activeCategory = resolveBlogCategory(requestedCategory || "", categories);
  const filteredPosts = filterBlogPostsByCategory(allPosts, activeCategory);

  const featuredPost = filteredPosts[0] ?? allPosts[0];
  const archivePosts = filteredPosts.slice(1);
  const featuredVisual = featuredPost ? resolveBlogVisual(featuredPost) : null;

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

  const serviceTopicLinks = servicePages.slice(0, 6).map((service) => ({
    href: `/services/${service.slug}`,
    label: service.shortTitle,
  }));

  return (
    <section className={styles.blogPage}>
      <Container>
        <div className={styles.pageShell}>
          {/* Hero Header */}
          <Reveal delay={0.02}>
            <header className={styles.hero}>
              <div className={styles.heroBadges}>
                <span className={styles.heroBrand}>Oduzz Electrical Journal • Field Stories &amp; Guides</span>
                <span className={styles.heroStatusDot}>
                  <span className={styles.pingDot} /> Practical Engineering Insights
                </span>
              </div>

              <h1 className={styles.heroTitle}>Engineering Stories, Guides &amp; Insights</h1>

              <p className={styles.heroDesc}>
                Real installation notes, architectural lighting tips, solar sizing calculations, and material verification
                guides for residential and commercial building projects across Lagos.
              </p>
            </header>
          </Reveal>

          {/* Category Filter Pills */}
          <nav aria-label="Filter blog by topic" className={styles.filterBar}>
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
                  className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {category}
                </Link>
              );
            })}
          </nav>

          {/* Featured Split Section */}
          <div className={styles.featuredSplit}>
            {/* Featured Article Card */}
            {featuredPost ? (
              <Reveal delay={0.04}>
                <article>
                  <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredCard}>
                    <div className={styles.featuredMedia}>
                      <Image
                        src={featuredVisual?.src ?? "/blog/chandelier-installation.jpg"}
                        alt={featuredVisual?.alt ?? featuredPost.title}
                        fill
                        priority
                        className={styles.featuredImage}
                        sizes="(max-width: 980px) 100vw, 620px"
                      />
                    </div>

                    <div className={styles.featuredContent}>
                      <div className={styles.metaRow}>
                        <span>{featuredPost.category}</span>
                        <span className={styles.dot} />
                        <span className={styles.metaMuted}>{formatBlogDate(featuredPost.publishedAt)}</span>
                        <span className={styles.dot} />
                        <span className={styles.metaMuted}>{featuredPost.readingTime}</span>
                      </div>

                      <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                      <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>

                      <span className={styles.actionLink}>
                        Read full guide →
                      </span>
                    </div>
                  </Link>
                </article>
              </Reveal>
            ) : null}

            {/* Trending / Top Stories Sidebar */}
            <Reveal delay={0.06}>
              <aside className={styles.topStoriesCard}>
                <div>
                  <div className={styles.topStoriesHeader}>
                    <h3 className={styles.topStoriesTitle}>Top Stories</h3>
                    <span className={styles.topStoriesBadge}>Curated by Engineers</span>
                  </div>

                  <div className={styles.topStoriesList} style={{ marginTop: "18px" }}>
                    {topStories.map((story, index) => (
                      <Link key={story.id} href={story.href} className={styles.topStoryItem}>
                        <span className={styles.topStoryIndex}>0{index + 1}</span>

                        <div className={styles.topStoryContent}>
                          <h4 className={styles.topStoryItemTitle}>{story.title}</h4>
                          <span className={styles.topStoryMeta}>{story.meta}</span>
                        </div>

                        <div className={styles.topStoryThumb}>
                          <Image
                            src={story.image.src}
                            alt={story.image.alt}
                            fill
                            className="object-cover"
                            sizes="76px"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <Link
                  href="/assistant"
                  className={styles.actionLink}
                  style={{ paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  Ask AI Engineering Assistant →
                </Link>
              </aside>
            </Reveal>
          </div>

          {/* Lower Stories Grid */}
          {lowerStories.length > 0 ? (
            <section>
              <div className={styles.articlesGrid}>
                {lowerStories.map((story, idx) => (
                  <Reveal key={story.id} delay={0.04 + idx * 0.03}>
                    <article>
                      <Link href={story.href} className={styles.articleCard}>
                        <div className={styles.articleMedia}>
                          <Image
                            src={story.image.src}
                            alt={story.image.alt}
                            fill
                            className={styles.articleImage}
                            sizes="(max-width: 768px) 100vw, 480px"
                          />
                        </div>

                        <div className={styles.articleContent}>
                          <div className={styles.metaRow}>
                            <span>{story.category}</span>
                            <span className={styles.dot} />
                            <span className={styles.metaMuted}>{story.meta}</span>
                          </div>

                          <h3 className={styles.articleTitle}>{story.title}</h3>
                          <p className={styles.articleExcerpt}>{story.excerpt}</p>

                          <div className={styles.tagRow}>
                            {story.tags.map((tag) => (
                              <span key={tag} className={styles.tagPill}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          ) : null}

          {/* Service Topics Strip */}
          <div className={styles.serviceTopicsWrapper}>
            <span className={styles.serviceTopicsTitle}>Explore Engineering Services</span>
            <div className={styles.serviceTopicsList}>
              {serviceTopicLinks.map((item) => (
                <Link key={item.href} href={item.href} className={styles.serviceTopicPill}>
                  {item.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter Dispatch CTA */}
          <Reveal delay={0.08}>
            <BlogNewsletterCta />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
