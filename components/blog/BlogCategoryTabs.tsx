import Link from "next/link";
import { ALL_BLOG_CATEGORY } from "@/lib/blog-editorial";

type BlogCategoryTabsProps = {
  categories: string[];
  activeCategory: string;
};

export default function BlogCategoryTabs({
  categories,
  activeCategory,
}: BlogCategoryTabsProps) {
  return (
    <nav
      aria-label="Blog categories"
      className="flex flex-wrap items-center gap-2 border-y border-[color:var(--editorial-border)] py-5"
    >
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
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition duration-200 ${
              isActive
                ? "border-[#161512] bg-[#161512] text-[#f6f1e9]"
                : "border-[color:var(--editorial-border)] bg-[rgba(255,255,255,0.5)] text-[#5f594f] hover:border-[#b9aa91] hover:text-[#161512]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {category}
          </Link>
        );
      })}
    </nav>
  );
}
