export type ServiceTier = "flagship" | "support";

export type Service = {
  tier: ServiceTier;
  slug: string;
  eyebrow: string;
  title: string;
  desc: string;
  detail: string;
  image: string;
  alt: string;
};

export const services: readonly Service[] = [
  {
    tier: "flagship",
    slug: "residential-commercial-wiring",
    eyebrow: "Conduit & Wiring",
    title: "Residential & Commercial Conduit Wiring",
    desc: "Concealed conduit piping, wall channelling, and 100% pure copper cable wiring.",
    detail: "Flush PVC conduit embedment, laser-aligned junction boxes, and clean architectural panel terminations.",
    image: "/services/wiring-premium.webp",
    alt: "Premium electrical conduit wiring installation with organized piping routing and a clean distribution board.",
  },
  {
    tier: "flagship",
    slug: "solar-inverter-installation",
    eyebrow: "Solar & Inverters",
    title: "Solar & Inverter Installation",
    desc: "Pure sine wave hybrid inverters, Tier-1 lithium storage, and custom sizing.",
    detail: "Zero-flicker auto-switchover, surge-protected DC isolators, and high-efficiency solar arrays.",
    image: "/services/solar-premium.webp",
    alt: "Premium solar panel and inverter installation with clean cable management on a modern building.",
  },
  {
    tier: "support",
    slug: "cctv-security-systems",
    eyebrow: "CCTV & Security",
    title: "CCTV Installation & Surveillance",
    desc: "High-definition IP surveillance, concealed conduit cabling, and mobile live viewing.",
    detail: "Zero-blindspot perimeter placement, night vision clarity, and 24/7 continuous NVR storage.",
    image: "/services/cctv-premium.webp",
    alt: "Premium CCTV camera installation on a modern property exterior at dusk.",
  },
  {
    tier: "support",
    slug: "smart-home-systems",
    eyebrow: "Smart Automation",
    title: "Smart Home & Office Automation",
    desc: "Capacitive glass touch switches, voice control, and motorized smart automation.",
    detail: "App-controlled scenes, neutral-line stability, and seamless smart lock integration.",
    image: "/services/smart-home-premium.webp",
    alt: "Elegant smart home switch integrated into a warm contemporary interior.",
  },
  {
    tier: "flagship",
    slug: "lighting-interior-finishing",
    eyebrow: "Architectural Lighting",
    title: "Architectural Lighting & Finishing",
    desc: "POP spotlights, magnetic track lighting, chandeliers, and ambient mood zones.",
    detail: "Concealed driver placement, clean ceiling cuts, and glare-free warm illumination.",
    image: "/services/lighting-premium.webp",
    alt: "Luxury chandelier and layered ceiling lighting inside a refined interior.",
  },
];
