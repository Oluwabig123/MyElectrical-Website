export type HeroSlide = {
  id: string;
  tabLabel: string;
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
    tabLabel: "Conduit Wiring",
    image: "/hero/wiringg.webp",
    alt: "Electrician working on a residential control panel and conduit wiring installation",
    kicker: "Conduit Electrical Engineering",
    title: "Concealed Conduit Wiring & Clean Finishing",
    copy:
      "100% verified pure copper cables, precision wall channelling, and zero fire risk for homes and commercial buildings in Lagos.",
    ctaLabel: "Request Site Inspection",
    ctaTo: "/quote?service=residential-commercial-wiring",
    benefits: ["Original Coleman / Nigerchin", "Laser-straight conduit embedding", "Zero fire risk promise"],
  },
  {
    id: "hero-solar",
    tabLabel: "Solar & Inverter",
    image: "/hero/solar.webp",
    alt: "Technician wiring a solar inverter setup with safety equipment",
    kicker: "Solar & Inverter Engineering",
    title: "Backup Power Built for Real Nigerian Demands",
    copy:
      "Pure sine wave hybrid systems sized to your actual appliance watt-hours, with Tier-1 lithium storage and generator changeover.",
    ctaLabel: "Explore Solar Systems",
    ctaTo: "/services/solar-inverter-installation",
    benefits: ["Real appliance run-time sizing", "Tier-1 LiFePO4 batteries", "Auto generator changeover"],
  },
  {
    id: "hero-cctv",
    tabLabel: "CCTV Surveillance",
    image: "/hero/cctv.webp",
    alt: "Security technician installing a CCTV camera on a wall with clean cabling",
    kicker: "CCTV & Security Systems",
    title: "Zero-Blindspot CCTV With Concealed Routing",
    copy:
      "High-definition IP surveillance, neat conduit cabling, 24/7 NVR recording, and real-time remote phone monitoring.",
    ctaLabel: "Get CCTV Quote",
    ctaTo: "/quote?service=cctv-security-systems",
    benefits: ["Zero-blindspot coverage", "Concealed CAT6 conduit runs", "Live remote phone access"],
  },
  {
    id: "hero-lighting",
    tabLabel: "Lighting & Smart",
    image: "/hero/lightings.webp",
    alt: "Interior chandelier installation with clean ceiling finishing and ambient lighting",
    kicker: "Architectural Lighting & Smart Controls",
    title: "Architectural Lighting & Smart Home Finishes",
    copy:
      "POP recessed spotlights, chandeliers, magnetic tracks, and app-controlled glass touch switches that elevate your interior.",
    ctaLabel: "View Lighting Scope",
    ctaTo: "/services/lighting-interior-finishing",
    benefits: ["Clean ceiling cuts & flush mounts", "Flicker-free smart switches", "Ambient mood control"],
  },
];
