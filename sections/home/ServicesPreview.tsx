import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { CONTACT } from "@/data/contact";
import { services } from "@/data/services";

export default function ServicesPreview() {
  const flagshipServices = services.filter((service) => service.tier === "flagship");
  const supportServices = services.filter((service) => service.tier === "support");
  const leadService = flagshipServices[0];
  const secondaryServices = flagshipServices.slice(1);

  return (
    <section className="section servicesPreview">
      <Container>
        <SectionHeader
          kicker="Service hierarchy"
          title="Core installation work first"
          subtitle="Wiring, backup power, and lighting lead. The support systems sit around them."
        />

        <div className="servicesPreviewStage">
          {leadService ? (
            <Reveal delay={0.03}>
              <article className="servicesPreviewLead">
                <div className="servicesPreviewLeadMedia">
                  <Image
                    src={leadService.image}
                    alt={leadService.alt}
                    fill
                    sizes="(max-width: 980px) 100vw, 46vw"
                    className="servicesPreviewLeadImage"
                  />
                </div>
                <div className="servicesPreviewLeadBody">
                  <div className="servicesPreviewCardHead">
                    <span className="servicesPreviewIndex">01</span>
                    <span className="servicesPreviewEyebrow">{leadService.eyebrow}</span>
                  </div>
                  <h3 className="servicesPreviewLeadTitle">{leadService.title}</h3>
                  <p className="p">{leadService.detail}</p>
                  <div className="servicesPreviewLeadActions">
                    <Link href={`/services/${leadService.slug}`} className="btn primary">
                      Explore service
                    </Link>
                    <Link href="/quote" className="btn outline">
                      Start quote
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ) : null}

          <div className="servicesPreviewRail">
            {secondaryServices.map((service, index) => (
              <Reveal key={service.title} delay={0.08 + index * 0.05}>
                <article className="servicesPreviewRailItem">
                  <div className="servicesPreviewCardHead">
                    <span className="servicesPreviewIndex">0{index + 2}</span>
                    <span className="servicesPreviewEyebrow">{service.eyebrow}</span>
                  </div>
                  <div className="servicesPreviewRailCopy">
                    <h3 className="servicesPreviewTitle">{service.title}</h3>
                    <p className="p">{service.detail}</p>
                  </div>
                  <Link href={`/services/${service.slug}`} className="servicesPreviewRailLink">
                    View service
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
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
