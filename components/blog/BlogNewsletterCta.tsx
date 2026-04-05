import Link from "next/link";

export default function BlogNewsletterCta() {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[color:var(--editorial-border)] bg-[var(--editorial-surface)] px-6 py-7 shadow-[0_18px_44px_rgba(11,16,32,0.08)] md:px-8 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c8a300]">
            Newsletter
          </p>
          <h2 className="mt-3 font-[family:var(--font-fraunces)] text-[2rem] leading-[1.02] font-semibold tracking-[-0.045em] text-[var(--editorial-ink)] md:text-[2.35rem]">
            Weekly notes on better lighting, cleaner installations, and safer upgrades.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--editorial-muted)] md:text-[15px]">
            A compact footer CTA styled to sit under the blog board without pulling attention away
            from the story grid.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            className="min-w-0 rounded-full border border-[color:var(--editorial-border)] bg-[#fffdfa] px-5 py-3 text-sm text-[var(--editorial-ink)] outline-none ring-0 placeholder:text-[var(--editorial-muted)] focus:border-[#c8a300] sm:min-w-[260px]"
          />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[var(--editorial-ink)] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#1b2238]"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </section>
  );
}
