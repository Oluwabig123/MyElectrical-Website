import type { ProductCategoryKey } from "@/lib/product-catalog";

export type CategoryLandingProduct = {
  name: string;
  description: string;
  image: string;
  detailHref: string;
  quoteMessage: string;
};

export type ProductCategoryLandingPage = {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  intro: string;
  heroImage: string;
  categoryKeys: ProductCategoryKey[];
  collectionHref: string;
  quoteMessage: string;
  products: CategoryLandingProduct[];
  relatedServices: Array<{
    label: string;
    href: string;
  }>;
};

export const googleBusinessProfileUtm =
  "utm_source=google_business_profile&utm_medium=product&utm_campaign=local_products";

export const productCategoryLandingPages: ProductCategoryLandingPage[] = [
  {
    slug: "cables-wires",
    path: "/products/cables-wires",
    title: "Cables & Wires Supplier in Lagos",
    h1: "Cables & Wires Supplier in Lagos",
    description:
      "Buy quality cables and wires in Lagos from Oduzz Electrical Concept, with support for cable sizing, conduit routing, and professional electrical installation in Ikorodu and across Lagos.",
    keywords: [
      "cables and wires supplier in Lagos",
      "quality electrical materials in Ikorodu",
      "electrical materials supplier in Lagos",
      "electrical installation service in Lagos",
    ],
    intro:
      "Oduzz Electrical Concept supplies cables and wires for homes, offices, shops, and commercial projects across Lagos, with practical guidance for Ikorodu clients who need safer cable selection and installation planning.",
    heroImage: "/blog/cable-routing.webp",
    categoryKeys: ["wiring-cables", "conduits-trunking", "installation-materials", "cable-management"],
    collectionHref: "/collections/wiring-cables",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in cables and wires for my electrical project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "Quality Copper Cable",
        description:
          "Copper cable options for socket circuits, lighting runs, and controlled residential or commercial wiring work.",
        image: "/blog/cable-routing.webp",
        detailHref: "/products/single-core-copper-cable-2-5mm",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in quality copper cable. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Conduit Wiring Materials",
        description:
          "Conduit, routing, and support materials for protected cable paths in new builds and rewiring projects.",
        image: "/services/wiring-premium.webp",
        detailHref: "/collections/conduits-trunking",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I need conduit wiring materials for a project. Please confirm price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "Electrician in Lagos", href: "/services" },
      { label: "Electrician in Ikorodu", href: "/locations/ikorodu" },
      { label: "Conduit house wiring in Lagos", href: "/services/residential-commercial-wiring" },
      { label: "Electrical maintenance", href: "/services/fault-diagnosis-maintenance" },
    ],
  },
  {
    slug: "switches-sockets",
    path: "/products/switches-sockets",
    title: "Switches & Sockets Supplier in Lagos",
    h1: "Switches & Sockets Supplier in Lagos",
    description:
      "Shop switches and sockets in Lagos from Oduzz Electrical Concept, with guidance for wall accessories, point planning, replacement work, and professional installation.",
    keywords: [
      "switches and sockets in Lagos",
      "electrical materials supplier in Lagos",
      "quality electrical materials in Ikorodu",
      "electrical installation service in Lagos",
    ],
    intro:
      "Oduzz Electrical Concept supplies switches and sockets in Lagos for residential and commercial finishing, helping Ikorodu and wider Lagos clients match accessories to wall boxes, circuit use, and installation quality.",
    heroImage: "/hero/interior.jpg",
    categoryKeys: ["switches-sockets", "smart-home-automation", "electrical-accessories"],
    collectionHref: "/collections/switches-sockets",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in switches and sockets for my electrical project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "Wall Sockets",
        description:
          "Wall socket options for bedrooms, kitchens, offices, and clean power-point finishing.",
        image: "/hero/interior.jpg",
        detailHref: "/products/double-wall-socket-13a",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in wall sockets. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Light Switches",
        description:
          "Switch accessories for lighting control, replacement work, and final electrical finishing.",
        image: "/services/smart-home-premium.webp",
        detailHref: "/collections/switches-sockets",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I need light switches for my project. Please confirm price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "Socket and switch installation", href: "/services/smart-home-systems" },
      { label: "Electrician in Lagos", href: "/services" },
      { label: "Electrical maintenance", href: "/services/fault-diagnosis-maintenance" },
    ],
  },
  {
    slug: "lighting",
    path: "/products/lighting",
    title: "Lighting Products Supplier in Lagos",
    h1: "Lighting Products Supplier in Lagos",
    description:
      "Find lighting products in Lagos from Oduzz Electrical Concept, including LED ceiling lights, chandelier support materials, POP lighting guidance, and installation support.",
    keywords: [
      "lighting products in Lagos",
      "lighting installation Lagos",
      "electrical materials supplier in Lagos",
      "quality electrical materials in Ikorodu",
    ],
    intro:
      "Oduzz Electrical Concept supplies lighting products in Lagos for ceiling, POP, chandelier, and interior finishing projects, with practical installation guidance for Ikorodu homes, offices, and commercial spaces.",
    heroImage: "/hero/lightings.webp",
    categoryKeys: ["lighting", "switches-sockets", "installation-materials"],
    collectionHref: "/collections/lighting",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in lighting products for my electrical project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "LED Ceiling Light",
        description:
          "Ceiling lighting option for bedrooms, living rooms, offices, POP ceilings, and clean interior finishing.",
        image: "/services/lighting-premium.webp",
        detailHref: "/products/led-panel-light",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in LED ceiling lights. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Chandelier Installation Materials",
        description:
          "Support accessories and lighting materials for safer chandelier mounting and cleaner ceiling terminations.",
        image: "/hero/lightings.webp",
        detailHref: "/products/chandelier-installation-kit",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I need chandelier installation materials. Please confirm price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "Lighting installation", href: "/services/lighting-interior-finishing" },
      { label: "Interior electrical finishing", href: "/services/lighting-interior-finishing" },
      { label: "Electrician in Lagos", href: "/services" },
    ],
  },
  {
    slug: "protection-distribution",
    path: "/products/protection-distribution",
    title: "Protection & Distribution Products in Lagos",
    h1: "Protection & Distribution Products in Lagos",
    description:
      "Source protection devices and distribution materials in Lagos from Oduzz Electrical Concept, including breakers, DB planning support, and installation guidance.",
    keywords: [
      "electrical materials supplier in Lagos",
      "quality electrical materials in Ikorodu",
      "electrical protection installation Lagos",
      "electrical installation service in Lagos",
    ],
    intro:
      "Oduzz Electrical Concept supplies protection and distribution products in Lagos for safer circuit control, panel planning, DB upgrades, and maintenance work across Ikorodu and wider Lagos.",
    heroImage: "/blog/panel-testing.webp",
    categoryKeys: [
      "circuit-protection",
      "distribution-boards-panels",
      "earthing-lightning-protection",
      "testing-measuring",
    ],
    collectionHref: "/collections/circuit-protection",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in protection and distribution products for my electrical project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "Distribution Board",
        description:
          "Distribution and panel materials for circuit organization, breaker mapping, and safer maintenance access.",
        image: "/blog/panel-testing.webp",
        detailHref: "/collections/distribution-boards-panels",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in a distribution board. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Miniature Circuit Breaker",
        description:
          "Circuit breaker option for controlled load protection when ratings are confirmed against project requirements.",
        image: "/blog/panel-testing.webp",
        detailHref: "/products/miniature-circuit-breaker-32a",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in miniature circuit breakers. Please send me price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "DB dressing and electrical panel installation", href: "/services/residential-commercial-wiring" },
      { label: "Electrical maintenance", href: "/services/fault-diagnosis-maintenance" },
      { label: "Conduit house wiring", href: "/services/residential-commercial-wiring" },
      { label: "Electrician in Lagos", href: "/services" },
    ],
  },
  {
    slug: "solar-inverter-components",
    path: "/products/solar-inverter-components",
    title: "Solar & Inverter Components in Lagos",
    h1: "Solar & Inverter Components in Lagos",
    description:
      "Get solar inverter components in Lagos from Oduzz Electrical Concept, with advice for inverter sizing, backup power materials, protection, and installation.",
    keywords: [
      "solar inverter components in Lagos",
      "solar inverter installation Lagos",
      "electrical materials supplier in Lagos",
      "electrical installation service in Lagos",
    ],
    intro:
      "Oduzz Electrical Concept supplies solar and inverter components in Lagos for backup power projects, helping Ikorodu clients confirm load priorities, protection needs, and installation plans before payment.",
    heroImage: "/services/solar-premium.webp",
    categoryKeys: ["power-backup-solar", "transformers-power-equipment", "circuit-protection"],
    collectionHref: "/collections/power-backup-solar",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in solar and inverter components for my electrical project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "Solar Panels",
        description:
          "Solar panel and support component sourcing for staged backup power and solar-integrated setups.",
        image: "/blog/solar-home-rooftop.jpg",
        detailHref: "/collections/power-backup-solar",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in solar panels. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Hybrid Solar Inverter",
        description:
          "Hybrid inverter option for homes and small offices after load sizing and protection requirements are confirmed.",
        image: "/services/solar-premium.webp",
        detailHref: "/products/hybrid-solar-inverter-3-5kva",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in a hybrid solar inverter. Please send me price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "Solar inverter installation", href: "/services/solar-inverter-installation" },
      { label: "Inverter battery installation", href: "/services/solar-inverter-installation" },
      { label: "Electrical protection installation", href: "/services/fault-diagnosis-maintenance" },
    ],
  },
  {
    slug: "cctv-smart-home",
    path: "/products/cctv-smart-home",
    title: "CCTV & Smart Home Devices in Lagos",
    h1: "CCTV & Smart Home Devices in Lagos",
    description:
      "Buy CCTV and smart home devices in Lagos from Oduzz Electrical Concept, with support for camera coverage, remote viewing, smart switches, and installation.",
    keywords: [
      "CCTV and smart home devices in Lagos",
      "CCTV installation Lagos",
      "smart home installation Lagos",
      "electrical materials supplier in Lagos",
    ],
    intro:
      "Oduzz Electrical Concept supplies CCTV and smart home devices in Lagos for homes, offices, shops, and estates, with installation support for Ikorodu and wider Lagos projects.",
    heroImage: "/services/cctv-premium.webp",
    categoryKeys: [
      "cctv-cameras",
      "dvr",
      "nvr",
      "ip-cameras",
      "analog-cameras",
      "wireless-cctv",
      "cctv-kits",
      "poe-equipment",
      "access-control-systems",
      "intercom-systems",
      "alarm-systems-sensors",
      "cctv-accessories",
      "smart-home-automation",
    ],
    collectionHref: "/collections/cctv-cameras",
    quoteMessage:
      "Hello Oduzz Electrical Concept, I am interested in CCTV and smart home devices for my project. Please send me price, availability, and installation advice. My location is ______.",
    products: [
      {
        name: "CCTV Camera System",
        description:
          "Camera system options for homes, offices, shops, and monitoring points after coverage planning.",
        image: "/services/cctv-premium.webp",
        detailHref: "/products/cctv-dome-camera-2mp",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in a CCTV camera system. Please send me price, availability, and installation advice. My location is ______.",
      },
      {
        name: "Smart Home Accessories",
        description:
          "Smart control accessories for lighting and convenience where wiring compatibility supports installation.",
        image: "/services/smart-home-premium.webp",
        detailHref: "/collections/smart-home-automation",
        quoteMessage:
          "Hello Oduzz Electrical Concept, I am interested in smart home accessories. Please send me price, availability, and installation advice. My location is ______.",
      },
    ],
    relatedServices: [
      { label: "CCTV installation", href: "/services/cctv-security-systems" },
      { label: "Smart home installation", href: "/services/smart-home-systems" },
      { label: "Electrical maintenance", href: "/services/fault-diagnosis-maintenance" },
    ],
  },
];

export const productCategoryLandingPageMap = productCategoryLandingPages.reduce<
  Record<string, ProductCategoryLandingPage>
>((acc, page) => {
  acc[page.slug] = page;
  return acc;
}, {});

export const googleBusinessProfileProductUrls = [
  { product: "Quality Copper Cable", path: "/products/cables-wires" },
  { product: "Wall Sockets", path: "/products/switches-sockets" },
  { product: "LED Ceiling Light", path: "/products/lighting" },
  { product: "Distribution Board", path: "/products/protection-distribution" },
  { product: "Solar Panels", path: "/products/solar-inverter-components" },
  { product: "CCTV Camera System", path: "/products/cctv-smart-home" },
].map((item) => ({
  ...item,
  url: `https://www.oduzzconcept.com.ng${item.path}?${googleBusinessProfileUtm}`,
}));
