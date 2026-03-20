import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SEO from "../components/ui/SEO";
import Reveal from "../components/ui/Reveal";
import SmartImage from "../components/ui/SmartImage";
import {
  fetchPublishedBlogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
  mergeBlogPosts,
  staticBlogPosts,
} from "../lib/blogContent.js";

export default function BlogArticle() {
  const { slug } = useParams();
  const [posts, setPosts] = useState(staticBlogPosts);
  const [isLoading, setIsLoading] = useState(() => !getBlogPostBySlug(slug, staticBlogPosts));

  useEffect(() => {
    let isActive = true;

    async function loadPublishedPosts() {
      try {
        const dynamicPosts = await fetchPublishedBlogPosts();
        if (!isActive) return;
        if (dynamicPosts.length > 0) {
          setPosts(mergeBlogPosts(dynamicPosts, staticBlogPosts));
        }
      } catch {
        // The page can still render the static article set.
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPublishedPosts();
    return () => {
      isActive = false;
    };
  }, [slug]);

  const post = useMemo(() => getBlogPostBySlug(slug, posts), [slug, posts]);

  if (!post && isLoading) {
    return (
      <section className="section blogPostPage">
        <Container>
          <article className="card blogPostMissing">
            <p className="blogSummary">Loading article</p>
            <h1 className="h2">Fetching published content...</h1>
            <p className="p">The blog article is being loaded.</p>
          </article>
        </Container>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="section blogPostPage">
        <Container>
          <article className="card blogPostMissing">
            <p className="blogSummary">Article not found</p>
            <h1 className="h2">This article does not exist</h1>
            <p className="p">The article may have been moved, removed, or the link may be incorrect.</p>
            <div className="projectsToolbarActions">
              <Link to="/blog"><Button variant="primary">Back to blog</Button></Link>
              <Link to="/quote"><Button variant="outline">Request quote</Button></Link>
            </div>
          </article>
        </Container>
      </section>
    );
  }

  const relatedPosts = getRelatedBlogPosts(post, 3, posts);

  return (
    <section className="section blogPostPage">
      <SEO title={`${post.title} - Oduzz Blog`} description={post.seoDescription || post.summary} />
      <Container>
        <Reveal>
          <article className="card blogPostHero">
            <div className="blogMetaRow">
              <span className="blogPill blogPillAccent">{post.category}</span>
              <span className="blogPill">{post.readingTime}</span>
              <span className="blogPill">{post.audience}</span>
              <span className="blogPill">{post.publishedLabel}</span>
            </div>
            <h1 className="h2 blogPostTitle">{post.title}</h1>
            <p className="blogLead">{post.summary}</p>

            <figure className="blogPostHeroMedia">
              <SmartImage
                src={post.image}
                alt={post.imageAlt}
                className="blogPostHeroImage"
                loading="eager"
                fetchPriority="high"
              />
            </figure>

            <div className="blogPostKeypoints">
              <div className="blogPanelTitle">Key points</div>
              <ul className="blogPointList">
                {post.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        </Reveal>

        <div className="blogPostLayout">
          <div className="blogPostContent">
            {post.sections.map((section, index) => (
              <Reveal key={section.heading} delay={index * 0.04}>
                <article className="card blogPostSection">
                  <h2 className="cardTitle blogPostSectionTitle">{section.heading}</h2>
                  <div className="blogPostParagraphs">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="blogPostParagraph">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <aside className="blogPostSidebar">
            <div className="card blogPostSidebarCard">
              <div className="blogPanelTitle">Need help with this topic?</div>
              <p className="blogSummary">
                Use the assistant for a quick explanation or request a quote if you want help on a real project.
              </p>
              <div className="blogPostSidebarActions">
                <Link to="/assistant"><Button variant="outline">Ask assistant</Button></Link>
                <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
              </div>
            </div>

            {relatedPosts.length ? (
              <div className="card blogPostSidebarCard">
                <div className="blogPanelTitle">Related articles</div>
                <div className="blogRelatedList">
                  {relatedPosts.map((related) => (
                    <Link key={related.slug} className="blogRelatedLink" to={`/blog/${related.slug}`}>
                      <span className="blogRelatedMeta">{related.category}</span>
                      <strong>{related.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <Reveal delay={0.12}>
          <div className="blogFoot">
            <p className="blogSummary">
              Want more educational content like this? The blog listing is now driven by content files, so new articles
              can be added without changing the page layout code.
            </p>
            <div className="projectsToolbarActions">
              <Link to="/blog"><Button variant="outline">Back to blog</Button></Link>
              <Link to="/academy"><Button variant="outline">Visit academy</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
