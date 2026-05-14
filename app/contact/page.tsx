import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import JsonLd from "@/components/seo/JsonLd";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import FaqAccordion from "@/components/ui/FaqAccordion";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { buildFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Contact Oduzz Electrical Concept in Lagos",
  description:
    "Contact Oduzz Electrical Concept for electrical services, product guidance, and project quotes in Lagos, Nigeria.",
  path: "/contact",
  keywords: [
    "contact electrician Lagos",
    "electrical quote Lagos",
    "electrical products contact Nigeria",
    "Oduzz Electrical Concept contact",
  ],
});

const contactFaqs = [
  {
    question: "What details should I send for a faster electrical quote?",
    answer:
      "Send your location, service type, urgency, and clear project photos. If available, include load details and timeline.",
  },
  {
    question: "Can Oduzz support both installation and material guidance?",
    answer:
      "Yes. Oduzz supports installation services and practical guidance on suitable electrical materials for each project.",
  },
  {
    question: "Which locations do you commonly support?",
    answer:
      "Core support is across Lagos, including Ikorodu and wider service requests based on scope and schedule.",
  },
] as const;

export default function ContactPage() {
  const faqSchema = buildFaqSchema([...contactFaqs], {
    id: `${absoluteUrl("/contact")}#faq`,
  });

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${absoluteUrl("/contact")}#contact-page`,
    url: absoluteUrl("/contact"),
    name: "Contact Oduzz Electrical Concept",
    description:
      "Contact page for electrical installation, product guidance, and project quote support in Lagos, Nigeria.",
    mainEntity: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
    },
  };

  return (
    <section className="section seoPage">
      <Container>
        <JsonLd data={[contactPageSchema, faqSchema]} />

        <SectionHeader
          as="h1"
          kicker="Contact"
          title="Talk to Oduzz Electrical Concept about your project"
          subtitle="Reach out for electrical services, verified product guidance, or a quote for residential and commercial work in Lagos, Nigeria."
        />

        <div className="seoCardGrid">
          <Reveal delay={0}>
            <article className="card seoInfoCard">
              <h2 className="cardTitle">Phone</h2>
              <p className="p">Call for service enquiries, product checks, and installation planning.</p>
              <a href={CONTACT_LINKS.phone} className="seoContactLink">
                {CONTACT.phoneDisplay}
              </a>
            </article>
          </Reveal>

          <Reveal delay={0.04}>
            <article className="card seoInfoCard">
              <h2 className="cardTitle">WhatsApp</h2>
              <p className="p">
                Fastest route for sending project photos, product questions, and quote requirements.
              </p>
              <a href={CONTACT_LINKS.whatsapp} className="seoContactLink" target="_blank" rel="noreferrer">
                Chat on WhatsApp
              </a>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="card seoInfoCard">
              <h2 className="cardTitle">Email</h2>
              <p className="p">Use email if you want to send structured project details or follow-up notes.</p>
              <a href={CONTACT_LINKS.email} className="seoContactLink">
                {CONTACT.email}
              </a>
            </article>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="seoContentCard">
            <h2 className="h2">Service area and response window</h2>
            <div className="seoContentGrid">
              <p className="p">
                Oduzz Electrical Concept serves clients across Lagos, Nigeria, with a focus on safe
                installations, authentic materials, and practical project advice.
              </p>
              <p className="p">
                Typical business hours are {CONTACT.businessHours}, and WhatsApp responses usually arrive
                in {CONTACT.whatsappResponseTime}. For faster quoting, include your location, service type,
                and any relevant photos.
              </p>
            </div>
          </div>
        </Reveal>

        <section className="seoContentSection">
          <h2 className="h2">Frequently asked questions</h2>
          <FaqAccordion items={[...contactFaqs]} />
        </section>
      </Container>
    </section>
  );
}
