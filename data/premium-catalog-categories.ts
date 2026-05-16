import type { ProductCategoryKey } from "@/lib/product-catalog";

export type PremiumCatalogCategory = {
  key: string;
  title: string;
  description: string;
  useCaseNote: string;
  collectionKeys: ProductCategoryKey[];
  primaryCollectionKey: ProductCategoryKey;
  landingPath: string;
  quoteFocus: string;
};

export const premiumCatalogCategories: PremiumCatalogCategory[] = [
  {
    key: "wiring-cables",
    title: "Wiring & Cables",
    description:
      "Copper cables and wiring essentials selected for cleaner routing and safer power delivery in residential and commercial projects.",
    useCaseNote:
      "Use when planning new wiring, rewiring upgrades, or dedicated circuit runs where cable sizing and route protection matter.",
    collectionKeys: ["wiring-cables"],
    primaryCollectionKey: "wiring-cables",
    landingPath: "/products/cables-wires",
    quoteFocus: "cable sizing and routing plan",
  },
  {
    key: "lighting",
    title: "Lighting",
    description:
      "Interior and exterior lighting options for balanced brightness, cleaner ceiling finish, and reliable daily use.",
    useCaseNote:
      "Use for POP ceiling channels, chandelier points, ambient/task lighting zoning, and final decorative finishing.",
    collectionKeys: ["lighting"],
    primaryCollectionKey: "lighting",
    landingPath: "/products/lighting",
    quoteFocus: "lighting layout and switching plan",
  },
  {
    key: "switches-sockets",
    title: "Switches & Sockets",
    description:
      "Switching and outlet accessories curated for cleaner wall finish, dependable control, and easier maintenance.",
    useCaseNote:
      "Use during final accessory phase for homes, offices, and fit-outs where control points must align with daily usage.",
    collectionKeys: ["switches-sockets"],
    primaryCollectionKey: "switches-sockets",
    landingPath: "/products/switches-sockets",
    quoteFocus: "accessory schedule and point count",
  },
  {
    key: "protection-devices",
    title: "Protection Devices",
    description:
      "Circuit breakers, panel essentials, and grounding-related accessories prepared for safer distribution and fault control.",
    useCaseNote:
      "Use when building or upgrading distribution boards, adding critical load protection, or improving fault isolation.",
    collectionKeys: ["circuit-protection", "distribution-boards-panels", "earthing-lightning-protection"],
    primaryCollectionKey: "circuit-protection",
    landingPath: "/products/protection-distribution",
    quoteFocus: "protection sizing and panel upgrade",
  },
  {
    key: "solar-inverter-accessories",
    title: "Solar & Inverter Accessories",
    description:
      "Backup power and solar support items prepared for inverter systems, staged upgrades, and power continuity planning.",
    useCaseNote:
      "Use for inverter-based backup projects where protection, cable path, and load priority must be confirmed before purchase.",
    collectionKeys: ["power-backup-solar", "transformers-power-equipment", "circuit-protection"],
    primaryCollectionKey: "power-backup-solar",
    landingPath: "/products/solar-inverter-components",
    quoteFocus: "solar and inverter load confirmation",
  },
  {
    key: "cctv-security",
    title: "CCTV & Security",
    description:
      "Cameras, recorders, PoE accessories, and security support materials organized for practical monitoring deployments.",
    useCaseNote:
      "Use for homes, offices, and retail spaces where coverage planning, recorder setup, and stable power are required.",
    collectionKeys: [
      "cctv-cameras",
      "dvr",
      "nvr",
      "ip-cameras",
      "analog-cameras",
      "wireless-cctv",
      "cctv-kits",
      "surveillance-hard-drives",
      "cctv-cables-connectors",
      "power-supply-units",
      "camera-mounts-brackets",
      "video-baluns",
      "poe-equipment",
      "monitors-display-screens",
      "remote-viewing-monitoring",
      "access-control-systems",
      "intercom-systems",
      "alarm-systems-sensors",
      "cctv-accessories",
    ],
    primaryCollectionKey: "cctv-cameras",
    landingPath: "/products/cctv-smart-home",
    quoteFocus: "camera coverage and recorder setup",
  },
  {
    key: "conduits-trunking-installation",
    title: "Conduits, Trunking & Installation Accessories",
    description:
      "Conduit routes, trunking paths, and finishing accessories curated for neat, protected installations.",
    useCaseNote:
      "Use during first-fix and finishing phases where cable containment, support points, and accessory compatibility are critical.",
    collectionKeys: ["conduits-trunking", "installation-materials", "electrical-accessories", "cable-management"],
    primaryCollectionKey: "conduits-trunking",
    landingPath: "/products/cables-wires",
    quoteFocus: "containment route and installation accessories",
  },
];
