import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import Container from "@/components/layout/Container";
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
    <section className="section">
      <Container>
        <div className="sectionHeader">
          <div className="kicker">Admin</div>
          <h1 className="h2">Sign in to Product Manager</h1>
          <p className="p">
            This route is protected. Only approved admin accounts can access the product manager.
          </p>
        </div>

        <article className="card productsAdminShell">
          {!isConfigured ? (
            <p className="formStatus error">
              Admin access is not configured. Add `NEXT_PUBLIC_SUPABASE_URL`,
              `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL` or `ADMIN_EMAILS`, and
              `ADMIN_SESSION_SECRET`.
            </p>
          ) : null}

          <AdminLoginForm nextPath={nextPath} isConfigured={isConfigured} />
        </article>
      </Container>
    </section>
  );
}
