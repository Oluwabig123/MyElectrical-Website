import { createClient } from "@supabase/supabase-js";
import { pickBlogImage } from "../src/data/blogImageGallery.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.BLOG_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_MAX_OUTPUT_TOKENS = 1400;
const BLOG_POSTS_TABLE = "blog_posts";

const BLOG_BLUEPRINTS = [
  {
    category: "Safety",
    audience: "Homeowners",
    format: "Checklist",
    angle:
      "Write a practical homeowner article on preventing hidden electrical risks before they become expensive faults.",
  },
  {
    category: "Solar",
    audience: "Homeowners",
    format: "Planning guide",
    angle:
      "Write a decision-making article that helps buyers think clearly about solar, inverter, battery, and backup tradeoffs.",
  },
  {
    category: "Planning",
    audience: "Property managers",
    format: "Decision brief",
    angle:
      "Write an article that helps clients prepare better project information, reduce quote delays, and avoid scope confusion.",
  },
  {
    category: "Lighting",
    audience: "Homeowners",
    format: "Pre-install brief",
    angle:
      "Write a practical article about lighting layout, decorative fixtures, switching zones, and finishing quality.",
  },
  {
    category: "CCTV",
    audience: "Business owners",
    format: "Field guide",
    angle:
      "Write an article that helps small business owners think about camera coverage, storage, power, and reliability.",
  },
];

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function createSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .map((content) => content?.text || content?.output_text || "")
    .filter(Boolean);

  return chunks.join("\n").trim();
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toArrayOfStrings(value, maxItems = 6) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

function toSections(value) {
  return Array.isArray(value)
    ? value
        .map((section) => ({
          heading: String(section?.heading || "").trim(),
          body: toArrayOfStrings(section?.body, 4),
        }))
        .filter((section) => section.heading && section.body.length)
        .slice(0, 4)
    : [];
}

function estimateReadingTime(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(3, Math.round(words / 180));
  return `${minutes} min read`;
}

function formatPublishedLabel(date = new Date()) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function buildBlueprint(recentPosts = []) {
  const recentCategories = recentPosts.slice(0, 3).map((post) => post.category);
  const offset = recentPosts.length % BLOG_BLUEPRINTS.length;

  for (let index = 0; index < BLOG_BLUEPRINTS.length; index += 1) {
    const blueprint = BLOG_BLUEPRINTS[(offset + index) % BLOG_BLUEPRINTS.length];
    if (!recentCategories.includes(blueprint.category)) return blueprint;
  }

  return BLOG_BLUEPRINTS[offset];
}

function buildPrompt({ blueprint, recentPosts, requestedTopic }) {
  const recentContext = recentPosts.length
    ? recentPosts
        .slice(0, 6)
        .map((post) => `- ${post.title} [${post.category}]`)
        .join("\n")
    : "- No recent AI posts yet";

  return [
    "You are writing for Oduzz Electrical Concept, a practical Nigerian electrical services brand.",
    "Write a useful, specific, non-fluffy blog post for real clients.",
    "The content must sound like a credible field-informed electrical company, not generic AI marketing.",
    "",
    `Target category: ${blueprint.category}`,
    `Audience: ${blueprint.audience}`,
    `Format: ${blueprint.format}`,
    `Angle: ${requestedTopic ? `Use this topic direction: ${requestedTopic}` : blueprint.angle}`,
    "",
    "Avoid duplicating or lightly paraphrasing these recent AI-generated posts:",
    recentContext,
    "",
    "Output valid JSON only with this shape:",
    JSON.stringify(
      {
        title: "string",
        summary: "string",
        seoDescription: "string",
        audience: blueprint.audience,
        format: blueprint.format,
        points: ["string", "string", "string"],
        sections: [
          {
            heading: "string",
            body: ["string", "string"],
          },
        ],
      },
      null,
      2
    ),
    "",
    "Requirements:",
    "- title: 55 to 75 characters and specific",
    "- summary: 1 to 2 sentences",
    "- seoDescription: under 160 characters",
    "- points: exactly 3 practical bullet points",
    "- sections: 3 or 4 sections",
    "- each section body: 2 short paragraphs",
    "- no markdown",
    "- no made-up statistics",
    "- no pricing claims",
    "- no mention of AI or automation",
    "- keep the article locally relevant and operationally practical",
  ].join("\n");
}

function sanitizeGeneratedPost(payload, blueprint, imageChoice) {
  const sections = toSections(payload?.sections);
  const points = toArrayOfStrings(payload?.points, 3).slice(0, 3);
  const title = String(payload?.title || "").trim();
  const summary = String(payload?.summary || "").trim();
  const seoDescription = String(payload?.seoDescription || summary).trim();
  const bodyText = sections.flatMap((section) => [section.heading, ...section.body]).join(" ");

  if (!title || !summary || points.length < 3 || sections.length < 3) {
    return null;
  }

  return {
    slug: slugify(title),
    status: "published",
    featured: false,
    category: blueprint.category,
    title,
    summary,
    seo_description: seoDescription,
    reading_time: estimateReadingTime(`${summary} ${bodyText}`),
    audience: String(payload?.audience || blueprint.audience).trim() || blueprint.audience,
    format: String(payload?.format || blueprint.format).trim() || blueprint.format,
    published_label: formatPublishedLabel(),
    published_at: new Date().toISOString(),
    image_url: imageChoice?.src || "/blog/safety-panel-check.webp",
    image_alt: imageChoice?.alt || "Electrical project planning image",
    points,
    sections,
    source: "ai",
    metadata: {
      blueprint_category: blueprint.category,
      image_id: imageChoice?.id || "",
      generated_at: new Date().toISOString(),
    },
  };
}

function ensureUniqueSlug(baseSlug, existingSlugs) {
  const safeBase = baseSlug || `post-${Date.now()}`;
  if (!existingSlugs.includes(safeBase)) return safeBase;

  const suffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const candidate = `${safeBase}-${suffix}`.slice(0, 90);
  if (!existingSlugs.includes(candidate)) return candidate;

  return `${candidate}-${Math.random().toString(36).slice(2, 5)}`;
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const body = readRequestBody(req);
  const querySecret = req.query?.secret || body.secret || req.headers["x-cron-secret"];

  return bearerToken === secret || querySecret === secret;
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "OpenAI API key is missing." });
  }

  const supabaseAdmin = createSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase admin credentials are missing." });
  }

  const { data: recentRows, error: recentError } = await supabaseAdmin
    .from(BLOG_POSTS_TABLE)
    .select("slug, title, category, published_at, source, image_url")
    .order("published_at", { ascending: false })
    .limit(12);

  if (recentError) {
    return res.status(500).json({ error: "Could not read recent blog posts.", detail: recentError.message });
  }

  const recentPosts = recentRows || [];
  const existingSlugs = recentPosts.map((post) => post.slug).filter(Boolean);
  const body = readRequestBody(req);
  const blueprint = buildBlueprint(recentPosts);
  const prompt = buildPrompt({
    blueprint,
    recentPosts,
    requestedTopic: String(body.topic || "").trim(),
  });

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      max_output_tokens: readPositiveInt(
        process.env.BLOG_OPENAI_MAX_OUTPUT_TOKENS,
        DEFAULT_MAX_OUTPUT_TOKENS
      ),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(502).json({ error: "OpenAI blog generation failed.", detail });
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  const generated = parseJsonObject(outputText);
  const imageChoice = pickBlogImage({
    blueprint,
    generatedPost: generated,
    recentPosts,
    requestedTopic: String(body.topic || "").trim(),
  });
  const preparedPost = sanitizeGeneratedPost(generated, blueprint, imageChoice);

  if (!preparedPost) {
    return res.status(502).json({
      error: "Generated blog content was incomplete.",
      detail: outputText.slice(0, 500),
    });
  }

  preparedPost.slug = ensureUniqueSlug(preparedPost.slug, existingSlugs);

  const { data: insertedRows, error: insertError } = await supabaseAdmin
    .from(BLOG_POSTS_TABLE)
    .insert([preparedPost])
    .select("id, slug, title, published_at");

  if (insertError) {
    return res.status(500).json({ error: "Could not save generated blog post.", detail: insertError.message });
  }

  return res.status(200).json({
    ok: true,
    created: insertedRows?.[0] || null,
    model: DEFAULT_MODEL,
    category: blueprint.category,
  });
}
