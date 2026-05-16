import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { CONTACT } from "@/data/contact";
import { services } from "@/data/services";

export default function ServicesPreview() {
  const flagshipServices = services.filter((service) => service.tier === "flagship");
  const supportServices = services.filter((service) => service.tier === "support");

  return (
    <section className="section servicesPreview">
      <Container>
        <SectionHeader
          kicker="Service hierarchy"
          title="Core installation work first"
          subtitle="Wiring, backup power, and lighting lead. The support systems sit around them."
        />

        <div className="servicesPreviewGrid">
          {flagshipServices.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.04}>
              <article className="card servicesPreviewCard">
                <div className="servicesPreviewCardHead">
                  <span className="servicesPreviewIndex">0{index + 1}</span>
                  <span className="servicesPreviewEyebrow">{service.eyebrow}</span>
                </div>
                <h3 className="cardTitle servicesPreviewTitle">{service.title}</h3>
                <p className="p">{service.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="servicesPreviewSupport">
            <p className="servicesPreviewSupportLabel">Also available</p>
            <div className="servicesPreviewSupportTrack">
              {supportServices.map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="servicesPreviewSupportChip">
                  <span>{service.title}</span>
                  <small>{service.eyebrow}</small>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="servicesPreviewFoot">
            <p className="servicesPreviewNote">
              Quote response: {CONTACT.whatsappResponseTime} on WhatsApp.
            </p>
            <div className="servicesPreviewActions">
              <Link href="/services" className="btn outline">
                View all services
              </Link>
              <Link href="/quote" className="btn primary">
                Request quote
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
