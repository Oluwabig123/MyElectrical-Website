import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ingestKnowledgeDocument } from "../lib/assistant-rag";

loadEnvConfig(process.cwd());

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge", "oduzz");

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.md$/i, "")
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferCategory(filename: string) {
  const key = filename.toLowerCase();

  if (key.includes("solar") || key.includes("inverter")) return "Solar Installation";
  if (key.includes("cable") || key.includes("wire")) return "Cables & Wires";
  if (key.includes("switch") || key.includes("socket")) return "Switches & Sockets";
  if (key.includes("lighting")) return "Lighting";
  if (key.includes("protection") || key.includes("distribution")) return "Protection & Distribution";
  if (key.includes("cctv") || key.includes("smart-home")) return "CCTV & Smart Home";
  if (key.includes("quote") || key.includes("inspection")) return "Quote & Inspection";
  if (key.includes("safety")) return "Safety";
  if (key.includes("faq")) return "FAQ";
  if (key.includes("service")) return "Electrical Services";
  if (key.includes("product") || key.includes("catalog")) return "Products";
  if (key.includes("company")) return "Company";

  return "General";
}

function extractH1(content: string) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

async function readMarkdownFiles() {
  const entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(KNOWLEDGE_DIR, entry.name))
    .sort();
}

async function ingestFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const fileName = path.basename(filePath);
  const fallbackTitle = titleFromFilename(fileName);

  const title =
    String(parsed.data?.title || "").trim() || extractH1(parsed.content) || fallbackTitle;

  const category = String(parsed.data?.category || "").trim() || inferCategory(fileName);

  const sourceUrl = String(parsed.data?.source_url || parsed.data?.sourceUrl || "").trim() || null;

  const content = parsed.content.trim();

  if (!content) {
    throw new Error(`Skipping ${fileName}: empty content.`);
  }

  const result = await ingestKnowledgeDocument({
    title,
    category,
    sourceType: "manual",
    sourceUrl,
    content,
  });

  return {
    fileName,
    title,
    category,
    documentId: result.documentId,
    chunkCount: result.chunkCount,
  };
}

async function main() {
  const files = await readMarkdownFiles();

  if (!files.length) {
    console.log("No markdown files found in knowledge/oduzz.");
    return;
  }

  console.log(`Found ${files.length} markdown files in knowledge/oduzz.`);

  let successCount = 0;
  let failureCount = 0;

  for (const filePath of files) {
    try {
      const result = await ingestFile(filePath);
      successCount += 1;
      console.log(
        `Ingested ${result.fileName} -> ${result.documentId} (${result.chunkCount} chunks) [${result.category}]`,
      );
    } catch (error) {
      failureCount += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed ${path.basename(filePath)}: ${message}`);
    }
  }

  console.log(`Done. Success: ${successCount}. Failed: ${failureCount}.`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Knowledge ingestion failed: ${message}`);
  process.exitCode = 1;
});
