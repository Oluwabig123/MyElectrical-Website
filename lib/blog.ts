import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { supabase } from "@/lib/supabase-client";
import {
  formatBlogDate,
  slugifyHeading,
  type BlogHeading,
  type BlogPost,
  type BlogPostListItem,
  type BlogPostFrontmatter,
} from "@/lib/blog-shared";

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const BLOG_POSTS_TABLE = "blog_posts";

function sanitizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizeTags(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((tag) => sanitizeText(tag)).filter(Boolean);
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

function deriveExcerpt(content: string) {
  const firstParagraph = content
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((block) => block.replace(/\s+/g, " ").trim())
    .find(Boolean);

  return firstParagraph?.slice(0, 180) ?? "Read the full article for practical electrical guidance.";
}

export function extractMarkdownHeadings(content: string) {
  return content
    .split("\n")
    .map((line) => line.match(/^(#{2,3})\s+(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const title = match[2].trim();
      return {
        id: slugifyHeading(title),
        title,
        level: match[1].length,
      } satisfies BlogHeading;
    });
}

function normalizeFrontmatter(data: Record<string, unknown>, content: string): BlogPostFrontmatter {
  return {
    title: sanitizeText(data.title, "Untitled article"),
    excerpt: sanitizeText(data.excerpt, deriveExcerpt(content)),
    publishedAt: sanitizeText(data.publishedAt, "2026-01-01"),
    author: sanitizeText(data.author, "Oduzz Editorial"),
    category: sanitizeText(data.category, "Electrical Tips"),
    coverImage: sanitizeText(data.coverImage, "/blog/panel-testing.webp"),
    tags: sanitizeTags(data.tags),
    featured: Boolean(data.featured),
  };
}

async function getMarkdownFiles() {
  const entries = await readdir(BLOG_CONTENT_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

async function getMarkdownBlogSlugs() {
  const files = await getMarkdownFiles();
  return files.map((file) => file.replace(/\.md$/, ""));
}

export async function getAllBlogSlugs() {
  const markdownSlugs = await getMarkdownBlogSlugs();
  const databasePosts = await getPublishedDatabasePosts();
  const mergedSlugs = new Set<string>([
    ...markdownSlugs,
    ...databasePosts.map((post) => post.slug),
  ]);
  return Array.from(mergedSlugs);
}

async function getMarkdownBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(BLOG_CONTENT_DIR, `${slug}.md`);
    const source = await readFile(filePath, "utf8");
    const { data, content } = matter(source);
    const frontmatter = normalizeFrontmatter(data as Record<string, unknown>, content);

    return {
      slug,
      content,
      readingTime: estimateReadingTime(content),
      source: "markdown",
      ...frontmatter,
    };
  } catch {
    return null;
  }
}

type BlogPostRow = {
  slug: string | null;
  featured: boolean | null;
  category: string | null;
  title: string | null;
  summary: string | null;
  seo_description: string | null;
  reading_time: string | null;
  audience: string | null;
  format: string | null;
  published_at: string | null;
  published_label: string | null;
  image_url: string | null;
  image_alt: string | null;
  points: string[] | null;
  sections: Array<{ heading?: string; body?: string[] }> | null;
  source: string | null;
  status: string | null;
};

function normalizePoints(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 6)
    : [];
}

function normalizeSections(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((section) => ({
          heading: sanitizeText(section?.heading),
          body: Array.isArray(section?.body)
            ? section.body
                .map((paragraph: unknown) => sanitizeText(paragraph))
                .filter(Boolean)
                .slice(0, 4)
            : [],
        }))
        .filter((section) => section.heading && section.body.length)
        .slice(0, 6)
    : [];
}

function buildContentFromStructuredPost({
  summary,
  points,
  sections,
}: {
  summary: string;
  points: string[];
  sections: Array<{ heading: string; body: string[] }>;
}) {
  const blocks: string[] = [];

  if (summary) blocks.push(summary);
  if (points.length) {
    blocks.push(points.map((point) => `- ${point}`).join("\n"));
  }

  sections.forEach((section) => {
    blocks.push(`## ${section.heading}`);
    blocks.push(section.body.join("\n\n"));
  });

  return blocks.filter(Boolean).join("\n\n");
}

function normalizeDatabaseBlogPost(row: BlogPostRow): BlogPost | null {
  const slug = sanitizeText(row.slug);
  const title = sanitizeText(row.title);
  const summary = sanitizeText(row.summary);
  const sections = normalizeSections(row.sections);
  const points = normalizePoints(row.points);

  if (!slug || !title || !summary || sections.length === 0) return null;

  const content = buildContentFromStructuredPost({
    summary,
    points,
    sections,
  });

  return {
    slug,
    title,
    excerpt: summary,
    publishedAt: sanitizeText(row.published_at, "2026-01-01"),
    author: "Oduzz Editorial",
    category: sanitizeText(row.category, "Electrical Tips"),
    coverImage: sanitizeText(row.image_url, "/blog/panel-testing.webp"),
    tags: [
      sanitizeText(row.category),
      sanitizeText(row.audience),
      sanitizeText(row.format),
    ].filter(Boolean),
    featured: Boolean(row.featured),
    readingTime: sanitizeText(row.reading_time) || estimateReadingTime(content),
    content,
    source: sanitizeText(row.source, "ai"),
  };
}

async function getPublishedDatabasePosts() {
  if (!supabase) return [] as BlogPost[];

  const { data, error } = await supabase
    .from(BLOG_POSTS_TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [] as BlogPost[];

  return ((data ?? []) as BlogPostRow[])
    .map(normalizeDatabaseBlogPost)
    .filter((post): post is BlogPost => Boolean(post));
}

function mergeBlogPosts(primaryPosts: BlogPost[], fallbackPosts: BlogPost[]) {
  const merged = new Map<string, BlogPost>();

  [...primaryPosts, ...fallbackPosts].forEach((post) => {
    if (!post.slug || merged.has(post.slug)) return;
    merged.set(post.slug, post);
  });

  return Array.from(merged.values()).sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getAllBlogPosts() {
  const slugs = await getMarkdownBlogSlugs();
  const markdownPosts = await Promise.all(slugs.map((slug) => getMarkdownBlogPostBySlug(slug)));
  const databasePosts = await getPublishedDatabasePosts();

  return mergeBlogPosts(
    databasePosts,
    markdownPosts.filter((post): post is BlogPost => Boolean(post)),
  );
}

export { formatBlogDate };
export type { BlogHeading, BlogPost, BlogPostFrontmatter, BlogPostListItem };
