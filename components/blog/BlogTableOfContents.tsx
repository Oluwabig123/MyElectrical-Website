import { type BlogHeading } from "@/lib/blog-shared";

type BlogTableOfContentsProps = {
  headings: BlogHeading[];
};

export default function BlogTableOfContents({
  headings,
}: BlogTableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffd400]">
        Table of Contents
      </p>
      <div className="mt-4 space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block rounded-xl px-3 py-2 text-xs font-semibold text-white/70 transition duration-200 hover:bg-white/10 hover:text-[#ffd400] ${
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
