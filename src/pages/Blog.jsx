import React, { startTransition, useDeferredValue, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SEO from "../components/ui/SEO";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import SmartImage from "../components/ui/SmartImage";
import { blogCategories, blogPosts } from "../data/blogPosts";

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const featuredPost = blogPosts.find((post) => post.featured) || blogPosts[0];
  const requestedCategory = searchParams.get("category") || "All";
  const activeCategory = blogCategories.includes(requestedCategory) ? requestedCategory : "All";
  const searchQuery = searchParams.get("q") || "";
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  function updateFilters(next) {
    const nextParams = new URLSearchParams(searchParams);

    if ("q" in next) {
      const q = String(next.q || "").trim();
      if (q) nextParams.set("q", q);
      else nextParams.delete("q");
    }

    if ("category" in next) {
      const category = next.category;
      if (category && category !== "All") nextParams.set("category", category);
      else nextParams.delete("category");
    }

    startTransition(() => {
      setSearchParams(nextParams, { replace: true });
    });
  }

  const visiblePosts = useMemo(() => {
    return blogPosts.filter((post) => {
      if (post.slug === featuredPost.slug) return false;
      if (activeCategory !== "All" && post.category !== activeCategory) return false;
      if (!normalizedQuery) return true;

      const searchParts = [
        post.title,
        post.summary,
        post.category,
        post.audience,
        post.format,
        ...(post.points || []),
        ...((post.sections || []).flatMap((section) => [section.heading, ...(section.body || [])])),
      ];

      return searchParts.join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, featuredPost.slug, normalizedQuery]);

  return (
    <section className="section blogPage">
      <SEO
        title="Blog - Oduzz Electrical Concept"
        description="Practical articles on wiring, solar, CCTV, lighting, and electrical planning for homes and businesses."
      />
      <Container>
        <SectionHeader
          kicker="Blog"
          title="Practical guides clients can actually use"
          subtitle="An article listing built around safety, decision-making, and better project preparation."
        />

        <Reveal>
          <article className="card blogFeatured">
            <div className="blogFeaturedHead">
              <div className="blogMetaRow">
                <span className="blogPill blogPillAccent">Featured article</span>
                <span className="blogPill">{featuredPost.category}</span>
                <span className="blogPill">{featuredPost.readingTime}</span>
                <span className="blogPill">{featuredPost.audience}</span>
              </div>
              <div className="blogFeaturedFormat">{featuredPost.format}</div>
            </div>

            <figure className="blogFeaturedMedia">
              <SmartImage
                src={featuredPost.image}
                alt={featuredPost.imageAlt}
                className="blogFeaturedImage"
                loading="eager"
                fetchPriority="high"
              />
            </figure>

            <div className="blogFeaturedBody">
              <div className="blogFeaturedCopy">
                <h3 className="cardTitle blogFeaturedTitle">{featuredPost.title}</h3>
                <p className="blogLead">{featuredPost.summary}</p>
              </div>

              <div className="blogFeaturedPanel">
                <div className="blogPanelTitle">Inside this guide</div>
                <ul className="blogPointList">
                  {featuredPost.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="blogFeaturedFoot">
              <p className="blogSummary">
                This featured piece sets the tone for the blog: practical, local, and useful before a client ever
                picks up the phone.
              </p>
              <div className="projectsToolbarActions">
                <Link to={`/blog/${featuredPost.slug}`}><Button variant="outline">Read article</Button></Link>
                <Link to="/assistant"><Button variant="outline">Ask assistant</Button></Link>
                <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
              </div>
            </div>
          </article>
        </Reveal>

        <div className="blogToolbar">
          <div className="blogToolbarMain">
            <p className="blogSummary">
              {visiblePosts.length} article{visiblePosts.length === 1 ? "" : "s"} shown
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
              {normalizedQuery ? ` for "${searchQuery.trim()}"` : ""}.
            </p>
            <div className="blogSearchField">
              <label className="blogSearchLabel" htmlFor="blog-search">Search articles</label>
              <input
                id="blog-search"
                type="search"
                value={searchQuery}
                onChange={(event) => updateFilters({ q: event.target.value })}
                placeholder="Search wiring, solar, CCTV..."
              />
            </div>
          </div>
          <div className="filters" aria-label="Filter blog posts by category">
            {blogCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip ${category === activeCategory ? "active" : ""}`}
                onClick={() => updateFilters({ category })}
                aria-pressed={category === activeCategory}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {visiblePosts.length === 0 ? (
          <article className="card blogEmptyState">
            <h3 className="cardTitle">No articles match your search yet</h3>
            <p className="p">
              Try another keyword or category. You can also ask the assistant directly if you need a quick answer.
            </p>
            <div className="projectsToolbarActions">
              <button
                type="button"
                className="btn outline"
                onClick={() => updateFilters({ q: "", category: "All" })}
              >
                Clear search
              </button>
              <Link to="/assistant"><Button variant="primary">Ask assistant</Button></Link>
            </div>
          </article>
        ) : (
          <div className="blogArticleGrid">
            {visiblePosts.map((post, index) => (
              <Reveal key={post.slug} delay={index * 0.04}>
                <article className="card blogArticleCard">
                  <figure className="blogArticleMedia">
                    <SmartImage src={post.image} alt={post.imageAlt} className="blogArticleImage" />
                  </figure>
                  <div className="blogArticleHead">
                    <div className="blogMetaRow">
                      <span className="blogPill">{post.category}</span>
                      <span className="blogPill">{post.readingTime}</span>
                    </div>
                    <span className="blogAudience">{post.audience}</span>
                  </div>

                  <h3 className="cardTitle blogArticleTitle">{post.title}</h3>
                  <p className="p">{post.summary}</p>

                  <ul className="blogPointList compact">
                    {post.points.slice(0, 3).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>

                  <div className="blogArticleFoot">
                    <span className="blogFeaturedFormat">{post.format}</span>
                    <div className="projectsToolbarActions">
                      <Link to={`/blog/${post.slug}`}><Button variant="primary">Read article</Button></Link>
                      <Link to="/assistant"><Button variant="outline">Discuss topic</Button></Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.12}>
          <div className="blogFoot">
            <p className="blogSummary">
              Next layer after this listing: individual article pages, search indexing, and a publishing workflow for
              regular educational content.
            </p>
            <div className="projectsToolbarActions">
              <Link to="/academy"><Button variant="outline">Visit academy</Button></Link>
              <Link to="/quote"><Button variant="primary">Start project</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
