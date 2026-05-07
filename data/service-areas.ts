export type FaqItem = {
  question: string;
  answer: string;
};

export type ServiceArea = {
  slug: string;
  name: string;
  title: string;
  summary: string;
  intro: string;
  focusKeywords: string[];
  mapQuery: string;
  nearbyAreas: string[];
  serviceLines: string[];
  faqs: FaqItem[];
};

export const serviceAreas: ServiceArea[] = [
  {
    slug: "lekki",
    name: "Lekki",
    title: "Electrical installation and materials support in Lekki, Lagos",
    summary:
      "Oduzz supports Lekki homes, offices, and fit-out projects with wiring, lighting, power protection, and practical electrical material guidance.",
    intro:
      "Lekki projects usually need cleaner finishing standards and better load planning because of mixed residential and commercial use. Oduzz helps clients avoid weak material substitutions and delivers safer installation decisions from first fix to final accessories.",
    focusKeywords: [
      "electrical company in Lekki",
      "electrical installation Lekki Lagos",
      "electrical materials supplier Lekki",
      "lighting installation Lekki",
    ],
    mapQuery: "Lekki, Lagos",
    nearbyAreas: ["Lekki Phase 1", "Chevron", "Ikate", "Jakande"],
    serviceLines: [
      "Residential and commercial wiring upgrades",
      "Lighting layout and interior electrical finishing",
      "Solar and inverter backup planning",
      "Material support for cables, switches, fittings, and protection devices",
    ],
    faqs: [
      {
        question: "Do you handle both installation and material supply support in Lekki?",
        answer:
          "Yes. Oduzz provides electrical installation services and helps clients choose suitable, verified electrical materials for the project scope.",
      },
      {
        question: "How can I get a faster quote in Lekki?",
        answer:
          "Send your location, service type, urgency, and site photos on WhatsApp or use the quote page. That reduces back-and-forth and speeds up scope review.",
      },
      {
        question: "Can you support apartment and office fit-out electrical work?",
        answer:
          "Yes. We support residential apartments, office interiors, and mixed-use projects with cleaner routing and safer protection planning.",
      },
    ],
  },
  {
    slug: "ajah",
    name: "Ajah",
    title: "Electrical contractor services in Ajah, Lagos",
    summary:
      "Oduzz supports Ajah projects with electrical installation, lighting systems, CCTV routing, and product guidance for safer long-term performance.",
    intro:
      "Ajah projects often combine new-build work, renovation, and extension loads. Oduzz helps clients match cables, fittings, and protection devices to real usage so systems remain safer and easier to maintain.",
    focusKeywords: [
      "electrical contractor Ajah Lagos",
      "electrician in Ajah",
      "electrical materials Ajah",
      "wiring services Ajah",
    ],
    mapQuery: "Ajah, Lagos",
    nearbyAreas: ["Sangotedo", "Abraham Adesanya", "Badore", "Langbasa"],
    serviceLines: [
      "Electrical fault checks and maintenance support",
      "Conduit wiring and panel organization",
      "CCTV and low-voltage routing",
      "Solar, inverter, and backup power consultation",
    ],
    faqs: [
      {
        question: "Do you work on existing houses in Ajah?",
        answer:
          "Yes. Oduzz handles upgrades and corrective electrical work for occupied homes, including load checks and cleaner rerouting where needed.",
      },
      {
        question: "Can you help verify electrical materials before purchase?",
        answer:
          "Yes. We guide clients on suitable brands, sizes, and protection choices so purchases align with project requirements.",
      },
      {
        question: "Do you provide urgent fault response in Ajah?",
        answer:
          "For urgent issues, send quick details and your location on WhatsApp first. Response windows depend on schedule and site urgency.",
      },
    ],
  },
  {
    slug: "victoria-island",
    name: "Victoria Island",
    title: "Commercial electrical services in Victoria Island, Lagos",
    summary:
      "Oduzz supports Victoria Island commercial and premium residential spaces with disciplined wiring standards, lighting finishing, and reliable power planning.",
    intro:
      "Victoria Island projects demand cleaner final presentation and tighter reliability expectations. Oduzz helps clients execute with stronger material discipline, clearer communication, and practical installation standards.",
    focusKeywords: [
      "electrical company Victoria Island Lagos",
      "commercial electrical contractor Lagos",
      "lighting installation Victoria Island",
      "electrical products supplier Lagos",
    ],
    mapQuery: "Victoria Island, Lagos",
    nearbyAreas: ["Oniru", "Kofo Abayomi", "Adetokunbo Ademola", "Akin Adesola"],
    serviceLines: [
      "Commercial electrical installation and upgrades",
      "Lighting systems and feature fixture installation",
      "Distribution and circuit protection setup",
      "Material guidance for premium finish expectations",
    ],
    faqs: [
      {
        question: "Do you handle office and retail electrical work in Victoria Island?",
        answer:
          "Yes. Oduzz supports commercial spaces including offices, shops, and branded fit-outs with cleaner installation standards.",
      },
      {
        question: "Can you support both first-fix and finishing stages?",
        answer:
          "Yes. We support early routing and final accessory or lighting finishing, based on project phase and scope.",
      },
      {
        question: "How do I start a project conversation for VI?",
        answer:
          "Share your location, project type, and expected timeline through WhatsApp or the quote page so planning can start with real constraints.",
      },
    ],
  },
];

export const homeFaqs: FaqItem[] = [
  {
    question: "What does Oduzz Electrical Concept do in Lagos?",
    answer:
      "Oduzz provides electrical installation services and practical support for selecting verified electrical materials across residential and commercial projects.",
  },
  {
    question: "Do you supply electrical materials or only installation?",
    answer:
      "Both. You can request installation, material guidance, or a combined project delivery path depending on your scope and timeline.",
  },
  {
    question: "Which Lagos locations do you commonly support?",
    answer:
      "Core coverage includes Ikorodu and wider Lagos requests, including Lekki, Ajah, and Victoria Island based on project needs.",
  },
  {
    question: "How can I get a fast electrical quote?",
    answer:
      "Send your location, service type, urgency, and site photos on WhatsApp or through the quote page to speed up assessment.",
  },
];

export function getServiceAreaBySlug(slug: string) {
  const safeSlug = String(slug || "").trim().toLowerCase();
  return serviceAreas.find((area) => area.slug === safeSlug) ?? null;
}
