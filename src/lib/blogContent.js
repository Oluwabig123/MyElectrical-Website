import {
  buildBlogCategories,
  getBlogPostBySlug as getStaticBlogPostBySlug,
  getRelatedBlogPosts as getStaticRelatedBlogPosts,
  sortByOrder,
  staticBlogPosts,
} from "../data/blogPosts.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

export const BLOG_POSTS_TABLE = "blog_posts";

function parseMonthYearLabel(value) {
  const text = String(value || "").trim();
  const timestamp = Date.parse(`1 ${text}`);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatPublishedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function normalizePoints(points) {
  return Array.isArray(points)
    ? points.map((point) => String(point || "").trim()).filter(Boolean)
    : [];
}

function normalizeSections(sections) {
  return Array.isArray(sections)
    ? sections
        .map((section) => ({
          heading: String(section?.heading || "").trim(),
          body: Array.isArray(section?.body)
            ? section.body.map((paragraph) => String(paragraph || "").trim()).filter(Boolean)
            : [],
        }))
        .filter((section) => section.heading && section.body.length)
    : [];
}

export function normalizeDatabaseBlogPost(row) {
  if (!row) return null;

  return {
    slug: String(row.slug || "").trim(),
    order: Number.MIN_SAFE_INTEGER,
    featured: Boolean(row.featured),
    category: String(row.category || "").trim() || "General",
    title: String(row.title || "").trim(),
    summary: String(row.summary || "").trim(),
    seoDescription: String(row.seo_description || row.summary || "").trim(),
    readingTime: String(row.reading_time || "").trim() || "4 min read",
    audience: String(row.audience || "").trim() || "Homeowners",
    format: String(row.format || "").trim() || "Guide",
    publishedLabel:
      String(row.published_label || "").trim() || formatPublishedLabel(row.published_at) || "Recently published",
    publishedAt: row.published_at || "",
    image: String(row.image_url || "").trim() || "/blog/safety-panel-check.webp",
    imageAlt: String(row.image_alt || "").trim() || "Electrical project planning image",
    points: normalizePoints(row.points),
    sections: normalizeSections(row.sections),
    source: String(row.source || "ai").trim(),
  };
}

function comparePosts(left, right) {
  const leftPublished = left?.publishedAt ? Date.parse(left.publishedAt) : parseMonthYearLabel(left?.publishedLabel);
  const rightPublished = right?.publishedAt
    ? Date.parse(right.publishedAt)
    : parseMonthYearLabel(right?.publishedLabel);

  if (Number.isFinite(leftPublished) && Number.isFinite(rightPublished) && leftPublished !== rightPublished) {
    return rightPublished - leftPublished;
  }

  if (left?.featured !== right?.featured) return Number(right.featured) - Number(left.featured);
  return sortByOrder(left, right);
}

export function mergeBlogPosts(dynamicPosts = [], fallbackPosts = staticBlogPosts) {
  const merged = new Map();

  [...dynamicPosts, ...fallbackPosts].forEach((post) => {
    if (!post?.slug || merged.has(post.slug)) return;
    merged.set(post.slug, post);
  });

  return Array.from(merged.values()).sort(comparePosts);
}

export async function fetchPublishedBlogPosts() {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from(BLOG_POSTS_TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeDatabaseBlogPost).filter(Boolean);
}

export function getAllBlogCategories(posts) {
  return buildBlogCategories(posts);
}

export function getBlogPostBySlug(slug, posts) {
  return (posts || []).find((post) => post.slug === slug) || getStaticBlogPostBySlug(slug);
}

export function getRelatedBlogPosts(post, limit = 3, posts = staticBlogPosts) {
  if (!post) return [];
  if (!Array.isArray(posts) || posts.length === 0) return getStaticRelatedBlogPosts(post, limit);

  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((left, right) => {
      const leftScore = left.category === post.category ? 1 : 0;
      const rightScore = right.category === post.category ? 1 : 0;

      if (leftScore !== rightScore) return rightScore - leftScore;
      return comparePosts(left, right);
    })
    .slice(0, limit);
}

export function getFeaturedBlogPost(posts) {
  return (posts || []).find((post) => post.featured) || posts?.[0] || staticBlogPosts[0] || null;
}

export { staticBlogPosts };
