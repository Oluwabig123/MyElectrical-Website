"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ServiceScopeCalculator.module.css";

type ProjectType = "conduit" | "solar" | "cctv" | "automation";

const PROJECT_CONFIGS: Record<
  ProjectType,
  {
    title: string;
    description: string;
    keyDeliverables: string[];
    turnaround: string;
    recommendedMaterials: string;
    defaultScopeService: string;
  }
> = {
  conduit: {
    title: "Conduit & Electrical Wiring",
    description: "New build, duplex, or commercial conduit pipe embedding, wall channelling, and 100% pure copper cable pull-through.",
    keyDeliverables: [
      "Precision wall channelling & flush conduit pipe embedding",
      "Heavy-duty PVC pipes, neat bend routing & durable junction boxes",
      "Original Coleman / Nigerchin certified pure copper cables",
      "Flush distribution board embedding with certified RCCBs & SPDs",
    ],
    turnaround: "Site inspection & conduit scope within 24–48 hours",
    recommendedMaterials: "Certified heavy-duty PVC conduits, Coleman/Nigerchin cables, Schneider/Havells switchgear",
    defaultScopeService: "residential-commercial-wiring",
  },
  solar: {
    title: "Solar & Inverter Backup Power",
    description: "Residential or commercial off-grid/hybrid system engineered for continuous clean electricity and generator reduction.",
    keyDeliverables: [
      "Precision daily watt-hour appliance load calculation",
      "Pure sine wave hybrid inverter with generator & grid auto-switching",
      "Tier-1 LiFePO4 lithium battery storage with BMS active balance",
      "DC isolator switches, surge arresters, and dedicated earthing rods",
    ],
    turnaround: "Engineering proposal & sizing sheet in 24 hours",
    recommendedMaterials: "Tier-1 Monocrystalline panels, Felicity/Deye inverters & LiFePO4 lithium banks",
    defaultScopeService: "solar-inverter-installation",
  },
  cctv: {
    title: "CCTV Installation & Surveillance",
    description: "High-definition IP surveillance with concealed conduit cable pathways, night vision clarity, and remote mobile viewing.",
    keyDeliverables: [
      "Perimeter coverage mapping & zero-blindspot camera placement",
      "Concealed CAT6 ethernet cabling through protective conduits",
      "Network Video Recorder (NVR) with high-endurance 24/7 surveillance storage",
      "Smartphone app setup for instant remote live viewing & motion alerts",
    ],
    turnaround: "Security survey & camera placement quote in 24 hours",
    recommendedMaterials: "Hikvision / Dahua IP cameras, pure copper CAT6 cabling, surge-protected PoE switches",
    defaultScopeService: "cctv-security-systems",
  },
  automation: {
    title: "Smart Home & Office Automation",
    description: "Smart glass-touch switches, mobile app & voice-controlled scenes, biometric door locks, and commercial lighting automation.",
    keyDeliverables: [
      "Luxury capacitive glass-touch switches and multi-room scene controls",
      "Dedicated neutral wire routing for zero-flicker smart switch reliability",
      "Mobile app & voice assistant setup (Alexa, Google Assistant, Apple Home)",
      "Automated lighting schedules, motorized curtain/gate control & smart locks",
    ],
    turnaround: "Automation design & device schedule in 24–48 hours",
    recommendedMaterials: "Tuya / Sonoff / Zigbee 3.0 smart modules, luxury glass-touch switchgear, robust mesh gateways",
    defaultScopeService: "smart-home-systems",
  },
};

const SELECTOR_TYPES: { id: ProjectType; label: string }[] = [
  { id: "conduit", label: "Conduit & Electrical Wiring" },
  { id: "solar", label: "Solar & Inverter Backup" },
  { id: "cctv", label: "CCTV Surveillance" },
  { id: "automation", label: "Smart Home & Office" },
];

export default function ServiceScopeCalculator() {
  const [selectedType, setSelectedType] = useState<ProjectType>("conduit");
  const config = PROJECT_CONFIGS[selectedType];

  return (
    <div className={styles.calculatorShell}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Interactive Scope Estimator</span>
        <h3 className={styles.title}>What type of project are you planning?</h3>
        <p className={styles.subtitle}>
          Select your installation category below to see immediate engineering expectations, turnaround timelines, and recommended components.
        </p>
      </div>

      <div className={styles.typeSelector} role="radiogroup" aria-label="Project type selection">
        {SELECTOR_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selectedType === type.id}
            className={`${styles.typeBtn} ${selectedType === type.id ? styles.activeTypeBtn : ""}`}
            onClick={() => setSelectedType(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className={styles.previewBox}>
        <div className={styles.previewMain}>
          <div className={styles.configHeader}>
            <span className={styles.badge}>Scope Overview</span>
            <h4 className={styles.configTitle}>{config.title}</h4>
            <p className={styles.configDesc}>{config.description}</p>
          </div>

          <div className={styles.deliverablesList}>
            <p className={styles.listHeading}>What Oduzz Prepares:</p>
            <ul>
              {config.keyDeliverables.map((item, idx) => (
                <li key={idx}>
                  <svg
                    className={styles.checkIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.previewSidebar}>
          <div className={styles.sideCard}>
            <span className={styles.sideLabel}>Inspection & Response</span>
            <span className={styles.sideValue}>{config.turnaround}</span>
          </div>

          <div className={styles.sideCard}>
            <span className={styles.sideLabel}>Recommended Materials</span>
            <span className={styles.sideValue}>{config.recommendedMaterials}</span>
          </div>

          <div className={styles.actionBlock}>
            <Link
              href={`/quote?service=${config.defaultScopeService}&type=${selectedType}`}
              className={`btn primary ${styles.calcAction}`}
            >
              Get Custom Quote for this Scope
            </Link>
            <Link href={`/services/${config.defaultScopeService}`} className={styles.calcSubLink}>
              Read technical service page &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
