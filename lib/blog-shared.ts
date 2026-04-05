export type BlogPostFrontmatter = {
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  category: string;
  coverImage: string;
  tags: string[];
  featured: boolean;
};

export type BlogPostListItem = BlogPostFrontmatter & {
  slug: string;
  readingTime: string;
  source?: string;
};

export type BlogPost = BlogPostListItem & {
  content: string;
};

export type BlogHeading = {
  id: string;
  title: string;
  level: number;
};

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatBlogDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
