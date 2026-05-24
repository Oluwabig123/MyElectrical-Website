import { promises as fs } from "node:fs";
import path from "node:path";
import {
  shouldIgnoreKnowledgeFile,
  validateKnowledgeRecord,
  type StructuredKnowledgeRecord,
} from "@/lib/knowledge/validators";

export const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), "knowledge-base");

async function walk(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
  const items = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) return walk(entryPath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) return [entryPath];
      return [];
    }),
  );

  return items.flat();
}

export async function findKnowledgeFiles() {
  return (await walk(KNOWLEDGE_BASE_DIR)).filter((filePath) => !shouldIgnoreKnowledgeFile(filePath)).sort();
}

export async function loadStructuredKnowledge() {
  const files = await findKnowledgeFiles();
  const records: Array<{ filePath: string; relativePath: string; record: StructuredKnowledgeRecord }> = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const relativePath = path.relative(process.cwd(), filePath);
    records.push({
      filePath,
      relativePath,
      record: validateKnowledgeRecord(parsed, relativePath),
    });
  }

  return records;
}
