import path from "node:path";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const PDF_MIME_TYPES = new Set(["application/pdf"]);
const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown", "application/octet-stream"]);

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeKnowledgeTitleFromFilename(filename: string) {
  const base = path.basename(String(filename || ""), path.extname(String(filename || "")));
  const cleaned = base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Knowledge Upload";

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extensionFromName(fileName: string) {
  return path.extname(String(fileName || "")).toLowerCase();
}

async function readPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return sanitizeText(result?.text || "");
  } finally {
    await parser.destroy();
  }
}

async function readDocxText(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer });
  return sanitizeText(parsed?.value || "");
}

function readPlainText(buffer: Buffer) {
  return sanitizeText(buffer.toString("utf8"));
}

export function isAllowedKnowledgeFileType(fileName: string, mimeType: string) {
  const extension = extensionFromName(fileName);
  const type = String(mimeType || "").toLowerCase();

  if (extension === ".pdf") return true;
  if (extension === ".docx") return true;
  if (extension === ".md" || extension === ".txt") return true;

  if (PDF_MIME_TYPES.has(type)) return true;
  if (DOCX_MIME_TYPES.has(type)) return true;
  if (TEXT_MIME_TYPES.has(type)) return true;

  return false;
}

export async function extractKnowledgeTextFromFile(file: File) {
  const fileName = sanitizeText(file?.name || "upload");
  const mimeType = sanitizeText(file?.type || "").toLowerCase();
  const extension = extensionFromName(fileName);

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid file upload.");
  }

  if (!isAllowedKnowledgeFileType(fileName, mimeType)) {
    throw new Error("Unsupported file type. Use PDF, DOCX, MD, or TXT.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum upload size is 8MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let content = "";

  if (extension === ".pdf" || PDF_MIME_TYPES.has(mimeType)) {
    content = await readPdfText(buffer);
  } else if (extension === ".docx" || DOCX_MIME_TYPES.has(mimeType)) {
    content = await readDocxText(buffer);
  } else {
    content = readPlainText(buffer);
  }

  if (!content) {
    throw new Error("Could not extract readable text from the uploaded file.");
  }

  return {
    content,
    fileName,
    mimeType,
    extension,
    suggestedTitle: normalizeKnowledgeTitleFromFilename(fileName),
  };
}

export function getKnowledgeUploadLimits() {
  return {
    maxUploadBytes: MAX_UPLOAD_BYTES,
    supportedExtensions: [".pdf", ".docx", ".md", ".txt"],
  };
}
