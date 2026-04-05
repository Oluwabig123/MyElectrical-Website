import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { CONTACT } from "@/data/contact";
import { services } from "@/data/services";

const FEATURED_SERVICE_SPECS = [
  {
    title: "Residential and Commercial Wiring",
    matches: ["Residential and Commercial Wiring", "Residential & Commercial Wiring"],
  },
  {
    title: "Solar & Inverter Installation",
    matches: ["Solar & Inverter Installation"],
  },
  {
    title: "CCTV & Security Systems",
    matches: ["CCTV & Security Systems"],
  },
] as const;

type FeaturedService = {
  title: string;
  desc: string;
};

export default function ServicesPreview() {
  const featuredServices = FEATURED_SERVICE_SPECS.reduce<FeaturedService[]>((acc, spec) => {
    const service = services.find((item) => spec.matches.some((match) => match === item.title));
    if (!service) return acc;
    acc.push({ title: spec.title, desc: service.desc });
    return acc;
  }, []);

  return (
    <section className="section servicesPreview">
      <Container>
        <SectionHeader
          kicker="Services"
          title="Core electrical services"
          subtitle="Choose what you need, then get a clear quote fast."
        />

        <div className="servicesPreviewGrid">
          {featuredServices.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.04}>
              <article className="card servicesPreviewCard">
                <div className="servicesPreviewCardHead">
                  <span className="servicesPreviewIndex">0{index + 1}</span>
                </div>
                <h3 className="cardTitle servicesPreviewTitle">{service.title}</h3>
                <p className="p">{service.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14}>
          <div className="servicesPreviewFoot">
            <p className="servicesPreviewNote">
              Typical response: {CONTACT.whatsappResponseTime} on WhatsApp ({CONTACT.businessHours}).
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
