export type HeroSlide = {
  id: string;
  image: string;
  objectPosition?: string;
  alt: string;
  kicker: string;
  title: string;
  copy: string;
  localNote?: string;
  trustStatement?: string;
  ctaLabel?: string;
  ctaTo?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  benefits: readonly [string, string, string] | string[];
};

export const heroGallery = [
  {
    id: "hero-wiring",
    image: "/hero/wiringg.webp",
    objectPosition: "center 34%",
    alt: "Electrician working on a residential control panel installation",
    kicker: "Lagos Electrical Systems",
    title: "Trusted Electrical Installations in Lagos",
    copy:
      "Get safer wiring, cleaner finishing, and verified materials for homes, offices, and commercial spaces.",
    localNote: "Serving Ikorodu, Lagos",
    ctaLabel: "Request Quote",
    ctaTo: "/quote",
    secondaryCtaLabel: "Chat on WhatsApp",
    secondaryCtaTo: "https://wa.me/2347032258039",
    benefits: ["Professional planning", "Clean finishing", "Verified materials"],
  },
  {
    id: "hero-solar",
    image: "/hero/solar.webp",
    objectPosition: "center 28%",
    alt: "Technician wiring a solar inverter setup with safety equipment",
    kicker: "Solar",
    title: "Reliable Solar & Backup Power Solutions",
    copy:
      "Solar and inverter systems professionally sized for your home or business, delivering dependable backup power and long-term performance.",
    localNote: "Trusted Electrical & Solar Installers in Lagos",
    ctaLabel: "Get Solar Quote",
    ctaTo: "/quote?serviceType=Solar%20and%20Inverter%20Installation",
    secondaryCtaLabel: "Chat on WhatsApp",
    secondaryCtaTo: "https://wa.me/2347032258039",
    benefits: ["Longer battery runtime", "Proper electrical protection", "Professional installation standards"],
  },
  {
    id: "hero-cctv",
    image: "/hero/cctv.webp",
    objectPosition: "center 24%",
    alt: "Security technician installing a CCTV camera on a wall",
    kicker: "CCTV",
    title: "Professional CCTV Systems for Homes & Businesses",
    copy:
      "Monitor your home, office, shop, or warehouse from anywhere with professionally installed CCTV systems.",
    localNote: "Professional CCTV Installation Across Lagos",
    trustStatement: "Trusted by homeowners, businesses, schools, and offices across Lagos.",
    ctaLabel: "Get CCTV Quote",
    ctaTo: "/quote",
    secondaryCtaLabel: "Talk to an Expert",
    secondaryCtaTo: "https://wa.me/2347032258039",
    benefits: ["Mobile viewing anywhere", "Day and night recording", "Secure backup storage"],
  },
  {
    id: "hero-lighting",
    image: "/hero/lightings.webp",
    objectPosition: "center 42%",
    alt: "Interior chandelier installation with clean ceiling finishing",
    kicker: "Lighting",
    title: "Lighting That Transforms Your Space",
    copy:
      "Create a brighter, more elegant atmosphere with professionally planned lighting and ceiling designs.",
    localNote: "Serving Lagos and Ogun State",
    ctaLabel: "View Lighting Projects",
    ctaTo: "/projects",
    secondaryCtaLabel: "Get Lighting Consultation",
    secondaryCtaTo: "/quote?serviceType=Lighting%20and%20Interior%20Finishing",
    benefits: ["Elegant interior finish", "Enhanced room ambience", "Energy-efficient lighting"],
  },
] satisfies readonly HeroSlide[];
