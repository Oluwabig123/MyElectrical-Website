import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you requested could not be found on Oduzz Electrical Concept.",
};

export default function NotFound() {
  return (
    <main className="py-16 md:py-24">
      <Container>
        <section className="card mx-auto max-w-3xl p-8 md:p-12">
          <span className="kicker">404</span>
          <h1 className="h2 mt-4">Page not found</h1>
          <p className="p mt-4 max-w-2xl">
            The page may have moved, the link may be outdated, or the URL may be incorrect. You can
            return to the homepage or continue to the products catalog.
          </p>
          <div className="seoActionRow mt-8">
            <Link href="/" className="btn primary">
              Back to home
            </Link>
            <Link href="/products" className="btn outline">
              View products
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
