import type { Metadata } from "next";
import { redirect } from "next/navigation";
import KnowledgeBaseManager from "@/components/admin/KnowledgeBaseManager";
import { getAdminSession, sanitizeNextPath } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Admin Knowledge Base",
    description: "Curated structured knowledge for the Oduzz AI engineering assistant.",
    path: "/admin/knowledge-base",
    image: "/hero/lightings.webp",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminKnowledgeBasePage() {
  if (!(await getAdminSession())) {
    redirect(`/admin/login?next=${encodeURIComponent(sanitizeNextPath("/admin/knowledge-base"))}`);
  }

  return <KnowledgeBaseManager />;
}
