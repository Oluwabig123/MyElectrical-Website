const blogModules = import.meta.glob("../content/blog/*.json", {
  eager: true,
  import: "default",
});

export function sortByOrder(a, b) {
  return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
}

export const staticBlogPosts = Object.values(blogModules).sort(sortByOrder);
export const blogPosts = staticBlogPosts;

export function buildBlogCategories(posts = blogPosts) {
  return [
    "All",
    ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean))),
  ];
}

export const blogCategories = buildBlogCategories(blogPosts);

export function getBlogPostBySlug(slug, posts = blogPosts) {
  return posts.find((post) => post.slug === slug) || null;
}

export function getRelatedBlogPosts(post, limit = 3, posts = blogPosts) {
  if (!post) return [];

  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((left, right) => {
      const leftScore = left.category === post.category ? 1 : 0;
      const rightScore = right.category === post.category ? 1 : 0;

      if (leftScore !== rightScore) return rightScore - leftScore;
      return sortByOrder(left, right);
    })
    .slice(0, limit);
}
