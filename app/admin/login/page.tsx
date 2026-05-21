import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import {
  getAdminSession,
  hasAdminAuthConfig,
  sanitizeNextPath,
} from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase-client";

type PageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Admin Login",
    description: "Protected admin login for Oduzz product management.",
    path: "/admin/login",
    image: "/hero/lightings.webp",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const adminSession = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedNextPath = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams?.next[0] ?? "/admin/products"
    : resolvedSearchParams?.next ?? "/admin/products";
  const nextPath = sanitizeNextPath(requestedNextPath);

  if (adminSession) {
    redirect(nextPath);
  }

  const isConfigured = hasAdminAuthConfig() && isSupabaseConfigured;

  return (
    <article className="card productsAdminShell">
      <AdminLoginForm nextPath={nextPath} isConfigured={isConfigured} />
    </article>
  );
}
