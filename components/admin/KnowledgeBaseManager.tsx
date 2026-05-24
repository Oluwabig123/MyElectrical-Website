"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./KnowledgeBaseManager.module.css";

type KnowledgeItem = {
  id: string;
  title: string;
  manufacturer: string | null;
  model: string | null;
  product_type: string;
  source: string | null;
  file_path: string;
  enabled: boolean;
  raw_json: Record<string, unknown> | null;
  last_indexed_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function KnowledgeBaseManager() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [status, setStatus] = useState("");

  async function loadItems() {
    setIsLoading(true);
    const response = await fetch("/api/admin/knowledge-base", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Could not load curated knowledge items.");
    }

    const rows = Array.isArray(payload.items) ? (payload.items as KnowledgeItem[]) : [];
    setItems(rows);
    setSelectedId((current) => current || rows[0]?.id || "");
    setIsLoading(false);
  }

  useEffect(() => {
    void loadItems().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Could not load curated knowledge items.");
      setIsLoading(false);
    });
  }, []);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId]);

  async function reindexAll() {
    setIsWorking(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/knowledge-base", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reindex-all",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not re-index curated knowledge.");
      }

      setStatus(`Re-indexed ${Number(payload.count || 0)} curated knowledge item(s).`);
      await loadItems();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not re-index curated knowledge.");
    } finally {
      setIsWorking(false);
    }
  }

  async function toggleEnabled(item: KnowledgeItem) {
    setIsWorking(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/knowledge-base", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: item.id,
          enabled: !item.enabled,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not update knowledge state.");
      }

      setStatus(`${item.title} is now ${!item.enabled ? "enabled" : "disabled"}.`);
      await loadItems();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update knowledge state.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarCopy}>
          <h3>Curated technical knowledge</h3>
          <p>Structured specs for inverter, battery, panel, cable, and protection decisions.</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn outline" onClick={() => void loadItems()} disabled={isWorking}>
            Refresh
          </button>
          <button type="button" className="btn primary" onClick={() => void reindexAll()} disabled={isWorking}>
            {isWorking ? "Working..." : "Re-index curated KB"}
          </button>
        </div>
      </div>

      {status ? <p className={styles.status}>{status}</p> : null}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Knowledge items</h3>
          {isLoading ? (
            <p className={styles.status}>Loading curated knowledge...</p>
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.itemButton} ${selectedItem?.id === item.id ? styles.itemButtonActive : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className={styles.itemHead}>
                    <strong>{item.title}</strong>
                    <span className={styles.itemBadge}>{item.enabled ? "enabled" : "disabled"}</span>
                  </div>
                  <div className={styles.itemMeta}>
                    {item.product_type} | {[item.manufacturer, item.model].filter(Boolean).join(" ") || "No model yet"}
                  </div>
                  <div className={styles.itemMeta}>{item.file_path}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.panel}>
          <h3 className={styles.panelTitle}>Inspection</h3>
          {selectedItem ? (
            <div className={styles.detailGrid}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Title</span>
                <span className={styles.metaValue}>{selectedItem.title}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Type</span>
                <span className={styles.metaValue}>{selectedItem.product_type}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Manufacturer / model</span>
                <span className={styles.metaValue}>
                  {[selectedItem.manufacturer, selectedItem.model].filter(Boolean).join(" ") || "N/A"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Source</span>
                <span className={styles.metaValue}>{selectedItem.source || "N/A"}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Last indexed</span>
                <span className={styles.metaValue}>{formatDate(selectedItem.last_indexed_at)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Updated</span>
                <span className={styles.metaValue}>{formatDate(selectedItem.updated_at)}</span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => void toggleEnabled(selectedItem)}
                  disabled={isWorking}
                >
                  {selectedItem.enabled ? "Disable item" : "Enable item"}
                </button>
              </div>

              <pre className={styles.jsonPreview}>
                {JSON.stringify(selectedItem.raw_json || {}, null, 2)}
              </pre>
            </div>
          ) : (
            <p className={styles.status}>Select a knowledge item to inspect it.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
