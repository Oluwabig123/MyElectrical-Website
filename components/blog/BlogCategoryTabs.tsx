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
      className="flex flex-wrap items-center gap-2 border-y border-white/10 py-4"
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
            className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition duration-200 ${
              isActive
                ? "border-[#ffd400] bg-[rgba(255,212,0,0.15)] text-[#ffd400] shadow-[0_0_12px_rgba(255,212,0,0.22)]"
                : "border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white"
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
