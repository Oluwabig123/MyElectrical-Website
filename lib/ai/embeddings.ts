const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOpenAiApiKey() {
  const apiKey = sanitizeText(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return apiKey;
}

export async function createEmbedding(input: string, model = DEFAULT_EMBEDDING_MODEL) {
  const text = sanitizeText(input);
  if (!text) {
    throw new Error("Cannot create an embedding for empty text.");
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiApiKey()}`,
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: Array<{ embedding?: unknown }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Embedding request failed.");
  }

  const embedding = payload.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Embedding response did not include a usable vector.");
  }

  return embedding.map((value) => Number(value));
}
