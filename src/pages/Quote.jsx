import React, { useState } from "react";
import Container from "../components/layout/Container";
import SectionHeader from "../components/ui/SectionHeader";
import Button from "../components/ui/Button";

export default function Quote() {
  const [form, setForm] = useState({ name: "", phone: "", service: "", location: "", details: "" });

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const waText = encodeURIComponent(
    `Hello Oduzz, I want a quote.%0AName: ${form.name}%0APhone: ${form.phone}%0AService: ${form.service}%0ALocation: ${form.location}%0ADetails: ${form.details}`
  );

  return (
    <section className="section">
      <Container>
        <SectionHeader
          kicker="Request Quote"
          title="Get a professional quote"
          subtitle="Pricing depends on project size. Send details and we’ll respond quickly."
        />

        <div className="form">
          <label className="field">
            <span>Name</span>
            <input name="name" value={form.name} onChange={onChange} placeholder="Your name" />
          </label>

          <label className="field">
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={onChange} placeholder="070..." />
          </label>

          <label className="field">
            <span>Service</span>
            <input name="service" value={form.service} onChange={onChange} placeholder="Solar / Wiring / CCTV / Lighting..." />
          </label>

          <label className="field">
            <span>Location</span>
            <input name="location" value={form.location} onChange={onChange} placeholder="Ikorodu, Lagos..." />
          </label>

          <label className="field">
            <span>Details</span>
            <textarea name="details" value={form.details} onChange={onChange} placeholder="Describe the job..." rows={5} />
          </label>

          <div className="formActions">
            <a className="btn outline" href="tel:+2347032258039">Call</a>
            <a className="btn primary" target="_blank" rel="noreferrer" href={`https://wa.me/2347032258039?text=${waText}`}>
              Send via WhatsApp
            </a>
            <Button
              variant="outline"
              onClick={() => setForm({ name: "", phone: "", service: "", location: "", details: "" })}
            >
              Clear
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
