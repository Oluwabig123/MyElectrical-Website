"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AssistantKnowledgeManager.module.css";

type KnowledgeDocument = {
  id: string;
  title: string;
  category: string | null;
  source_type: string | null;
  source_url: string | null;
  content: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type UploadLimits = {
  maxUploadBytes: number;
  supportedExtensions: string[];
};

const EMPTY_FORM = {
  title: "",
  category: "",
  sourceType: "manual",
  sourceUrl: "",
  content: "",
  replaceExisting: true,
};

const DEFAULT_UPLOAD_LIMITS: UploadLimits = {
  maxUploadBytes: 8 * 1024 * 1024,
  supportedExtensions: [".pdf", ".docx", ".md", ".txt"],
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function AssistantKnowledgeManager() {
  const [items, setItems] = useState<KnowledgeDocument[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>(DEFAULT_UPLOAD_LIMITS);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(b.is_active) - Number(a.is_active)),
    [items],
  );

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);

    const response = await fetch("/api/admin/assistant-knowledge", {
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Could not load knowledge documents.");
    }

    const rows = Array.isArray(payload.items) ? payload.items : [];
    const limits = payload.limits && typeof payload.limits === "object" ? payload.limits : null;

    setItems(rows as KnowledgeDocument[]);

    if (limits) {
      setUploadLimits({
        maxUploadBytes: Number(limits.maxUploadBytes || DEFAULT_UPLOAD_LIMITS.maxUploadBytes),
        supportedExtensions: Array.isArray(limits.supportedExtensions)
          ? limits.supportedExtensions.map((item: unknown) => String(item || "")).filter(Boolean)
          : DEFAULT_UPLOAD_LIMITS.supportedExtensions,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadDocuments().catch((error) => {
      setIsLoading(false);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not load knowledge documents.",
      });
    });
  }, [loadDocuments]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
  }

  function startEdit(item: KnowledgeDocument) {
    setEditingId(item.id);
    setForm({
      title: sanitizeText(item.title),
      category: sanitizeText(item.category),
      sourceType: sanitizeText(item.source_type) || "manual",
      sourceUrl: sanitizeText(item.source_url),
      content: sanitizeText(item.content),
      replaceExisting: true,
    });
    setStatus({ type: "", message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadFile(file: File) {
    if (!file) return;

    setStatus({ type: "", message: "" });

    if (file.size > uploadLimits.maxUploadBytes) {
      setStatus({
        type: "error",
        message: `File is too large. Maximum allowed size is ${formatBytes(uploadLimits.maxUploadBytes)}.`,
      });
      return;
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      if (sanitizeText(form.title)) formData.set("title", form.title);
      if (sanitizeText(form.category)) formData.set("category", form.category);
      if (sanitizeText(form.sourceType)) formData.set("source_type", form.sourceType);
      if (sanitizeText(form.sourceUrl)) formData.set("source_url", form.sourceUrl);
      formData.set("replace_existing", String(form.replaceExisting));

      const response = await fetch("/api/admin/assistant-knowledge", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not upload and ingest this document.");
      }

      setStatus({
        type: "success",
        message: `Upload complete. Added ${file.name}. Chunks: ${Number(payload.chunkCount || 0)}. Deactivated: ${Number(payload.deactivatedCount || 0)}.`,
      });

      resetForm();
      await loadDocuments();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not upload and ingest this document.",
      });
    } finally {
      setIsUploadingFile(false);
      setIsDragActive(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sanitizeText(form.title)) {
      setStatus({ type: "error", message: "Title is required." });
      return;
    }

    if (!sanitizeText(form.content)) {
      setStatus({ type: "error", message: "Content is required." });
      return;
    }

    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/assistant-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category || null,
          source_type: form.sourceType || "manual",
          source_url: form.sourceUrl || null,
          content: form.content,
          replace_existing: form.replaceExisting,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not save the knowledge document.");
      }

      setStatus({
        type: "success",
        message:
          editingId
            ? `Document updated. Previous active versions deactivated: ${Number(payload.deactivatedCount || 0)}.`
            : `Document added. Previous active versions deactivated: ${Number(payload.deactivatedCount || 0)}.`,
      });

      resetForm();
      await loadDocuments();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not save the knowledge document.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(item: KnowledgeDocument) {
    setTogglingId(item.id);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/admin/assistant-knowledge", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: item.id,
          isActive: !item.is_active,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Could not update document status.");
      }

      setStatus({
        type: "success",
        message: `${item.title} is now ${payload.isActive ? "active" : "inactive"}.`,
      });

      await loadDocuments();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not update document status.",
      });
    } finally {
      setTogglingId("");
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    void uploadFile(file);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }

  return (
    <article className="card productsAdminShell">
      <div className="productsAdminHead">
        <div className="productsAdminHeadCopy">
          <h2 className="productsAdminTitle">Assistant Knowledge Manager</h2>
          <p className="productsAdminLead">
            Add or update Oduzz knowledge documents used by the AI assistant.
          </p>
        </div>
        <p className={`productsCloudBadge ${sortedItems.length ? "online" : "offline"}`}>
          {sortedItems.length} documents
        </p>
      </div>

      <div className={styles.uploadPanel}>
        <p className={styles.uploadTitle}>Upload Documents</p>
        <p className={styles.uploadHint}>
          Supports {uploadLimits.supportedExtensions.join(", ")} up to {formatBytes(uploadLimits.maxUploadBytes)}.
          PDF and DOCX text is extracted automatically and ingested.
        </p>

        <div
          className={`${styles.dropZone} ${isDragActive ? styles.dropZoneActive : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
        >
          <p>{isUploadingFile ? "Uploading and ingesting..." : "Drag and drop a file here"}</p>
          <label className={`btn outline ${styles.uploadButton}`}>
            Choose file
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              disabled={isUploadingFile || isSaving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                void uploadFile(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className={styles.layout}>
        <form className={`form ${styles.form}`} onSubmit={onSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Oduzz Electrical Services Guide"
              required
            />
          </label>

          <label className="field">
            <span>Category</span>
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Electrical Services"
            />
          </label>

          <label className="field">
            <span>Source Type</span>
            <input
              value={form.sourceType}
              onChange={(event) => setForm((prev) => ({ ...prev, sourceType: event.target.value }))}
              placeholder="manual"
            />
          </label>

          <label className="field">
            <span>Source URL (optional)</span>
            <input
              value={form.sourceUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>

          <label className="field">
            <span>Knowledge Content</span>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              rows={14}
              placeholder="Paste your business knowledge document here..."
              required
            />
          </label>

          <label className="productsToggleField">
            <input
              type="checkbox"
              checked={form.replaceExisting}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, replaceExisting: event.target.checked }))
              }
            />
            <span>Replace existing active documents with the same title</span>
          </label>

          <div className="formActions">
            <button type="submit" className="btn primary" disabled={isSaving || isUploadingFile}>
              {isSaving ? "Saving..." : editingId ? "Update document" : "Add document"}
            </button>
            <button
              type="button"
              className="btn outline"
              onClick={resetForm}
              disabled={isSaving || isUploadingFile}
            >
              Reset
            </button>
          </div>

          {status.message ? <p className={`formStatus ${status.type}`}>{status.message}</p> : null}
        </form>

        <div className={styles.listWrap}>
          <h3 className="productsAdminListTitle">Existing Documents</h3>

          {isLoading ? <p className="formStatus info">Loading knowledge documents...</p> : null}

          {!isLoading && sortedItems.length === 0 ? (
            <p className="productsAdminEmpty">No knowledge documents found yet.</p>
          ) : null}

          {!isLoading && sortedItems.length > 0 ? (
            <ul className={styles.list}>
              {sortedItems.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <div className={styles.listItemCopy}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className="productsAdminItemMeta">
                      Category: {item.category || "General"} · Type: {item.source_type || "manual"}
                    </p>
                    <p className="productsAdminItemMeta">
                      Updated: {formatDate(item.updated_at)} · {item.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className="btn outline"
                      onClick={() => startEdit(item)}
                      disabled={isSaving || isUploadingFile || Boolean(togglingId)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn outline"
                      onClick={() => void toggleActive(item)}
                      disabled={isSaving || isUploadingFile || togglingId === item.id}
                    >
                      {togglingId === item.id
                        ? "Saving..."
                        : item.is_active
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
