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
    <article className={isCompact ? "border-b border-white/10 pb-5 last:border-b-0 last:pb-0" : ""}>
      <Link
        href={`/blog/${post.slug}`}
        className={
          isCompact
            ? "group grid grid-cols-[100px_minmax(0,1fr)] gap-4 items-center"
            : "group flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:border-[#ffd400]/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        }
      >
        <div
          className={
            isCompact
              ? "relative aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-[#0d1624]"
              : "relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#0d1624]"
          }
        >
          <Image
            src={visual.src}
            alt={visual.alt}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            fill
            priority={priority}
            sizes={
              isCompact
                ? "(max-width: 768px) 30vw, 100px"
                : "(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
          />
        </div>

        <div className={isCompact ? "flex min-w-0 flex-col justify-center gap-1.5" : "flex flex-1 flex-col justify-between p-6"}>
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd400]">
              <span>{post.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
              <span className="text-white/60">{post.readingTime}</span>
            </div>

            <h3
              className={
                isCompact
                  ? "text-base font-bold leading-snug tracking-[-0.01em] text-white transition duration-200 group-hover:text-[#ffd400]"
                  : "text-xl font-bold leading-tight tracking-[-0.02em] text-white transition duration-200 group-hover:text-[#ffd400] md:text-[22px]"
              }
            >
              {post.title}
            </h3>

            {!isCompact ? (
              <p className="text-sm leading-relaxed text-white/70 line-clamp-3">{post.excerpt}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/50 border-t border-white/5 pt-3">
            <span>{formatBlogDate(post.publishedAt)}</span>
            {!isCompact ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#ffd400]">
                Read article
                <span aria-hidden="true">→</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
