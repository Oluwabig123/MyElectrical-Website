"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./AdminWorkspaceShell.module.css";
import { supabase } from "@/lib/supabase-client";

type AdminWorkspaceShellProps = {
  children: React.ReactNode;
  adminEmail: string | null;
};

const NAV_ITEMS = [
  {
    href: "/admin/products",
    label: "Products",
    description: "Catalog, pricing, media",
  },
  {
    href: "/admin/assistant-knowledge",
    label: "Assistant Knowledge",
    description: "Docs, ingestion, retrieval",
  },
];

function getPageCopy(pathname: string) {
  if (pathname.startsWith("/admin/assistant-knowledge")) {
    return {
      eyebrow: "Knowledge Ops",
      title: "Assistant knowledge workspace",
      description:
        "Ingest files, refine documents, and keep the assistant grounded with cleaner source material.",
    };
  }

  if (pathname.startsWith("/admin/login")) {
    return {
      eyebrow: "Secure Access",
      title: "Admin workspace sign-in",
      description:
        "Use an approved Oduzz admin account to access product and assistant operations.",
    };
  }

  return {
    eyebrow: "Catalog Ops",
    title: "Product administration workspace",
    description:
      "Manage the live product catalog, keep pricing current, and control what customers see.",
  };
}

export default function AdminWorkspaceShell({
  children,
  adminEmail,
}: AdminWorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageCopy = useMemo(() => getPageCopy(pathname), [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);

    const tasks: Promise<unknown>[] = [fetch("/api/admin/logout", { method: "POST" })];
    if (supabase) {
      tasks.push(supabase.auth.signOut());
    }

    await Promise.allSettled(tasks);
    router.replace("/admin/login");
    router.refresh();
    setIsLoggingOut(false);
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.brandBlock}>
          <p className={styles.brandEyebrow}>Oduzz Admin</p>
          <h1 className={styles.brandTitle}>One workspace for catalog and assistant operations.</h1>
        </div>

        <div className={styles.userBlock}>
          <div className={styles.userBadge}>
            <span className={styles.userBadgeLabel}>Session</span>
            <strong>{adminEmail || "Signed out"}</strong>
          </div>

          {adminEmail ? (
            <button
              type="button"
              className="btn outline"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          ) : (
            <Link className="btn outline" href="/admin/login">
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className={styles.navRow} aria-label="Admin sections">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navCard} ${isActive ? styles.navCardActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navDescription}>{item.description}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.pageIntro}>
        <div>
          <p className={styles.pageEyebrow}>{pageCopy.eyebrow}</p>
          <h2 className={styles.pageTitle}>{pageCopy.title}</h2>
        </div>
        <p className={styles.pageLead}>{pageCopy.description}</p>
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
