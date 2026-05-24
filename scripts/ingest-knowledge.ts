import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { ingestLegacyKnowledgeMarkdown, ingestStructuredKnowledge } = await import(
    "@/lib/knowledge/ingest-knowledge"
  );

  console.log("Ingesting structured knowledge from /knowledge-base ...");
  const structured = await ingestStructuredKnowledge();

  for (const item of structured) {
    console.log(
      `Structured: ${item.filePath} [${item.productType}] ${item.enabled ? "enabled" : "disabled"}`,
    );
  }

  console.log("Ingesting legacy markdown knowledge from /knowledge/oduzz ...");
  const legacy = await ingestLegacyKnowledgeMarkdown();

  for (const item of legacy) {
    console.log(`Legacy: ${item.filePath} [${item.category}] (${item.chunkCount} chunks)`);
  }

  console.log(`Done. Structured: ${structured.length}. Legacy: ${legacy.length}.`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Knowledge ingestion failed: ${message}`);
  process.exitCode = 1;
});
