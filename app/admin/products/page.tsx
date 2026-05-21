import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductsAdminManager from "@/components/products/ProductsAdminManager";
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
  if (!(await getAdminSession())) {
    redirect(`/admin/login?next=${encodeURIComponent(sanitizeNextPath("/admin/products"))}`);
  }

  return <ProductsAdminManager />;
}
