import Link from "next/link";
import { CONTACT_LINKS } from "@/data/contact";

export default function BlogNewsletterCta() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,212,0,0.22)] bg-[linear-gradient(135deg,rgba(255,212,0,0.09)_0%,rgba(46,233,255,0.04)_100%),rgba(12,20,34,0.92)] px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.4)] md:px-10 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-center">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,212,0,0.3)] bg-[rgba(255,212,0,0.1)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ffd400]">
            Oduzz Technical Dispatch
          </div>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white md:text-3xl">
            Practical Notes on Electrical Safety, Lighting &amp; Solar Power
          </h2>
          <p className="text-sm leading-6 text-white/75 md:text-[15px]">
            Direct engineering guidance on verifying authentic Coleman &amp; Nigerchin cables, avoiding fire hotspots, and designing resilient solar backup in Lagos.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={CONTACT_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-6 py-3.5 text-sm font-bold text-[#042410] shadow-[0_4px_16px_rgba(37,211,102,0.3)] transition duration-200 hover:bg-[#2ee672] hover:shadow-[0_8px_24px_rgba(37,211,102,0.4)]"
          >
            Chat with Engineer
          </a>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ffd400] to-[#ffb800] px-6 py-3.5 text-sm font-extrabold text-[#0d1522] shadow-[0_4px_16px_rgba(255,212,0,0.25)] transition duration-200 hover:shadow-[0_6px_20px_rgba(255,212,0,0.35)]"
          >
            Request Project Quote →
          </Link>
        </div>
      </div>
    </section>
  );
}
