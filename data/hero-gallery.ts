export type HeroSlide = {
  id: string;
  image: string;
  alt: string;
  kicker: string;
  title: string;
  copy: string;
  ctaLabel: string;
  ctaTo: string;
  benefits: readonly string[];
};

export const heroGallery: readonly HeroSlide[] = [
  {
    id: "hero-wiring",
    image: "/hero/wiring.webp",
    alt: "Electrician performing professional conduit wiring and distribution board installation",
    kicker: "Electrical Conduit Engineering",
    title: "Concealed Conduit Wiring in Lagos",
    copy: "100% verified pure copper cables, precision channelling, and zero fire risk.",
    ctaLabel: "Request Site Inspection",
    ctaTo: "/quote?service=residential-commercial-wiring",
    benefits: ["Original Coleman / Nigerchin", "Concealed conduit embedding", "Zero fire risk promise"],
  },
  {
    id: "hero-solar",
    image: "/hero/solar.webp",
    alt: "Technician wiring a solar inverter setup with safety equipment",
    kicker: "Solar & Inverter Engineering",
    title: "Reliable Backup Power for Nigeria",
    copy: "Pure sine wave hybrid systems sized for real appliance run-time and Tier-1 lithium storage.",
    ctaLabel: "Explore Solar Systems",
    ctaTo: "/services/solar-inverter-installation",
    benefits: ["Real appliance run-time sizing", "Tier-1 LiFePO4 batteries", "Auto generator changeover"],
  },
  {
    id: "hero-cctv",
    image: "/hero/cctv.jpg",
    alt: "Commercial PTZ surveillance camera neatly mounted on modern building facade with conduit routing",
    kicker: "CCTV & Security Systems",
    title: "Clean Security Camera Coverage",
    copy: "Zero-blindspot IP surveillance with concealed conduit runs and 24/7 mobile viewing.",
    ctaLabel: "Get CCTV Quote",
    ctaTo: "/quote?service=cctv-security-systems",
    benefits: ["Zero-blindspot coverage", "Concealed CAT6 conduit runs", "Live remote phone access"],
  },
  {
    id: "hero-lighting",
    image: "/hero/lightings.webp",
    alt: "Interior chandelier installation with clean ceiling finishing and ambient lighting",
    kicker: "Architectural Lighting & Smart",
    title: "Lighting Designed for Luxury Finishes",
    copy: "Flush POP spotlights, chandeliers, and ambient smart mood zones.",
    ctaLabel: "View Lighting Scope",
    ctaTo: "/services/lighting-interior-finishing",
    benefits: ["Clean ceiling cuts & flush mounts", "Flicker-free smart switches", "Ambient mood control"],
  },
];
