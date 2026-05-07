import type { ProductCategoryKey } from "@/lib/product-catalog";
import type { FaqItem } from "@/data/service-areas";

export type ServicePage = {
  slug: string;
  shortTitle: string;
  title: string;
  summary: string;
  intro: string;
  serviceType: string;
  focusKeywords: string[];
  deliverables: string[];
  process: string[];
  faqs: FaqItem[];
  relatedCategoryKeys: ProductCategoryKey[];
  relatedBlogSlugs: string[];
};

export const servicePages: ServicePage[] = [
  {
    slug: "residential-commercial-wiring",
    shortTitle: "Wiring Installation",
    title: "Residential and commercial wiring installation in Lagos",
    summary:
      "Oduzz handles conduit wiring, load planning, and distribution setup for homes, offices, and fit-out projects across Lagos.",
    intro:
      "Wiring quality is not only about cable selection. It includes load planning, protection sizing, routing discipline, and cleaner finishing that stays easier to maintain. Oduzz supports new installs, upgrades, and corrective rewiring where existing circuits are overloaded or poorly organized.",
    serviceType: "Residential and commercial electrical wiring service",
    focusKeywords: [
      "electrical wiring company in Lagos",
      "residential wiring installation Lagos",
      "commercial wiring contractor Nigeria",
      "conduit wiring service Lagos",
    ],
    deliverables: [
      "Circuit and load review before route decisions",
      "Conduit and cable routing with cleaner finish discipline",
      "Distribution board organization and breaker mapping",
      "Testing, correction list, and practical handover notes",
    ],
    process: [
      "Inspect existing or planned load profile",
      "Define routing and accessory positions for cleaner execution",
      "Install and terminate with safety and maintainability in view",
      "Test under realistic load before final handover",
    ],
    faqs: [
      {
        question: "Do you handle rewiring for occupied houses and offices?",
        answer:
          "Yes. Oduzz supports phased rewiring and corrective upgrades where live spaces need safer routing and better circuit organization.",
      },
      {
        question: "Can you help with breaker and cable sizing decisions?",
        answer:
          "Yes. Scope review includes practical cable and protection guidance based on expected load and usage pattern.",
      },
      {
        question: "How do I request a faster wiring quote?",
        answer:
          "Share your location, floor layout, site photos, and key load points on WhatsApp or through the quote page for quicker assessment.",
      },
    ],
    relatedCategoryKeys: [
      "wiring-cables",
      "conduits-trunking",
      "distribution-boards-panels",
      "circuit-protection",
    ],
    relatedBlogSlugs: ["wiring-safety-checklist"],
  },
  {
    slug: "fault-diagnosis-maintenance",
    shortTitle: "Maintenance",
    title: "Electrical fault diagnosis and maintenance services in Lagos",
    summary:
      "Oduzz provides practical electrical troubleshooting, repair support, and preventive maintenance for residential and commercial properties.",
    intro:
      "Repeated trips, warm switches, unstable voltage behavior, and poor terminations are warning signs that should be diagnosed before they escalate. Oduzz isolates faults with clearer process steps to reduce guesswork and avoid unnecessary replacements.",
    serviceType: "Electrical fault diagnosis and preventive maintenance",
    focusKeywords: [
      "electrical fault diagnosis Lagos",
      "electrical maintenance service Nigeria",
      "electrical troubleshooting contractor",
      "preventive electrical maintenance Lagos",
    ],
    deliverables: [
      "Fault tracing across affected circuits and accessories",
      "Safety checks for breaker, cable, and termination condition",
      "Corrective repair recommendations with priority order",
      "Maintenance schedule guidance for recurring issues",
    ],
    process: [
      "Capture symptoms, trigger conditions, and affected areas",
      "Inspect protection, terminations, and circuit loading",
      "Isolate root cause before replacement decisions",
      "Verify stability and share practical prevention guidance",
    ],
    faqs: [
      {
        question: "Can you diagnose faults before recommending replacements?",
        answer:
          "Yes. Oduzz prioritizes root-cause checks before suggesting major part replacements or rewiring.",
      },
      {
        question: "Do you support scheduled maintenance for offices or shops?",
        answer:
          "Yes. We support periodic checks for commercial spaces to reduce unplanned downtime and repeated minor faults.",
      },
      {
        question: "What details should I send for urgent faults?",
        answer:
          "Share your location, the exact issue, when it occurs, and clear panel or accessory photos to speed up triage.",
      },
    ],
    relatedCategoryKeys: ["circuit-protection", "testing-measuring", "distribution-boards-panels"],
    relatedBlogSlugs: ["wiring-safety-checklist"],
  },
  {
    slug: "solar-inverter-installation",
    shortTitle: "Solar & Inverter",
    title: "Solar and inverter installation services in Lagos",
    summary:
      "Oduzz supports solar and inverter setups with realistic load planning, cleaner installation routing, and safer protection decisions.",
    intro:
      "A better backup system starts with priority loads and runtime expectations, not panel counts alone. Oduzz helps clients avoid undersized systems and poor installation practices by aligning sizing, wiring, and protection to actual power use.",
    serviceType: "Solar and inverter backup power installation",
    focusKeywords: [
      "solar inverter installation Lagos",
      "home backup power system Nigeria",
      "solar setup contractor Lagos",
      "inverter sizing service Lagos",
    ],
    deliverables: [
      "Priority-load and runtime sizing conversation",
      "Battery, inverter, and protection planning guidance",
      "Clean cable routing and system installation",
      "Basic usage and maintenance handover",
    ],
    process: [
      "Audit loads and define critical circuits first",
      "Match inverter and battery capacity to real usage",
      "Install with proper protection and tidy routing",
      "Test switchover behavior and train users on best practice",
    ],
    faqs: [
      {
        question: "Can you install staged solar systems when budget is limited?",
        answer:
          "Yes. Oduzz can scope phased installations so essential loads are covered first, then expanded when ready.",
      },
      {
        question: "Do you support both inverter-only and solar-integrated setups?",
        answer:
          "Yes. We support inverter backup projects and full solar-integrated systems based on your usage goals.",
      },
      {
        question: "How do I prepare for a solar quote?",
        answer:
          "Send your priority appliances, expected backup hours, location, and current power challenges for a practical sizing discussion.",
      },
    ],
    relatedCategoryKeys: ["power-backup-solar", "circuit-protection", "wiring-cables"],
    relatedBlogSlugs: ["solar-inverter-sizing-basics"],
  },
  {
    slug: "cctv-security-systems",
    shortTitle: "CCTV & Security",
    title: "CCTV and security system installation in Lagos",
    summary:
      "Oduzz installs CCTV systems with cleaner cable routing, practical camera placement, recording setup, and remote access support.",
    intro:
      "Security performance depends on placement and reliability, not camera count alone. Oduzz helps align camera positions, power routing, recording hardware, and handover quality so systems remain more useful after installation.",
    serviceType: "CCTV and security system installation service",
    focusKeywords: [
      "cctv installation company Lagos",
      "security camera setup Lagos",
      "cctv contractor Nigeria",
      "remote viewing cctv setup",
    ],
    deliverables: [
      "Camera placement planning around coverage goals",
      "Cable routing and power path setup",
      "Recorder, storage, and remote access configuration",
      "Basic monitoring workflow handover for daily use",
    ],
    process: [
      "Inspect property points and define coverage priorities",
      "Select camera positions and installation path",
      "Install cameras, recorder, and power routing cleanly",
      "Configure remote access and verify recording quality",
    ],
    faqs: [
      {
        question: "Do you configure phone remote viewing after installation?",
        answer:
          "Yes. Oduzz sets up practical remote monitoring access as part of system handover where internet access is available.",
      },
      {
        question: "Can you upgrade or tidy existing CCTV installations?",
        answer:
          "Yes. We support cleanup, rerouting, and component upgrades for older systems with weak coverage or unstable recording.",
      },
      {
        question: "Do you install CCTV in homes and commercial spaces?",
        answer:
          "Yes. Service covers residential compounds, office spaces, and retail security use cases based on scope.",
      },
    ],
    relatedCategoryKeys: ["cctv-cameras", "dvr", "nvr", "poe-equipment"],
    relatedBlogSlugs: [],
  },
  {
    slug: "smart-home-systems",
    shortTitle: "Smart Home",
    title: "Smart home electrical systems and controls in Lagos",
    summary:
      "Oduzz supports smart switch and lighting control setups with cleaner wiring decisions and practical automation reliability.",
    intro:
      "Smart control works best when electrical routing, accessory compatibility, and user behavior are considered together. Oduzz helps clients deploy smart controls that stay usable and maintainable instead of overcomplicated.",
    serviceType: "Smart home electrical control installation service",
    focusKeywords: [
      "smart home installation Lagos",
      "smart switch setup Nigeria",
      "home automation electrical contractor",
      "smart lighting control Lagos",
    ],
    deliverables: [
      "Smart control planning around real daily use",
      "Switching point and routing decisions for stable operation",
      "Device setup, pairing, and baseline automation scenes",
      "User handover with practical control guidance",
    ],
    process: [
      "Map control needs per room and use case",
      "Confirm compatible devices and route requirements",
      "Install and configure control points and automations",
      "Test reliability and train users on fallback behavior",
    ],
    faqs: [
      {
        question: "Can smart controls be added to existing homes?",
        answer:
          "Yes. Oduzz supports retrofit smart switch and control projects where wiring and compatibility allow practical deployment.",
      },
      {
        question: "Do you set up app control for lights and switches?",
        answer:
          "Yes. Setup includes core app pairing and baseline control scenes for daily operation.",
      },
      {
        question: "Will smart home setup increase electrical safety?",
        answer:
          "Automation improves convenience, but safety still depends on correct wiring, protection, and installation quality.",
      },
    ],
    relatedCategoryKeys: ["smart-home-automation", "switches-sockets", "lighting"],
    relatedBlogSlugs: ["lighting-layout-mistakes"],
  },
  {
    slug: "lighting-interior-finishing",
    shortTitle: "Lighting Finishing",
    title: "Lighting installation and interior electrical finishing in Lagos",
    summary:
      "Oduzz delivers layered lighting installation, POP-ready routing, and cleaner finishing for homes, offices, and fit-outs in Lagos.",
    intro:
      "Lighting quality depends on planning, spacing, and switch grouping as much as fixture style. Oduzz helps clients execute decorative and functional lighting with cleaner final presentation and safer terminations.",
    serviceType: "Lighting installation and interior electrical finishing",
    focusKeywords: [
      "lighting installation service Lagos",
      "interior electrical finishing Nigeria",
      "chandelier installation Lagos",
      "pop lighting electrical setup",
    ],
    deliverables: [
      "Lighting layout planning for ambient, task, and accent zones",
      "Fixture installation and cleaner finishing alignment",
      "Switch grouping and dimming control setup where required",
      "Final checks for alignment, brightness balance, and safety",
    ],
    process: [
      "Define room use and lighting expectations",
      "Plan spacing, switching, and fitting selection",
      "Install fixtures and execute clean final routing",
      "Test brightness zones and hand over control guidance",
    ],
    faqs: [
      {
        question: "Do you support chandelier and feature lighting installation?",
        answer:
          "Yes. Oduzz installs chandeliers, decorative fixtures, and layered lighting systems with finish quality in focus.",
      },
      {
        question: "Can you help fix poor lighting layout from earlier work?",
        answer:
          "Yes. We can review existing layout issues and recommend practical corrections based on access and scope.",
      },
      {
        question: "Do I need lighting planning before POP is completed?",
        answer:
          "Yes. Early planning gives better routing and spacing options, and reduces costly rework later.",
      },
    ],
    relatedCategoryKeys: ["lighting", "switches-sockets", "installation-materials"],
    relatedBlogSlugs: ["lighting-layout-mistakes"],
  },
];

export function getServicePageBySlug(slug: string) {
  const safeSlug = String(slug || "").trim().toLowerCase();
  return servicePages.find((item) => item.slug === safeSlug) ?? null;
}
