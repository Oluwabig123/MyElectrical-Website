import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AssistantKnowledgeManager from "@/components/admin/AssistantKnowledgeManager";
import { getAdminSession, sanitizeNextPath } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Admin Assistant Knowledge",
    description: "Admin workspace for managing assistant knowledge documents.",
    path: "/admin/assistant-knowledge",
    image: "/hero/lightings.webp",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAssistantKnowledgePage() {
  if (!(await getAdminSession())) {
    redirect(
      `/admin/login?next=${encodeURIComponent(sanitizeNextPath("/admin/assistant-knowledge"))}`,
    );
  }

  return <AssistantKnowledgeManager />;
}
