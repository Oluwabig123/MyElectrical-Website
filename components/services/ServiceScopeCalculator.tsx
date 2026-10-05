"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ServiceScopeCalculator.module.css";

type ProjectType = "residential" | "commercial" | "solar" | "maintenance";

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
  residential: {
    title: "Residential Wiring & Finishing",
    description: "New duplex, apartment wiring, load balancing, or clean rewiring upgrade.",
    keyDeliverables: [
      "Circuit load calculations & phase balancing",
      "Conduit pipe embedding & neat junction boxes",
      "Protection boards with certified RCCBs & SPDs",
      "Wall switches, sockets & architectural lighting finishing",
    ],
    turnaround: "Site inspection within 24–48 hours",
    recommendedMaterials: "Original Coleman/Nigerchin cables, Havells/Schneider switchgear",
    defaultScopeService: "residential-commercial-wiring",
  },
  commercial: {
    title: "Commercial & Office Fit-Out",
    description: "Multi-tenant offices, retail fit-outs, industrial distribution panels, and power plants.",
    keyDeliverables: [
      "Sub-distribution boards with lockouts & surge suppression",
      "Dedicated server & UPS clean-line circuits",
      "Emergency lighting pathways and exit compliance",
      "Phased wiring execution to minimize tenant disruption",
    ],
    turnaround: "Initial schematics & BOQ within 48 hours",
    recommendedMaterials: "Heavy-duty armored cables, industrial MCCBs, dedicated grounding grids",
    defaultScopeService: "residential-commercial-wiring",
  },
  solar: {
    title: "Solar & Inverter Backup Power",
    description: "Residential or commercial off-grid/hybrid system sized to real daily power logs.",
    keyDeliverables: [
      "Precision load logging (Daytime vs Nighttime watt-hour audits)",
      "Pure sine wave hybrid inverter with generator tie-in",
      "Tier-1 LiFePO4 battery storage with BMS safety checks",
      "DC isolator switches, surge arresters, and dedicated earthing",
    ],
    turnaround: "Engineering proposal & sizing sheet in 24 hours",
    recommendedMaterials: "Tier-1 Monocrystalline panels, Felicity/Deye inverters & lithium banks",
    defaultScopeService: "solar-inverter-installation",
  },
  maintenance: {
    title: "Diagnostics & Safety Rectification",
    description: "Tripping breakers, recurring voltage drops, burnt neutral repairs, and safety audits.",
    keyDeliverables: [
      "Insulation resistance testing & loop impedance checks",
      "Thermal inspection to isolate high-resistance hot joints",
      "Immediate stabilization of burnt terminals and overdrawn lines",
      "Written inspection diagnosis with recommended fixes",
    ],
    turnaround: "Same-day emergency or next-day scheduled dispatch",
    recommendedMaterials: "Din-rail replacements, certified busbars, calibrated thermal breakers",
    defaultScopeService: "fault-diagnosis-maintenance",
  },
};

export default function ServiceScopeCalculator() {
  const [selectedType, setSelectedType] = useState<ProjectType>("residential");
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
        {(
          [
            { id: "residential", label: "Residential Home / Duplex" },
            { id: "solar", label: "Solar & Inverter Backup" },
            { id: "commercial", label: "Commercial / Office" },
            { id: "maintenance", label: "Fault Diagnosis / Audit" },
          ] as const
        ).map((type) => (
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
