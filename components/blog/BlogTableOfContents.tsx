import { type BlogHeading } from "@/lib/blog-shared";

type BlogTableOfContentsProps = {
  headings: BlogHeading[];
};

export default function BlogTableOfContents({
  headings,
}: BlogTableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.58)] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a5c2e]">
        Table of contents
      </p>
      <div className="mt-4 space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block rounded-2xl px-3 py-2 text-sm text-[#4f493f] transition duration-200 hover:bg-[#f1e8da] hover:text-[#161512] ${
              heading.level === 3 ? "ml-4" : ""
            }`}
          >
            {heading.title}
          </a>
        ))}
      </div>
    </div>
  );
}
