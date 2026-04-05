import Link from "next/link";
import Container from "@/components/layout/Container";
import { CONTACT, CONTACT_LINKS } from "@/data/contact";

export default function CTAQuoteStrip() {
  return (
    <section className="ctaStrip">
      <Container>
        <div className="ctaStripInner">
          <div className="ctaCopy">
            <p className="ctaEyebrow">Fast response</p>
            <div className="ctaTitle">Need an electrician?</div>
            <p className="ctaLead">
              Call now or request a quick quote for wiring, solar, CCTV, and lighting.
            </p>
            <p className="ctaMeta">
              Typical WhatsApp response: {CONTACT.whatsappResponseTime} ({CONTACT.businessHours}).
            </p>
          </div>
          <div className="ctaActions">
            <a className="btn outline" href={CONTACT_LINKS.phone}>
              Call
            </a>
            <Link href="/quote" className="btn primary">
              Request Quote
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
