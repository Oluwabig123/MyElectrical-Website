import React, { useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import Button from "../components/ui/Button";
import { CONTACT, CONTACT_LINKS, buildWhatsAppUrl } from "../data/contact.js";

const INITIAL_FORM = {
  name: "",
  phone: "",
  service: "",
  location: "",
  details: "",
};

const SERVICE_OPTIONS = [
  "Residential / commercial wiring",
  "Solar / inverter installation",
  "CCTV / security setup",
  "Smart home systems",
  "Lighting / POP / chandeliers",
  "Fault diagnosis / maintenance",
];

// Basic phone validation keeps the generated WhatsApp message useful.
function isValidPhone(phone) {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function buildWhatsAppText(form) {
  const lines = [
    "Hello Oduzz, I want to request a quote.",
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
    `Service: ${form.service}`,
    `Location: ${form.location}`,
    `Brief: ${form.details || "N/A"}`,
  ];

  return encodeURIComponent(lines.join("\n"));
}

function validateForm(form) {
  const nextErrors = {};

  if (!form.name.trim()) nextErrors.name = "Enter your name.";
  if (!form.phone.trim()) nextErrors.phone = "Enter a phone number.";
  if (form.phone.trim() && !isValidPhone(form.phone)) {
    nextErrors.phone = "Enter a valid phone number (10 to 15 digits).";
  }
  if (!form.service.trim()) nextErrors.service = "Select a service.";
  if (!form.location.trim()) nextErrors.location = "Enter your location.";

  return nextErrors;
}

export default function Quote() {
  // Form state, field errors, and submission feedback all stay local to this page.
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  // Updates fields, normalizes phone input, and clears stale errors/status.
  function onChange(e) {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? value.replace(/[^0-9+() -]/g, "") : value;

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
    setForm(INITIAL_FORM);
    setErrors({});
    setStatus(null);
  }

  // Validates the form and opens WhatsApp with a prefilled quote request.
  function onSubmit(e) {
    e.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: "error",
        text: "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    const waText = buildWhatsAppText(form);
    const waUrl = buildWhatsAppUrl(waText);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setStatus({
      type: "success",
      text: `WhatsApp opened. We usually reply in ${CONTACT.whatsappResponseTime}.`,
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
              <li>Short description of your current setup.</li>
              <li>Preferred date and urgency level.</li>
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
