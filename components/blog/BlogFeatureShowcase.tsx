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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
      <article className="overflow-hidden rounded-[34px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.74)] shadow-[0_18px_44px_rgba(17,17,17,0.05)]">
        <Link href={`/blog/${featuredPost.slug}`} className="group block">
          <div className="relative aspect-[16/11] overflow-hidden border-b border-[color:var(--editorial-border)] bg-[#e8dfd1]">
            <Image
              src={visual.src}
              alt={visual.alt}
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 58vw"
            />
          </div>

          <div className="space-y-6 p-6 md:p-8 xl:p-10">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d6558]">
              <span className="rounded-full bg-[#efe4d2] px-3 py-1 text-[#7a5c2e]">Featured</span>
              <span>{featuredPost.category}</span>
              <span className="h-1 w-1 rounded-full bg-[#b9aa91]" aria-hidden="true" />
              <span>{formatBlogDate(featuredPost.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[#b9aa91]" aria-hidden="true" />
              <span>{featuredPost.readingTime}</span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h2 className="font-[family:var(--font-fraunces)] text-4xl leading-[0.98] font-semibold tracking-[-0.05em] text-[#181614] transition duration-200 group-hover:text-[#7a5c2e] md:text-[3.35rem]">
                {featuredPost.title}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-[#5c564c] md:text-lg">
                {featuredPost.excerpt}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#7a5c2e]">
              Read article
              <span aria-hidden="true">↗</span>
            </div>
          </div>
        </Link>
      </article>

      <aside className="rounded-[30px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.62)] p-5 shadow-[0_18px_44px_rgba(17,17,17,0.03)] md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-[color:var(--editorial-border)] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
              Latest dispatches
            </p>
            <h3 className="mt-2 font-[family:var(--font-fraunces)] text-[1.8rem] leading-none font-semibold tracking-[-0.04em] text-[#161512]">
              On the side
            </h3>
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-[#8f877b]">
            {sidePosts.length} stories
          </span>
        </div>

        {sidePosts.length > 0 ? (
          <div className="space-y-5">
            {sidePosts.map((post) => (
              <BlogCard key={post.slug} post={post} variant="compact" />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-[#5c564c]">
            Additional stories will appear here automatically as the editorial archive grows.
          </p>
        )}
      </aside>
    </div>
  );
}
