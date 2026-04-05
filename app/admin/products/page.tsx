import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductsAdminManager from "@/components/products/ProductsAdminManager";
import Container from "@/components/layout/Container";
import { getAdminSession, sanitizeNextPath } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Admin Products",
    description: "Admin workspace for managing cloud products.",
    path: "/admin/products",
    image: "/hero/lightings.webp",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProductsPage() {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    redirect(`/admin/login?next=${encodeURIComponent(sanitizeNextPath("/admin/products"))}`);
  }

  return (
    <section className="section">
      <Container>
        <div className="sectionHeader">
          <div className="kicker">Admin</div>
          <h1 className="h2">Product Manager</h1>
          <p className="p">
            Signed in as {adminSession.email}. This workspace is reserved for product
            administration.
          </p>
        </div>

        <ProductsAdminManager />
      </Container>
    </section>
  );
}
