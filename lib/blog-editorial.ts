import { BLOG_IMAGE_GALLERY, pickBlogImage } from "@/data/blog-image-gallery";
import { type BlogPost, type BlogPostListItem } from "@/lib/blog-shared";

export const ALL_BLOG_CATEGORY = "All";

type BlogVisual = (typeof BLOG_IMAGE_GALLERY)[number];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function stripMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .trim();
}

function buildOverlapScore(current: BlogPostListItem, candidate: BlogPostListItem) {
  let score = 0;

  if (current.category === candidate.category) score += 6;

  const currentTags = new Set(current.tags.map(normalizeText));
  candidate.tags.forEach((tag) => {
    if (currentTags.has(normalizeText(tag))) score += 2;
  });

  const currentWords = new Set(
    `${current.title} ${current.excerpt}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );

  candidate.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
    .forEach((word) => {
      if (currentWords.has(word)) score += 1;
    });

  return score;
}

export function getBlogCategories(posts: BlogPostListItem[]) {
  const categories = Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right),
  );

  return [ALL_BLOG_CATEGORY, ...categories];
}

export function resolveBlogCategory(
  requestedCategory: string,
  categories: string[],
) {
  return categories.includes(requestedCategory) ? requestedCategory : ALL_BLOG_CATEGORY;
}

export function filterBlogPostsByCategory(
  posts: BlogPost[],
  activeCategory: string,
) {
  if (activeCategory === ALL_BLOG_CATEGORY) return posts;
  return posts.filter((post) => post.category === activeCategory);
}

export function resolveBlogVisual(post: BlogPostListItem): BlogVisual {
  const explicitMatch = BLOG_IMAGE_GALLERY.find((image) => image.src === post.coverImage);
  if (explicitMatch) return explicitMatch;

  return pickBlogImage({
    blueprint: { category: post.category },
    requestedTopic: post.title,
    generatedPost: {
      title: post.title,
      summary: post.excerpt,
      points: post.tags,
    },
  });
}

export function getRelatedBlogPosts(
  posts: BlogPost[],
  currentPost: BlogPost,
  limit = 3,
) {
  return posts
    .filter((post) => post.slug !== currentPost.slug)
    .sort((left, right) => {
      const scoreDiff = buildOverlapScore(currentPost, right) - buildOverlapScore(currentPost, left);
      if (scoreDiff !== 0) return scoreDiff;
      return right.publishedAt.localeCompare(left.publishedAt);
    })
    .slice(0, limit);
}

export function extractArticleLead(content: string, fallback: string) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const paragraph = blocks.find((block) => {
    return !/^#/.test(block) && !/^[-*]\s+/.test(block) && !/^\d+\.\s+/.test(block);
  });

  return stripMarkdown(paragraph ?? fallback);
}

export function extractArticleTip(content: string, fallback: string) {
  const blockquote = content.match(/^>\s+(.+)$/m)?.[1];
  if (blockquote) return stripMarkdown(blockquote);

  const bullet = content.match(/^[-*]\s+(.+)$/m)?.[1];
  if (bullet) return stripMarkdown(bullet);

  return stripMarkdown(fallback);
}
