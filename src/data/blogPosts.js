const blogModules = import.meta.glob("../content/blog/*.json", {
  eager: true,
  import: "default",
});

function sortByOrder(a, b) {
  return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
}

export const blogPosts = Object.values(blogModules).sort(sortByOrder);

export const blogCategories = [
  "All",
  ...Array.from(new Set(blogPosts.map((post) => post.category).filter(Boolean))),
];

export function getBlogPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug) || null;
}

export function getRelatedBlogPosts(post, limit = 3) {
  if (!post) return [];

  return blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((left, right) => {
      const leftScore = left.category === post.category ? 1 : 0;
      const rightScore = right.category === post.category ? 1 : 0;

      if (leftScore !== rightScore) return rightScore - leftScore;
      return sortByOrder(left, right);
    })
    .slice(0, limit);
}
