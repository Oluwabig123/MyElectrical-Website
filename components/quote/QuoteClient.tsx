"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/ui/SectionHeader";
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

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

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
        text: "Image uploads need Supabase configuration. You can still send photos manually on WhatsApp.",
      });
      return;
    }

    const existingCount = Array.isArray(form.imageUrls) ? form.imageUrls.length : 0;
    const remainingSlots = MAX_QUOTE_IMAGE_COUNT - existingCount;

    if (remainingSlots <= 0) {
      setStatus({
        type: "error",
        text: `You already added the maximum of ${MAX_QUOTE_IMAGE_COUNT} images.`,
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
      text: `${imageUrls.length} image(s) uploaded. They will be attached to the lead summary.`,
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateQuoteForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: "error",
        text: "Please fix the highlighted fields before submitting.",
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
        ? `WhatsApp opened and the lead was saved. We usually reply in ${CONTACT.whatsappResponseTime}.`
        : `WhatsApp opened. Lead storage is unavailable, but we usually reply in ${CONTACT.whatsappResponseTime}.`,
    });
  }

  return (
    <section className={cn("section", styles.quotePage)}>
      <Container className={styles.container}>
        <SectionHeader
          kicker="Request Quote"
          title="Request a quote"
          subtitle="Share your scope clearly and Oduzz can respond with a faster, more practical next step."
        />

        <div className={styles.layout}>
          <aside className={cn("card", styles.info)} aria-label="Quote preparation tips">
            <div className={styles.infoTitle}>Before you submit</div>
            <p className={styles.infoLead}>
              The better the first brief, the faster the team can move from enquiry to useful
              guidance.
            </p>
            <ul className={styles.checklist}>
              <li>Service type and job location.</li>
              <li>Short description of your current setup or the job scope.</li>
              <li>Urgency level, budget direction, and photos if available.</li>
            </ul>

            <div className={styles.timeline}>
              <p className={styles.timelineTitle}>What happens next</p>
              <ol className={styles.timelineList}>
                <li>Oduzz reviews the brief, photos, and location details.</li>
                <li>You get a practical response path: clarification, rough quote, or site visit.</li>
                <li>Scope and material direction are aligned before execution begins.</li>
              </ol>
            </div>

            <div className={styles.infoPanel}>
              <p className={styles.infoPanelTitle}>Need immediate assistance?</p>
              <p className={styles.infoPanelText}>
                For urgent faults or timing-sensitive jobs, call directly or send a quick WhatsApp
                message with photos.
              </p>
              <div className={styles.infoActions}>
                <a className="btn outline" href={CONTACT_LINKS.phone}>
                  Call
                </a>
                <a
                  className="btn outline"
                  target="_blank"
                  rel="noreferrer"
                  href={CONTACT_LINKS.whatsapp}
                >
                  WhatsApp
                </a>
                <Link href="/contact" className="btn outline">
                  Contact page
                </Link>
              </div>
            </div>
          </aside>

          <form className={cn("form", styles.form)} onSubmit={onSubmit} noValidate>
            <p className="formNote">
              Typical response {CONTACT.whatsappResponseTime} on WhatsApp | {CONTACT.businessHours}
            </p>
            <p className="formNote">Reference: {form.referenceId}</p>

            <label className="field">
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <small className="fieldError">{errors.name}</small> : null}
            </label>

            <label className="field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+234..."
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <small className="fieldError">{errors.phone}</small> : null}
            </label>

            <label className="field">
              <span>Service</span>
              <select
                name="service"
                value={form.service}
                onChange={onChange}
                aria-invalid={Boolean(errors.service)}
              >
                <option value="">Select a service...</option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.service ? <small className="fieldError">{errors.service}</small> : null}
            </label>

            <label className="field">
              <span>Location</span>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="Ikorodu, Lagos..."
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.location)}
              />
              {errors.location ? <small className="fieldError">{errors.location}</small> : null}
            </label>

            <label className="field">
              <span>Brief (optional)</span>
              <textarea
                name="details"
                value={form.details}
                onChange={onChange}
                placeholder="Job details, urgency, and preferred schedule..."
                rows={5}
              />
            </label>

            <label className="field">
              <span>Urgency (optional)</span>
              <select name="urgency" value={form.urgency} onChange={onChange}>
                <option value="">Select urgency...</option>
                {URGENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Budget direction (optional)</span>
              <select name="budget" value={form.budget} onChange={onChange}>
                <option value="">Select budget range...</option>
                {BUDGET_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="field">
              <span>Project photos (optional)</span>
              <label className={cn("assistantUploadButton", styles.uploadButton)}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImageChange}
                  disabled={isUploadingImage}
                />
                {isUploadingImage ? "Uploading..." : "Upload images"}
              </label>
              <small className="fieldHint">
                Up to {MAX_QUOTE_IMAGE_COUNT} images,{" "}
                {Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB each. Stored for human review
                only.
              </small>
              {form.imageUrls?.length ? (
                <small className="fieldHint">
                  {form.imageUrls.length} image(s) attached to this quote.
                </small>
              ) : null}
            </div>

            <div className="formActions">
              <a className="btn outline" href={CONTACT_LINKS.phone}>
                Call
              </a>
              <button type="submit" className="btn primary">
                Request Quote on WhatsApp
              </button>
              <button type="button" className="btn outline" onClick={onClear}>
                Clear
              </button>
            </div>

            {status ? (
              <p className={`formStatus ${status.type}`} role="status" aria-live="polite">
                {status.text}
              </p>
            ) : null}
          </form>
        </div>
      </Container>
    </section>
  );
}
