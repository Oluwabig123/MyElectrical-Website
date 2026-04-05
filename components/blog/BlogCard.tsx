import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, type BlogPostListItem } from "@/lib/blog-shared";
import { resolveBlogVisual } from "@/lib/blog-editorial";

type BlogCardProps = {
  post: BlogPostListItem;
  variant?: "grid" | "compact";
  priority?: boolean;
};

export default function BlogCard({
  post,
  variant = "grid",
  priority = false,
}: BlogCardProps) {
  const visual = resolveBlogVisual(post);
  const isCompact = variant === "compact";

  return (
    <article className={isCompact ? "border-b border-[color:var(--editorial-border)] pb-5 last:border-b-0 last:pb-0" : ""}>
      <Link
        href={`/blog/${post.slug}`}
        className={
          isCompact
            ? "group grid grid-cols-[112px_minmax(0,1fr)] gap-4"
            : "group flex h-full flex-col overflow-hidden rounded-[26px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.72)] shadow-[0_12px_32px_rgba(17,17,17,0.04)]"
        }
      >
        <div
          className={
            isCompact
              ? "relative aspect-[6/5] overflow-hidden rounded-[18px] border border-[color:var(--editorial-border)]"
              : "relative aspect-[16/10] overflow-hidden border-b border-[color:var(--editorial-border)] bg-[#e8dfd1]"
          }
        >
          <Image
            src={visual.src}
            alt={visual.alt}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            fill
            priority={priority}
            sizes={
              isCompact
                ? "(max-width: 768px) 34vw, 112px"
                : "(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
          />
        </div>

        <div className={isCompact ? "flex min-w-0 flex-col justify-between py-1" : "flex flex-1 flex-col gap-5 p-6 md:p-7"}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d6558]">
              <span>{post.category}</span>
              <span className="h-1 w-1 rounded-full bg-[#b9aa91]" aria-hidden="true" />
              <span>{post.readingTime}</span>
            </div>

            <h3
              className={
                isCompact
                  ? "text-lg font-semibold tracking-[-0.03em] text-[#181614] transition duration-200 group-hover:text-[#7a5c2e]"
                  : "font-[family:var(--font-fraunces)] text-[1.7rem] leading-[1.08] font-semibold tracking-[-0.04em] text-[#181614] transition duration-200 group-hover:text-[#7a5c2e] md:text-[1.95rem]"
              }
            >
              {post.title}
            </h3>

            {!isCompact ? (
              <p className="text-sm leading-7 text-[#5c564c] md:text-[15px]">{post.excerpt}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#5c564c]">
            <span>{formatBlogDate(post.publishedAt)}</span>
            {!isCompact ? (
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a5c2e]">
                Read article
                <span aria-hidden="true">↗</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
