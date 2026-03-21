export const BLOG_IMAGE_GALLERY = [
  {
    id: "safety-panel-check",
    src: "/blog/safety-panel-check.webp",
    alt: "Electrician inspecting a residential electrical panel for safety faults",
    categories: ["Safety", "Planning"],
    keywords: [
      "safety",
      "panel",
      "distribution board",
      "breaker",
      "fault",
      "inspection",
      "wiring",
      "circuit",
      "load",
      "rewiring",
      "troubleshooting",
    ],
  },
  {
    id: "cable-routing",
    src: "/blog/cable-routing.webp",
    alt: "Cable routing and conduit installation work in progress",
    categories: ["Safety", "Planning"],
    keywords: [
      "conduit",
      "cable",
      "routing",
      "installation",
      "maintenance",
      "wire",
      "rewiring",
      "pipe",
      "layout",
      "containment",
    ],
  },
  {
    id: "panel-testing",
    src: "/blog/panel-testing.webp",
    alt: "Technician testing a control panel during electrical troubleshooting",
    categories: ["Safety", "Planning"],
    keywords: [
      "panel",
      "testing",
      "meter",
      "diagnostic",
      "maintenance",
      "fault",
      "inspection",
      "repair",
      "troubleshooting",
      "control panel",
    ],
  },
  {
    id: "solar-home-rooftop",
    src: "/blog/solar-home-rooftop.jpg",
    alt: "Modern home with a rooftop solar installation",
    categories: ["Solar", "Planning"],
    keywords: [
      "solar",
      "rooftop",
      "panel",
      "pv",
      "backup",
      "energy",
      "battery",
      "home power",
      "power outage",
      "inverter",
    ],
  },
  {
    id: "solar-inverter-installation",
    src: "/blog/solar-inverter-installation.webp",
    alt: "Technician wiring a solar inverter and backup power system",
    categories: ["Solar", "Planning"],
    keywords: [
      "solar",
      "inverter",
      "battery",
      "backup",
      "installation",
      "hybrid",
      "power",
      "energy storage",
      "system sizing",
      "load calculation",
    ],
  },
  {
    id: "cctv-coverage",
    src: "/blog/cctv-coverage.webp",
    alt: "CCTV system setup for home and business surveillance coverage",
    categories: ["CCTV", "Planning"],
    keywords: [
      "cctv",
      "camera",
      "surveillance",
      "security",
      "monitoring",
      "coverage",
      "dvr",
      "nvr",
      "remote viewing",
      "storage",
      "business security",
    ],
  },
  {
    id: "decorative-lighting",
    src: "/blog/decorative-lighting.webp",
    alt: "Decorative lighting installed in a finished interior space",
    categories: ["Lighting"],
    keywords: [
      "lighting",
      "decorative",
      "interior",
      "fixture",
      "ambient",
      "switching",
      "room",
      "ceiling light",
      "mood lighting",
    ],
  },
  {
    id: "chandelier-installation",
    src: "/blog/chandelier-installation.jpg",
    alt: "Installed chandelier fixture in a clean finished ceiling",
    categories: ["Lighting"],
    keywords: [
      "lighting",
      "chandelier",
      "fixture",
      "decorative",
      "ceiling",
      "living room",
      "dining",
      "hanging light",
      "luxury lighting",
    ],
  },
  {
    id: "accent-track",
    src: "/blog/accent-track.webp",
    alt: "Accent ceiling track layout prepared for architectural lighting",
    categories: ["Lighting", "Planning"],
    keywords: [
      "lighting",
      "accent",
      "track",
      "ceiling",
      "layout",
      "architectural",
      "channel",
      "design",
      "finish",
    ],
  },
  {
    id: "pop-light-layout",
    src: "/blog/pop-light-layout.webp",
    alt: "POP ceiling prepared for lighting layout and finishing details",
    categories: ["Lighting", "Planning"],
    keywords: [
      "pop",
      "ceiling",
      "layout",
      "lighting",
      "finish",
      "design",
      "pre-install",
      "fitting",
      "ceiling preparation",
    ],
  },
  {
    id: "chandelier-ceiling",
    src: "/blog/chandelier-ceiling.webp",
    alt: "Decorative chandelier installed on a minimalist finished ceiling",
    categories: ["Lighting"],
    keywords: [
      "chandelier",
      "ceiling",
      "decorative",
      "fixture",
      "lighting",
      "installation",
      "interior",
      "feature light",
    ],
  },
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function countKeywordHits(text, keywords = []) {
  return keywords.reduce((score, keyword) => {
    return text.includes(normalizeText(keyword)) ? score + 1 : score;
  }, 0);
}

export function pickBlogImage({ blueprint, generatedPost, recentPosts = [], requestedTopic = "" }) {
  const textCorpus = normalizeText(
    [
      blueprint?.category,
      requestedTopic,
      generatedPost?.title,
      generatedPost?.summary,
      ...(generatedPost?.points || []),
      ...((generatedPost?.sections || []).flatMap((section) => [section.heading, ...(section.body || [])])),
    ].join(" ")
  );

  const recentImageUrls = recentPosts
    .slice(0, 6)
    .map((post) => String(post?.image_url || "").trim())
    .filter(Boolean);

  const imageUsageCounts = recentImageUrls.reduce((counts, imageUrl) => {
    counts[imageUrl] = (counts[imageUrl] || 0) + 1;
    return counts;
  }, {});

  const rankedImages = BLOG_IMAGE_GALLERY.map((image) => {
    let score = 0;
    const categoryMatch = image.categories.includes(blueprint?.category);
    const keywordHits = countKeywordHits(textCorpus, image.keywords);
    const recentUsagePenalty = imageUsageCounts[image.src] || 0;

    if (categoryMatch) score += 10;
    score += keywordHits * 3;
    score -= recentUsagePenalty * 4;
    if (recentImageUrls[0] === image.src) score -= 6;

    return {
      ...image,
      score,
      keywordHits,
      recentUsagePenalty,
    };
  }).sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.keywordHits !== right.keywordHits) return right.keywordHits - left.keywordHits;
    if (left.recentUsagePenalty !== right.recentUsagePenalty) {
      return left.recentUsagePenalty - right.recentUsagePenalty;
    }
    return left.id.localeCompare(right.id);
  });

  return rankedImages[0] || BLOG_IMAGE_GALLERY[0];
}
