"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACT } from "@/data/contact";
import styles from "./ContactQuickInquiry.module.css";

const SERVICES = [
  "Residential Conduit Wiring",
  "Solar & Inverter Setup",
  "CCTV Surveillance",
  "Smart Home Automation",
  "Distribution Board Upgrade",
  "Pure Copper Cable Supply",
] as const;

const LOCATIONS = [
  "Ikorodu",
  "Lekki / Ajah / Chevron",
  "Ikeja / Mainland",
  "Ikoyi / Victoria Island",
  "Epe / Ibeju-Lekki",
  "Other Lagos Zone",
] as const;

const STAGES = [
  "Ready for Site Inspection",
  "Require Bill of Quantities (BOQ)",
  "Starting Within 1-2 Weeks",
  "Planning Stage / Inquiry",
] as const;

export default function ContactQuickInquiry() {
  const [selectedService, setSelectedService] = useState<string>(SERVICES[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>(LOCATIONS[0]);
  const [selectedStage, setSelectedStage] = useState<string>(STAGES[0]);
  const [projectNote, setProjectNote] = useState<string>("");

  const buildWhatsAppMessage = () => {
    let msg = `Hello Oduzz Electrical Concept,\n\nI want to consult on an electrical project in Lagos:\n`;
    msg += `• Service: ${selectedService}\n`;
    msg += `• Location: ${selectedLocation}\n`;
    msg += `• Stage: ${selectedStage}\n`;
    if (projectNote.trim()) {
      msg += `• Project Brief: ${projectNote.trim()}\n`;
    }
    msg += `\nPlease let me know your availability for site review or quotation.`;
    return encodeURIComponent(msg);
  };

  const whatsappUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${buildWhatsAppMessage()}`;

  const quoteHref = `/quote?service=${encodeURIComponent(
    selectedService.toLowerCase().includes("solar")
      ? "solar-inverter-installation"
      : selectedService.toLowerCase().includes("cctv")
      ? "cctv-security-systems"
      : selectedService.toLowerCase().includes("smart")
      ? "smart-home-systems"
      : "residential-commercial-wiring"
  )}`;

  return (
    <div className={styles.inquiryCard}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>Quick Scope Builder</span>
        <h3 className={styles.title}>Fast-Track Your Project Consultation</h3>
        <p className={styles.subtitle}>
          Select your service and area in Lagos to dispatch your project specifications directly to our lead engineer.
        </p>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>1. Select Service Type</label>
          <div className={styles.chipGroup}>
            {SERVICES.map((srv) => (
              <button
                key={srv}
                type="button"
                className={`${styles.chip} ${selectedService === srv ? styles.chipActive : ""}`}
                onClick={() => setSelectedService(srv)}
              >
                {srv}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>2. Site Location in Lagos</label>
          <div className={styles.chipGroup}>
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`${styles.chip} ${selectedLocation === loc ? styles.chipActive : ""}`}
                onClick={() => setSelectedLocation(loc)}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>3. Project Stage</label>
          <div className={styles.chipGroup}>
            {STAGES.map((stg) => (
              <button
                key={stg}
                type="button"
                className={`${styles.chip} ${selectedStage === stg ? styles.chipActive : ""}`}
                onClick={() => setSelectedStage(stg)}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="project-notes" className={styles.label}>4. Short Note / Scope Details (Optional)</label>
          <input
            id="project-notes"
            type="text"
            className={styles.input}
            placeholder="e.g. 4-bedroom duplex at decking stage, or 5kVA solar backup"
            value={projectNote}
            onChange={(e) => setProjectNote(e.target.value)}
          />
        </div>

        <div className={styles.actionRow}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.531 1.77.82 2.796.82 3.18 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.251 5.766c-.001 4.017-3.267 7.284-7.282 7.284-1.255 0-2.454-.325-3.513-.935l-3.907 1.025 1.047-3.824c-.7-1.12-1.071-2.42-1.07-3.75 0-4.018 3.267-7.285 7.285-7.285 4.018 0 7.44 3.463 7.44 7.485z" />
            </svg>
            Send Scope Directly to WhatsApp
          </a>

          <Link href={quoteHref} className={styles.quoteLink}>
            Or Request Itemized BOQ Form →
          </Link>
        </div>

        <div className={styles.liveHint}>
          <span className={styles.dot} />
          <span>Typically replies in under 10 minutes during working hours ({CONTACT.businessHours})</span>
        </div>
      </div>
    </div>
  );
}
