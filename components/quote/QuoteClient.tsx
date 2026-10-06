"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import { CONTACT, CONTACT_LINKS, buildWhatsAppUrl } from "@/data/contact";
import {
  BUDGET_OPTIONS,
  INITIAL_QUOTE_FORM,
  SERVICE_OPTIONS,
  URGENCY_OPTIONS,
  buildQuoteSummary,
  buildQuoteWhatsAppMessage,
  createQuoteReference,
  sanitizePhoneInput,
  validateQuoteForm,
  type QuoteForm,
} from "@/lib/quote-request";
import {
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  canUploadQuoteImages,
  saveQuoteLead,
  uploadQuoteLeadImages,
} from "@/lib/quote-lead-storage";
import styles from "./QuoteClient.module.css";

type QuoteClientProps = {
  initialForm: QuoteForm;
  initialSource: string;
  initialStatusText: string;
  initialStatusType: "success" | "info" | "error" | "";
};

type QuoteStatus = {
  type: "success" | "info" | "error";
  text: string;
} | null;

export default function QuoteClient({
  initialForm,
  initialSource,
  initialStatusText,
  initialStatusType,
}: QuoteClientProps) {
  const [form, setForm] = useState<QuoteForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteForm, string>>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [status, setStatus] = useState<QuoteStatus>(
    initialStatusText && initialStatusType
      ? { type: initialStatusType, text: initialStatusText }
      : null,
  );

  function onChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    const fieldName = name as keyof QuoteForm;
    const nextValue = fieldName === "phone" ? sanitizePhoneInput(value) : value;

    setForm((prev) => ({ ...prev, [fieldName]: nextValue }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }

    if (status) setStatus(null);
  }

  function onClear() {
    setForm({
      ...INITIAL_QUOTE_FORM,
      imageUrls: [],
      referenceId: createQuoteReference(),
    });
    setErrors({});
    setStatus(null);
  }

  async function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (!canUploadQuoteImages()) {
      setStatus({
        type: "error",
        text: "Direct image storage is currently offline. You can still submit the form and send site photos directly on WhatsApp.",
      });
      return;
    }

    const existingCount = Array.isArray(form.imageUrls) ? form.imageUrls.length : 0;
    const remainingSlots = MAX_QUOTE_IMAGE_COUNT - existingCount;

    if (remainingSlots <= 0) {
      setStatus({
        type: "error",
        text: `You have reached the maximum limit of ${MAX_QUOTE_IMAGE_COUNT} images.`,
      });
      return;
    }

    setIsUploadingImage(true);
    const { imageUrls, error } = await uploadQuoteLeadImages({
      files: files.slice(0, remainingSlots),
      referenceId: form.referenceId,
    });
    setIsUploadingImage(false);

    if (error) {
      setStatus({ type: "error", text: error });
      return;
    }

    setForm((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...imageUrls].slice(0, MAX_QUOTE_IMAGE_COUNT),
    }));
    setStatus({
      type: "success",
      text: `${imageUrls.length} image(s) uploaded successfully. Attached to your lead reference.`,
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateQuoteForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: "error",
        text: "Please complete the highlighted fields before submitting.",
      });
      return;
    }

    const source = initialSource || "website";
    const waText = encodeURIComponent(buildQuoteWhatsAppMessage(form, { source }));
    const waUrl = buildWhatsAppUrl(waText);

    const { saved } = await saveQuoteLead({
      form,
      source,
      channel: "quote-page",
      summary: buildQuoteSummary(form),
    });

    window.open(waUrl, "_blank", "noopener,noreferrer");

    setStatus({
      type: "success",
      text: saved
        ? `WhatsApp launched and lead #${form.referenceId} logged. Our lead engineer responds in ${CONTACT.whatsappResponseTime}.`
        : `WhatsApp launched with your project details. We usually respond in ${CONTACT.whatsappResponseTime}.`,
    });
  }

  return (
    <section className={styles.quotePage}>
      <Container>
        <div className={styles.pageShell}>
          {/* Hero Header */}
          <Reveal delay={0.02}>
            <header className={styles.hero}>
              <div className={styles.heroBadges}>
                <span className={styles.heroBrand}>Oduzz Electrical Concept • Fast-Track BOQ</span>
                <span className={styles.heroStatusDot}>
                  <span className={styles.pingDot} /> Live Estimating Active (&lt; 10 mins response)
                </span>
              </div>

              <h1 className={styles.heroTitle}>Request an Itemized Engineering Quote</h1>

              <p className={styles.heroDesc}>
                Share your scope, location, and building stage in Lagos. Our engineering desk provides transparent
                material pricing with 100% verified pure copper cables (Coleman/Nigerchin) and disciplined installation timelines.
              </p>
            </header>
          </Reveal>

          {/* Form and Sidebar Split */}
          <div className={styles.layout}>
            {/* Sidebar Column */}
            <aside className={styles.infoColumn}>
              <Reveal delay={0.04}>
                <div className={styles.infoCard}>
                  <div className={styles.refTag}>
                    <span>Ref: #{form.referenceId}</span>
                  </div>

                  <h2 className={styles.infoTitle}>What You Receive</h2>
                  <p className={styles.infoLead}>
                    A professional, itemized Bill of Quantities (BOQ) with zero hidden markups and genuine materials.
                  </p>

                  <ul className={styles.checklist}>
                    <li className={styles.checklistItem}>
                      <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>100% Pure Copper Guarantee:</strong> Certified Coleman & Nigerchin only (no copper-clad aluminium).</span>
                    </li>
                    <li className={styles.checklistItem}>
                      <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>Transparent Sizing:</strong> Dedicated radial lines for air conditioners, pumps, and inverters.</span>
                    </li>
                    <li className={styles.checklistItem}>
                      <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>Speed:</strong> Lead engineer photo review within {CONTACT.whatsappResponseTime} during working hours.</span>
                    </li>
                  </ul>

                  <div className={styles.timelineBox}>
                    <h3 className={styles.timelineTitle}>Next Steps</h3>
                    <ol className={styles.timelineList}>
                      <li>Lead engineer audits your submitted brief and photos.</li>
                      <li>We confirm project feasibility and send itemized material & labor schedule.</li>
                      <li>Scheduled on-site mobilization across Lagos Mainland or Island.</li>
                    </ol>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div className={styles.urgentBox}>
                  <h3 className={styles.urgentTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Need Urgent Site Dispatch?
                  </h3>
                  <p className={styles.urgentText}>
                    For ongoing site emergencies, breaker tripping faults, or immediate same-day inspections in Lagos:
                  </p>
                  <div className={styles.urgentActions}>
                    <a href={CONTACT_LINKS.phone} className={`${styles.urgentBtn} ${styles.urgentBtnPhone}`}>
                      Call {CONTACT.phoneDisplay}
                    </a>
                    <a
                      href={CONTACT_LINKS.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.urgentBtn} ${styles.urgentBtnWa}`}
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </Reveal>
            </aside>

            {/* Interactive Form Column */}
            <Reveal delay={0.06}>
              <form className={styles.formCard} onSubmit={onSubmit} noValidate>
                {/* Section 1: Contact Details */}
                <div className={styles.formSectionHeader}>
                  <h2 className={styles.formSectionTitle}>1. Client Contact Information</h2>
                  <p className={styles.formSectionHint}>Where should we deliver your estimate and project updates?</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="quote-name" className={styles.label}>Full Name *</label>
                    <input
                      id="quote-name"
                      name="name"
                      className={styles.input}
                      value={form.name}
                      onChange={onChange}
                      placeholder="e.g. Babatunde Adeleke"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="quote-phone" className={styles.label}>Phone Number (WhatsApp) *</label>
                    <input
                      id="quote-phone"
                      type="tel"
                      name="phone"
                      className={styles.input}
                      value={form.phone}
                      onChange={onChange}
                      placeholder="e.g. 08012345678"
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone ? <span className={styles.fieldError}>{errors.phone}</span> : null}
                  </div>
                </div>

                {/* Section 2: Project Specifications */}
                <div className={styles.formSectionHeader}>
                  <h2 className={styles.formSectionTitle}>2. Project Scope & Location</h2>
                  <p className={styles.formSectionHint}>Specify the primary service and your area in Lagos.</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="quote-service" className={styles.label}>Service Type *</label>
                    <select
                      id="quote-service"
                      name="service"
                      className={styles.select}
                      value={form.service}
                      onChange={onChange}
                      aria-invalid={Boolean(errors.service)}
                    >
                      <option value="">Select a service category...</option>
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.service ? <span className={styles.fieldError}>{errors.service}</span> : null}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="quote-location" className={styles.label}>Project Location in Lagos *</label>
                    <input
                      id="quote-location"
                      name="location"
                      className={styles.input}
                      value={form.location}
                      onChange={onChange}
                      placeholder="e.g. Lekki Phase 1, Ikorodu, Ikeja GRA..."
                      autoComplete="address-level2"
                      aria-invalid={Boolean(errors.location)}
                    />
                    {errors.location ? <span className={styles.fieldError}>{errors.location}</span> : null}
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label htmlFor="quote-details" className={styles.label}>Project Details & Scope Notes (Optional)</label>
                    <textarea
                      id="quote-details"
                      name="details"
                      className={styles.textarea}
                      value={form.details}
                      onChange={onChange}
                      placeholder="Describe your building type (e.g. 4-bedroom duplex at decking stage), key appliances (inverter ACs, pumps), or materials required..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Section 3: Timeline & Budget */}
                <div className={styles.formSectionHeader}>
                  <h2 className={styles.formSectionTitle}>3. Project Timeline & Budget</h2>
                  <p className={styles.formSectionHint}>Helps our engineering desk prioritize mobilization scheduling.</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="quote-urgency" className={styles.label}>Urgency Level (Optional)</label>
                    <select
                      id="quote-urgency"
                      name="urgency"
                      className={styles.select}
                      value={form.urgency}
                      onChange={onChange}
                    >
                      <option value="">Select urgency level...</option>
                      {URGENCY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="quote-budget" className={styles.label}>Budget Range (Optional)</label>
                    <select
                      id="quote-budget"
                      name="budget"
                      className={styles.select}
                      value={form.budget}
                      onChange={onChange}
                    >
                      <option value="">Select approximate budget...</option>
                      {BUDGET_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label}>Project Photos or Architectural Drawings (Optional)</label>
                    <div className={styles.uploadWrapper}>
                      <label className={styles.uploadButton}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>{isUploadingImage ? "Uploading Photos..." : "Attach Site Photos / Drawings"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={onImageChange}
                          disabled={isUploadingImage}
                        />
                      </label>
                      <span className={styles.fieldHint}>
                        Up to {MAX_QUOTE_IMAGE_COUNT} images ({Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB max each). You can also send photos directly on WhatsApp.
                      </span>
                      {form.imageUrls?.length ? (
                        <span className={styles.fieldHint} style={{ color: "#4ade80", fontWeight: 700 }}>
                          ✓ {form.imageUrls.length} image(s) attached to this quote request.
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnSubmit}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.97.531 1.77.82 2.796.82 3.18 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.251 5.766c-.001 4.017-3.267 7.284-7.282 7.284-1.255 0-2.454-.325-3.513-.935l-3.907 1.025 1.047-3.824c-.7-1.12-1.071-2.42-1.07-3.75 0-4.018 3.267-7.285 7.285-7.285 4.018 0 7.44 3.463 7.44 7.485z" />
                    </svg>
                    Submit Scope to WhatsApp
                  </button>

                  <a href={CONTACT_LINKS.phone} className={styles.btnCall}>
                    Call Directly
                  </a>

                  <button type="button" className={styles.btnClear} onClick={onClear}>
                    Reset Form
                  </button>
                </div>

                {status ? (
                  <div
                    className={`${styles.statusBanner} ${
                      status.type === "success"
                        ? styles.statusSuccess
                        : status.type === "error"
                        ? styles.statusError
                        : styles.statusInfo
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {status.text}
                  </div>
                ) : null}
              </form>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
