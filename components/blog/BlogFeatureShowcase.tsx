import Image from "next/image";
import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import { formatBlogDate, type BlogPostListItem } from "@/lib/blog-shared";
import { resolveBlogVisual } from "@/lib/blog-editorial";

type BlogFeatureShowcaseProps = {
  featuredPost: BlogPostListItem;
  sidePosts: BlogPostListItem[];
};

export default function BlogFeatureShowcase({
  featuredPost,
  sidePosts,
}: BlogFeatureShowcaseProps) {
  const visual = resolveBlogVisual(featuredPost);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
      <article className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition duration-300 hover:border-[#ffd400]/40">
        <Link href={`/blog/${featuredPost.slug}`} className="group block">
          <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#0d1624]">
            <Image
              src={visual.src}
              alt={visual.alt}
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 58vw"
            />
          </div>

          <div className="space-y-4 p-6 md:p-8 xl:p-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd400]">
              <span className="rounded-full bg-[#ffd400]/15 border border-[#ffd400]/30 px-3 py-1 text-[#ffd400]">Featured</span>
              <span>{featuredPost.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
              <span className="text-white/60">{formatBlogDate(featuredPost.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
              <span className="text-white/60">{featuredPost.readingTime}</span>
            </div>

            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.03em] text-white transition duration-200 group-hover:text-[#ffd400] md:text-3xl lg:text-4xl">
                {featuredPost.title}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                {featuredPost.excerpt}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffd400]">
              Read article
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </Link>
      </article>

      <aside className="flex flex-col justify-between rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#ffd400]">
              Trending Insights
            </h3>
            <span className="text-xs text-white/50">Curated by Engineers</span>
          </div>

          <div className="mt-5 space-y-4">
            {sidePosts.map((post) => (
              <BlogCard key={post.slug} post={post} variant="compact" />
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:text-[#ffd400]"
          >
            Explore all guides
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
