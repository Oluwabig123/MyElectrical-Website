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
    slug: "ikorodu",
    name: "Ikorodu",
    title: "Electrical services and material support in Ikorodu, Lagos",
    summary:
      "Oduzz supports Ikorodu homes, shops, and commercial spaces with wiring upgrades, lighting work, maintenance, and electrical material guidance.",
    intro:
      "Ikorodu remains one of Oduzz's strongest operating zones. Projects often combine upgrades, extensions, and corrective work where existing circuits need better protection and cleaner routing. Oduzz helps clients make safer installation and material decisions from scope to handover.",
    focusKeywords: [
      "electrical company in Ikorodu",
      "electrician Ikorodu Lagos",
      "electrical installation Ikorodu",
      "electrical materials supplier Ikorodu",
    ],
    mapQuery: "Ikorodu, Lagos",
    nearbyAreas: ["Igbogbo", "Ipakodo", "Ogolonto", "Ikorodu GRA"],
    serviceLines: [
      "Residential and commercial wiring corrections",
      "Fault diagnosis and electrical maintenance",
      "Lighting finishing and interior fitting support",
      "Solar and inverter backup consultations",
    ],
    faqs: [
      {
        question: "Do you provide same-area support across Ikorodu neighborhoods?",
        answer:
          "Yes. Oduzz supports multiple Ikorodu neighborhoods based on schedule and project scope, including residential and commercial requests.",
      },
      {
        question: "Can I combine installation service with material guidance in Ikorodu?",
        answer:
          "Yes. You can request both installation and practical material selection support to reduce mismatch and avoid weak substitutions.",
      },
      {
        question: "How quickly can Ikorodu requests be assessed?",
        answer:
          "Share location, issue details, and clear photos through WhatsApp or the quote page to speed up initial assessment.",
      },
    ],
  },
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
  {
    slug: "ikeja",
    name: "Ikeja",
    title: "Electrical installation and upgrade support in Ikeja, Lagos",
    summary:
      "Oduzz supports Ikeja offices, shops, and residential spaces with structured wiring, lighting systems, and dependable electrical maintenance support.",
    intro:
      "Ikeja projects often require commercial reliability with cleaner finishing and clear timelines. Oduzz helps clients align protection, circuit routing, and finishing quality so installations are easier to maintain over time.",
    focusKeywords: [
      "electrical contractor Ikeja Lagos",
      "electrical installation Ikeja",
      "commercial electrician Ikeja",
      "electrical maintenance Ikeja",
    ],
    mapQuery: "Ikeja, Lagos",
    nearbyAreas: ["Alausa", "Opebi", "GRA Ikeja", "Maryland"],
    serviceLines: [
      "Commercial wiring upgrades and distribution planning",
      "Lighting systems and feature installation",
      "Routine fault checks and maintenance support",
      "Material guidance for reliable office fit-outs",
    ],
    faqs: [
      {
        question: "Do you handle office and retail electrical fit-outs in Ikeja?",
        answer:
          "Yes. Oduzz supports office and retail projects with practical planning for routing, protection, and finishing.",
      },
      {
        question: "Can you inspect and correct existing unstable circuits?",
        answer:
          "Yes. We assess circuit behavior, protection settings, and termination quality before proposing corrections.",
      },
      {
        question: "Do you support urgent maintenance requests in Ikeja?",
        answer:
          "Urgent requests are reviewed by schedule and severity. Sharing accurate issue details early helps faster triage.",
      },
    ],
  },
  {
    slug: "surulere",
    name: "Surulere",
    title: "Residential and commercial electrical services in Surulere, Lagos",
    summary:
      "Oduzz supports Surulere properties with wiring upgrades, lighting installation, fault diagnosis, and practical product guidance.",
    intro:
      "Surulere properties often involve renovation, extension loads, and mixed old/new electrical systems. Oduzz helps clients modernize safely with cleaner routing, balanced circuit planning, and better installation quality.",
    focusKeywords: [
      "electrical company Surulere Lagos",
      "wiring services Surulere",
      "lighting installation Surulere",
      "electrician Surulere",
    ],
    mapQuery: "Surulere, Lagos",
    nearbyAreas: ["Bode Thomas", "Adeniran Ogunsanya", "Aguda", "Eric Moore"],
    serviceLines: [
      "Wiring upgrades for renovation projects",
      "Distribution and protection correction work",
      "Lighting finishing and switch control setup",
      "Installation and material planning consultations",
    ],
    faqs: [
      {
        question: "Can you work with renovation teams in Surulere?",
        answer:
          "Yes. Oduzz works with homeowners and contractors during renovation phases to align electrical scope with finishing work.",
      },
      {
        question: "Do you provide support for both homes and small businesses?",
        answer:
          "Yes. Service coverage includes residential, office, and small commercial spaces based on project needs.",
      },
      {
        question: "How do I start an electrical project in Surulere?",
        answer:
          "Send your location, service type, timeline, and site photos through WhatsApp or the quote form to begin.",
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
