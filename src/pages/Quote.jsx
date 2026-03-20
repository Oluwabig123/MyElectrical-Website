import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import Button from "../components/ui/Button";
import { CONTACT, CONTACT_LINKS, buildWhatsAppUrl } from "../data/contact.js";
import {
  BUDGET_OPTIONS,
  buildQuoteSummary,
  buildQuoteWhatsAppMessage,
  createQuoteReference,
  INITIAL_QUOTE_FORM,
  readQuotePrefill,
  sanitizePhoneInput,
  SERVICE_OPTIONS,
  URGENCY_OPTIONS,
  validateQuoteForm,
} from "../lib/quoteRequest.js";
import {
  canUploadQuoteImages,
  MAX_QUOTE_IMAGE_COUNT,
  MAX_QUOTE_IMAGE_SIZE_BYTES,
  saveQuoteLead,
  uploadQuoteLeadImages,
} from "../lib/quoteLeadStorage.js";

export default function Quote() {
  const location = useLocation();
  const prefill = useMemo(() => readQuotePrefill(location.search), [location.search]);
  const hasPrefill = Object.values(prefill.form).some((value) => String(value || "").trim());
  // Form state, field errors, and submission feedback all stay local to this page.
  const [form, setForm] = useState(() => ({
    ...INITIAL_QUOTE_FORM,
    imageUrls: [],
    referenceId: prefill.form.referenceId || createQuoteReference(),
    ...prefill.form,
  }));
  const [errors, setErrors] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [status, setStatus] = useState(() =>
    hasPrefill
      ? {
          type: "success",
          text:
            prefill.source === "assistant"
              ? "Assistant details loaded. Review and send when ready."
              : "Quote details loaded. Review and send when ready.",
        }
      : null
  );

  // Updates fields, normalizes phone input, and clears stale errors/status.
  function onChange(e) {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? sanitizePhoneInput(value) : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (status) setStatus(null);
  }

  // Clears the form back to its initial blank state.
  function onClear() {
    setForm({
      ...INITIAL_QUOTE_FORM,
      imageUrls: [],
      referenceId: createQuoteReference(),
    });
    setErrors({});
    setStatus(null);
  }

  async function onImageChange(event) {
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

  // Validates the form and opens WhatsApp with a prefilled quote request.
  async function onSubmit(e) {
    e.preventDefault();
    const nextErrors = validateQuoteForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: "error",
        text: "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    const waText = encodeURIComponent(buildQuoteWhatsAppMessage(form));
    const waUrl = buildWhatsAppUrl(waText);

    const { saved } = await saveQuoteLead({
      form,
      source: prefill.source || "website",
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
    <section className="section quotePage">
      <Container>
        <SectionHeader
          kicker="Request Quote"
          title="Request a quote"
          subtitle="Share your job details for a quick estimate and schedule."
        />

        {/* Two-column layout: prep tips on the left, guided quote form on the right. */}
        <div className="quoteLayout">
          <aside className="card quoteInfo" aria-label="Quote preparation tips">
            <div className="quoteInfoTitle">Before you submit</div>
            <p className="quoteInfoLead">Include enough details so we can estimate faster.</p>
            <ul className="quoteChecklist">
              <li>Service type and job location.</li>
              <li>Short description of your current setup or the job scope.</li>
              <li>Urgency level, budget direction, and photos if available.</li>
            </ul>

            <div className="quoteInfoPanel">
              <p className="quoteInfoPanelTitle">Need immediate assistance?</p>
              <div className="quoteInfoActions">
                <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
                <a className="btn outline" target="_blank" rel="noreferrer" href={CONTACT_LINKS.whatsapp}>
                  WhatsApp
                </a>
                <Link to="/contact"><Button variant="outline">Contact page</Button></Link>
              </div>
            </div>
          </aside>

          {/* Quote request form that forwards the details into WhatsApp. */}
          <form className="form quoteForm" onSubmit={onSubmit} noValidate>
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
                  <option key={option} value={option}>{option}</option>
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
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Budget direction (optional)</span>
              <select name="budget" value={form.budget} onChange={onChange}>
                <option value="">Select budget range...</option>
                {BUDGET_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <div className="field">
              <span>Project photos (optional)</span>
              <label className="assistantUploadButton quoteUploadButton">
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
                Up to {MAX_QUOTE_IMAGE_COUNT} images, {Math.round(MAX_QUOTE_IMAGE_SIZE_BYTES / 1048576)}MB each. Stored for human review only.
              </small>
              {form.imageUrls?.length ? (
                <small className="fieldHint">{form.imageUrls.length} image(s) attached to this quote.</small>
              ) : null}
            </div>

            <div className="formActions">
              <a className="btn outline" href={CONTACT_LINKS.phone}>Call</a>
              <Button type="submit" variant="primary">Request Quote on WhatsApp</Button>
              <Button type="button" variant="outline" onClick={onClear}>Clear</Button>
            </div>

            {status ? (
              <p className={`formStatus ${status.type}`} role="status" aria-live="polite">{status.text}</p>
            ) : null}
          </form>
        </div>
      </Container>
    </section>
  );
}
