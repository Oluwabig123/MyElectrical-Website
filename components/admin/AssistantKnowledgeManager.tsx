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

type StatusFilter = "all" | "active" | "inactive";

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

function formatCount(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

function getPreviewText(value: string | null, limit = 180) {
  const normalized = sanitizeText(value).replace(/\s+/g, " ");
  if (!normalized) return "No extracted content preview yet.";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trimEnd()}...`;
}

export default function AssistantKnowledgeManager() {
  const [items, setItems] = useState<KnowledgeDocument[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>(DEFAULT_UPLOAD_LIMITS);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const activeSort = Number(b.is_active) - Number(a.is_active);
      if (activeSort !== 0) return activeSort;

      const updatedA = new Date(a.updated_at || a.created_at || 0).getTime();
      const updatedB = new Date(b.updated_at || b.created_at || 0).getTime();
      return updatedB - updatedA;
    });
  }, [items]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const item of sortedItems) {
      seen.add(sanitizeText(item.category) || "General");
    }

    return ["all", ...Array.from(seen)];
  }, [sortedItems]);

  const filteredItems = useMemo(() => {
    const query = sanitizeText(searchValue).toLowerCase();

    return sortedItems.filter((item) => {
      const category = sanitizeText(item.category) || "General";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active) ||
        (statusFilter === "inactive" && !item.is_active);
      const matchesCategory = categoryFilter === "all" || category === categoryFilter;
      const haystack = [
        item.title,
        item.category,
        item.source_type,
        item.source_url,
        getPreviewText(item.content, 260),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, searchValue, sortedItems, statusFilter]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;
  }, [filteredItems, selectedId]);

  const metrics = useMemo(() => {
    const activeCount = items.filter((item) => item.is_active).length;
    const inactiveCount = items.length - activeCount;
    const sourcedCount = items.filter((item) => sanitizeText(item.source_url)).length;

    return [
      {
        label: "Documents",
        value: formatCount(items.length),
        hint: "Total records currently available to the admin workspace.",
      },
      {
        label: "Active",
        value: formatCount(activeCount),
        hint: "Documents available to the live assistant retrieval flow.",
      },
      {
        label: "Inactive",
        value: formatCount(inactiveCount),
        hint: "Retained for history, but not used in live retrieval.",
      },
      {
        label: "With source links",
        value: formatCount(sourcedCount),
        hint: "Documents carrying an external source reference.",
      },
    ];
  }, [items]);

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

  useEffect(() => {
    if (filteredItems.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }

    if (!filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0]?.id || "");
    }
  }, [filteredItems, selectedId]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
  }

  function startEdit(item: KnowledgeDocument) {
    setEditingId(item.id);
    setSelectedId(item.id);
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
        message: `Upload complete for ${file.name}. Added ${Number(payload.chunkCount || 0)} chunk(s) and deactivated ${Number(payload.deactivatedCount || 0)} older match(es).`,
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
        message: editingId
          ? `Document updated. ${Number(payload.deactivatedCount || 0)} previous active version(s) were retired.`
          : `Document added. ${Number(payload.deactivatedCount || 0)} previous active version(s) were retired.`,
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
            Upload, refine, and review the documents that shape live assistant responses.
          </p>
        </div>
        <p className={`productsCloudBadge ${sortedItems.length ? "online" : "offline"}`}>
          {filteredItems.length} of {sortedItems.length} visible
        </p>
      </div>

      <div className={styles.metricStrip}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={styles.metricHint}>{metric.hint}</p>
          </div>
        ))}
      </div>

      {status.message ? <p className={`formStatus ${status.type}`}>{status.message}</p> : null}

      <div className={styles.workspace}>
        <div className={styles.composeColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>Upload / ingest</p>
                <h3 className={styles.panelTitle}>Bring in source files quickly.</h3>
              </div>
              <p className={styles.panelNote}>
                Supports {uploadLimits.supportedExtensions.join(", ")} up to{" "}
                {formatBytes(uploadLimits.maxUploadBytes)}.
              </p>
            </div>

            <div className={styles.uploadPanel}>
              <p className={styles.uploadHint}>
                PDF and DOCX text is extracted automatically and ingested into the knowledge base.
                If you set a matching title, older active versions can be retired in one step.
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
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>Manual edit / update</p>
                <h3 className={styles.panelTitle}>
                  {editingId ? "Update the selected document." : "Create or paste a document."}
                </h3>
              </div>
              <p className={styles.panelNote}>
                {editingId
                  ? "You are editing an existing record. Save to publish the new version."
                  : "Use this when you want to author or refine content directly in the admin."}
              </p>
            </div>

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

              <div className={styles.formGrid}>
                <label className="field">
                  <span>Category</span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    placeholder="Electrical Services"
                  />
                </label>

                <label className="field">
                  <span>Source Type</span>
                  <input
                    value={form.sourceType}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, sourceType: event.target.value }))
                    }
                    placeholder="manual"
                  />
                </label>
              </div>

              <label className="field">
                <span>Source URL (optional)</span>
                <input
                  value={form.sourceUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="field">
                <span>Knowledge Content</span>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  rows={15}
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

              <div className={`formActions ${styles.formActions}`}>
                <button type="submit" className="btn primary" disabled={isSaving || isUploadingFile}>
                  {isSaving ? "Saving..." : editingId ? "Update document" : "Add document"}
                </button>
                <button
                  type="button"
                  className="btn outline"
                  onClick={resetForm}
                  disabled={isSaving || isUploadingFile}
                >
                  {editingId ? "Cancel edit" : "Reset form"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelEyebrow}>Document library</p>
              <h3 className={styles.panelTitle}>Scan, filter, and inspect knowledge records.</h3>
            </div>
            <p className={styles.panelNote}>
              Search by title, source, or content preview, then open any item for a fuller look.
            </p>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <span>Search</span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search title, category, source, or content..."
              />
            </label>

            <label className={styles.filterField}>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">All documents</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </label>

            <label className={styles.filterField}>
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {categoryOptions
                  .filter((item) => item !== "all")
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {isLoading ? <p className="formStatus info">Loading knowledge documents...</p> : null}

          {!isLoading && filteredItems.length === 0 ? (
            <p className="productsAdminEmpty">
              {sortedItems.length === 0
                ? "No knowledge documents found yet."
                : "No documents match the current filters."}
            </p>
          ) : null}

          {!isLoading && filteredItems.length > 0 ? (
            <div className={styles.libraryGrid}>
              <ul className={styles.list}>
                {filteredItems.map((item) => {
                  const itemCategory = sanitizeText(item.category) || "General";
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <li
                      key={item.id}
                      className={`${styles.listItem} ${isSelected ? styles.listItemActive : ""}`}
                    >
                      <button
                        type="button"
                        className={styles.listButton}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div className={styles.listItemCopy}>
                          <div className={styles.itemTitleRow}>
                            <p className={styles.itemTitle}>{item.title}</p>
                            <span
                              className={`${styles.statusPill} ${
                                item.is_active ? styles.statusPillActive : styles.statusPillInactive
                              }`}
                            >
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className={styles.tagRow}>
                            <span className={styles.tag}>{itemCategory}</span>
                            <span className={styles.tagMuted}>{item.source_type || "manual"}</span>
                            {item.source_url ? (
                              <span className={styles.tagMuted}>Linked source</span>
                            ) : null}
                          </div>

                          <p className={styles.previewSnippet}>{getPreviewText(item.content, 140)}</p>
                          <p className="productsAdminItemMeta">Updated {formatDate(item.updated_at)}</p>
                        </div>
                      </button>

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
                  );
                })}
              </ul>

              {selectedItem ? (
                <aside className={styles.previewPanel}>
                  <div className={styles.previewHead}>
                    <div>
                      <p className={styles.previewLabel}>Selected document</p>
                      <h4 className={styles.previewTitle}>{selectedItem.title}</h4>
                    </div>
                    <span
                      className={`${styles.statusPill} ${
                        selectedItem.is_active ? styles.statusPillActive : styles.statusPillInactive
                      }`}
                    >
                      {selectedItem.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className={styles.previewMetaGrid}>
                    <div className={styles.previewMetaCard}>
                      <span className={styles.previewMetaLabel}>Category</span>
                      <strong>{sanitizeText(selectedItem.category) || "General"}</strong>
                    </div>
                    <div className={styles.previewMetaCard}>
                      <span className={styles.previewMetaLabel}>Source type</span>
                      <strong>{selectedItem.source_type || "manual"}</strong>
                    </div>
                    <div className={styles.previewMetaCard}>
                      <span className={styles.previewMetaLabel}>Created</span>
                      <strong>{formatDate(selectedItem.created_at)}</strong>
                    </div>
                    <div className={styles.previewMetaCard}>
                      <span className={styles.previewMetaLabel}>Updated</span>
                      <strong>{formatDate(selectedItem.updated_at)}</strong>
                    </div>
                  </div>

                  <div className={styles.previewSource}>
                    <p className={styles.previewLabel}>Source reference</p>
                    {selectedItem.source_url ? (
                      <a href={selectedItem.source_url} target="_blank" rel="noreferrer">
                        {selectedItem.source_url}
                      </a>
                    ) : (
                      <p className={styles.previewSourceFallback}>
                        No source URL stored for this document.
                      </p>
                    )}
                  </div>

                  <div className={styles.previewBody}>
                    <p className={styles.previewLabel}>Extracted content</p>
                    <pre className={styles.previewContent}>
                      {sanitizeText(selectedItem.content) || "No extracted content saved for this document."}
                    </pre>
                  </div>
                </aside>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
