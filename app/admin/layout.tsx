import type { Metadata } from "next";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import Container from "@/components/layout/Container";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminSession = await getAdminSession();

  return (
    <section className="section">
      <Container>
        <AdminWorkspaceShell adminEmail={adminSession?.email ?? null}>
          {children}
        </AdminWorkspaceShell>
      </Container>
    </section>
  );
}
