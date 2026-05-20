import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AssistantKnowledgeManager from "@/components/admin/AssistantKnowledgeManager";
import Container from "@/components/layout/Container";
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
  const adminSession = await getAdminSession();

  if (!adminSession) {
    redirect(
      `/admin/login?next=${encodeURIComponent(sanitizeNextPath("/admin/assistant-knowledge"))}`,
    );
  }

  return (
    <section className="section">
      <Container>
        <div className="sectionHeader">
          <div className="kicker">Admin</div>
          <h1 className="h2">Assistant Knowledge</h1>
          <p className="p">
            Signed in as {adminSession.email}. Manage business documents that power assistant
            responses.
          </p>
          <div className="chips">
            <Link className="chip" href="/admin/products">
              Open Product Manager
            </Link>
          </div>
        </div>

        <AssistantKnowledgeManager />
      </Container>
    </section>
  );
}
