import { supabaseAdmin } from "@/lib/supabase-admin";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

const DEFAULT_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const DEFAULT_MAX_OUTPUT_TOKENS = readPositiveInt(process.env.OPENAI_MAX_OUTPUT_TOKENS, 240);

const CHUNK_MIN_WORDS = 500;
const CHUNK_TARGET_WORDS = 700;
const CHUNK_MAX_WORDS = 900;

const NO_KNOWLEDGE_MESSAGE =
  "I don’t have that exact information in the Oduzz knowledge base yet, but I can help you prepare the right details for the Oduzz team.";

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type KnowledgeDocumentInput = {
  title: string;
  category?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  content: string;
};

type OpenAIEmbeddingPayload = {
  data?: Array<{
    embedding?: unknown;
  }>;
};

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
      output_text?: unknown;
    }>;
  }>;
};

type ChunkMatch = {
  chunk_text: string;
  title: string | null;
  category: string | null;
  source_url: string | null;
  similarity: number;
  metadata: Record<string, unknown> | null;
};

type ChatReply = {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    source_url: string | null;
  }>;
  usedKnowledgeBase: boolean;
  quoteIntentDetected: boolean;
};

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeMultilineText(value: unknown) {
  return sanitizeText(value).replace(/\u0000/g, "").replace(/\r\n?/g, "\n");
}

function sanitizeChunkText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(value: string) {
  return sanitizeText(value)
    .split(/\s+/)
    .filter(Boolean).length;
}

function estimateTokens(value: string) {
  const words = countWords(value);
  return Math.max(1, Math.round(words * 1.33));
}

function splitParagraphToWordChunks(paragraph: string, maxWords = CHUNK_MAX_WORDS) {
  const words = sanitizeText(paragraph).split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(" "));
  }

  return chunks;
}

function chunkDocumentContent(content: string) {
  const paragraphs = sanitizeMultilineText(content)
    .split(/\n{2,}/)
    .map((paragraph) => sanitizeText(paragraph))
    .filter(Boolean);

  if (!paragraphs.length) return [] as string[];

  const segments = paragraphs.flatMap((paragraph) => {
    const words = countWords(paragraph);
    if (words <= CHUNK_MAX_WORDS) return [paragraph];
    return splitParagraphToWordChunks(paragraph, CHUNK_MAX_WORDS);
  });

  const chunks: string[] = [];
  let currentParts: string[] = [];
  let currentWords = 0;

  for (const segment of segments) {
    const segmentWords = countWords(segment);
    const shouldFlush =
      currentWords >= CHUNK_MIN_WORDS &&
      (currentWords + segmentWords > CHUNK_MAX_WORDS || currentWords >= CHUNK_TARGET_WORDS);

    if (shouldFlush) {
      chunks.push(sanitizeChunkText(currentParts.join("\n\n")));
      currentParts = [segment];
      currentWords = segmentWords;
      continue;
    }

    currentParts.push(segment);
    currentWords += segmentWords;
  }

  if (currentParts.length) {
    chunks.push(sanitizeChunkText(currentParts.join("\n\n")));
  }

  if (chunks.length > 1 && countWords(chunks[chunks.length - 1]) < Math.floor(CHUNK_MIN_WORDS * 0.45)) {
    const tail = chunks.pop();
    if (tail) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n\n${tail}`;
    }
  }

  return chunks.filter(Boolean);
}

function getRequiredServerEnv() {
  const openAiApiKey = sanitizeText(process.env.OPENAI_API_KEY);
  const supabaseUrl =
    sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_URL) || sanitizeText(process.env.SUPABASE_URL);
  const serviceRoleKey = sanitizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    openAiApiKey,
    supabaseUrl,
    serviceRoleKey,
  };
}

function ensureServerConfig() {
  const env = getRequiredServerEnv();

  if (!env.openAiApiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  if (!env.supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.");
  }

  if (!env.serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  return env;
}

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || content.output_text || "")
    .filter(Boolean);

  return chunks.join("\n").trim();
}

function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

async function generateEmbedding(input: string) {
  const { openAiApiKey } = ensureServerConfig();

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding request failed: ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as OpenAIEmbeddingPayload;
  const embedding = payload.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Embedding response did not include a valid vector.");
  }

  const numericEmbedding = embedding.map((value) => Number(value)).filter((value) => Number.isFinite(value));

  if (numericEmbedding.length !== embedding.length) {
    throw new Error("Embedding response contained invalid numeric values.");
  }

  return numericEmbedding;
}

export async function ingestKnowledgeDocument(input: KnowledgeDocumentInput) {
  ensureServerConfig();

  const title = sanitizeText(input.title);
  const content = sanitizeMultilineText(input.content);
  const category = sanitizeText(input.category) || null;
  const sourceType = sanitizeText(input.sourceType) || "manual";
  const sourceUrl = sanitizeText(input.sourceUrl) || null;

  if (!title) {
    throw new Error("Document title is required.");
  }

  if (!content) {
    throw new Error("Document content is required.");
  }

  const chunks = chunkDocumentContent(content);
  if (!chunks.length) {
    throw new Error("Document content does not contain enough text to chunk.");
  }

  const { data: documentRow, error: documentInsertError } = await supabaseAdmin!
    .from("documents")
    .insert({
      title,
      category,
      source_type: sourceType,
      source_url: sourceUrl,
      content,
      is_active: true,
    })
    .select("id")
    .single();

  if (documentInsertError || !documentRow?.id) {
    throw new Error(documentInsertError?.message || "Could not insert knowledge document.");
  }

  const chunkRows: Array<Record<string, unknown>> = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkText = chunks[index];
    const embedding = await generateEmbedding(chunkText);

    chunkRows.push({
      document_id: documentRow.id,
      chunk_text: chunkText,
      chunk_index: index,
      token_estimate: estimateTokens(chunkText),
      embedding: toVectorLiteral(embedding),
      metadata: {
        title,
        category,
        source_type: sourceType,
        source_url: sourceUrl,
      },
    });
  }

  const { error: chunkInsertError } = await supabaseAdmin!.from("document_chunks").insert(chunkRows);

  if (chunkInsertError) {
    await supabaseAdmin!.from("documents").delete().eq("id", documentRow.id);
    throw new Error(chunkInsertError.message || "Could not insert document chunks.");
  }

  return {
    documentId: documentRow.id,
    chunkCount: chunkRows.length,
  };
}

function isQuoteIntent(text: string) {
  return /(quote|estimate|pricing|price|budget|inspection|site visit|whatsapp|contact)/i.test(text);
}

function buildSources(matches: ChunkMatch[]) {
  const seen = new Set<string>();
  const sources: ChatReply["sources"] = [];

  for (const match of matches) {
    const title = sanitizeText(match.title) || "Oduzz knowledge";
    const category = sanitizeText(match.category) || "General";
    const sourceUrl = sanitizeText(match.source_url) || null;
    const key = `${title}::${category}`;
    if (seen.has(key)) continue;

    seen.add(key);
    sources.push({
      title,
      category,
      source_url: sourceUrl,
    });
  }

  return sources;
}

async function findRelevantChunks(userQuestion: string, matchCount = 6, similarityThreshold = 0.72) {
  ensureServerConfig();

  const queryEmbedding = await generateEmbedding(userQuestion);

  const { data, error } = await supabaseAdmin!.rpc("match_document_chunks", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });

  if (error) {
    throw new Error(error.message || "Semantic search failed.");
  }

  return (Array.isArray(data) ? data : []) as ChunkMatch[];
}

function buildSystemInstructions() {
  return [
    "You are Oduzz Electrical Concepts' AI assistant.",
    "Answer mainly from the retrieved Oduzz knowledge base context.",
    "Be professional, clear, warm, and concise.",
    "Help users with electrical services, solar/inverter planning, wiring, lighting, CCTV/smart home, product recommendations, and quote preparation.",
    "Ask useful follow-up questions when sizing solar systems or preparing quotes.",
    "Mention that final electrical/solar recommendations require professional site inspection.",
    "Do not invent exact prices, warranties, stock availability, or technical specs unless they are present in the provided context.",
    "For safety-critical issues, recommend a qualified electrician and offer WhatsApp handoff.",
    "For quote-ready users, collect name, location, phone/WhatsApp number, service type, and project details.",
    "If context is not enough, reply exactly with this sentence: \"I don’t have that exact information in the Oduzz knowledge base yet, but I can help you prepare the right details for the Oduzz team.\"",
    "Do not pretend to be a licensed on-site inspector.",
    "Never provide dangerous DIY electrical instructions.",
    "Never recommend unsafe wiring, bypasses, overloaded breakers, or unverified solar configurations.",
    "Do not hallucinate product prices or specifications.",
  ].join("\n");
}

function buildTranscript(messages: AssistantChatMessage[]) {
  return messages
    .map((message) => {
      const roleLabel = message.role === "assistant" ? "Assistant" : "User";
      return `${roleLabel}: ${sanitizeText(message.content)}`;
    })
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function buildKnowledgeContext(matches: ChunkMatch[]) {
  return matches
    .map((match, index) => {
      const title = sanitizeText(match.title) || "Knowledge base";
      const category = sanitizeText(match.category) || "General";
      const sourceUrl = sanitizeText(match.source_url) || "N/A";
      const similarity = Number(match.similarity || 0).toFixed(3);
      return [
        `Source ${index + 1}: ${title}`,
        `Category: ${category}`,
        `Source URL: ${sourceUrl}`,
        `Similarity: ${similarity}`,
        `Content: ${sanitizeText(match.chunk_text)}`,
      ].join("\n");
    })
    .join("\n\n");
}

async function generateGroundedAnswer({
  messages,
  matches,
}: {
  messages: AssistantChatMessage[];
  matches: ChunkMatch[];
}) {
  const { openAiApiKey } = ensureServerConfig();

  const transcript = buildTranscript(messages);
  const context = buildKnowledgeContext(matches);

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_CHAT_MODEL,
      instructions: buildSystemInstructions(),
      max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Use only the context below as primary business knowledge.",
                "",
                "Retrieved Oduzz knowledge context:",
                context,
                "",
                "Conversation transcript:",
                transcript,
              ].join("\n"),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI response failed: ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const answer = extractOutputText(payload);

  if (!answer) {
    throw new Error("OpenAI returned an empty response.");
  }

  return answer;
}

export async function generateAssistantChatReply(rawMessages: unknown): Promise<ChatReply> {
  ensureServerConfig();

  const messages = (Array.isArray(rawMessages) ? rawMessages : [])
    .map((message) => {
      const role = sanitizeText((message as { role?: unknown })?.role);
      const content = sanitizeMultilineText((message as { content?: unknown; text?: unknown })?.content || (message as { text?: unknown })?.text);

      if (role !== "assistant" && role !== "user") return null;
      if (!content) return null;

      return {
        role,
        content,
      } as AssistantChatMessage;
    })
    .filter(Boolean)
    .slice(-12) as AssistantChatMessage[];

  if (!messages.length) {
    throw new Error("Empty chat messages.");
  }

  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  if (!latestUserMessage?.content) {
    throw new Error("No user message found.");
  }

  const quoteIntentDetected = isQuoteIntent(latestUserMessage.content);
  const matches = await findRelevantChunks(latestUserMessage.content, 6, 0.72);

  if (!matches.length) {
    return {
      answer: NO_KNOWLEDGE_MESSAGE,
      sources: [],
      usedKnowledgeBase: false,
      quoteIntentDetected,
    };
  }

  const answer = await generateGroundedAnswer({
    messages,
    matches,
  });

  return {
    answer,
    sources: buildSources(matches),
    usedKnowledgeBase: true,
    quoteIntentDetected,
  };
}

export function getNoKnowledgeMessage() {
  return NO_KNOWLEDGE_MESSAGE;
}

export function sanitizeKnowledgePayload(body: unknown) {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  return {
    title: sanitizeText(record.title),
    category: sanitizeText(record.category) || null,
    sourceType: sanitizeText(record.source_type || record.sourceType) || "manual",
    sourceUrl: sanitizeText(record.source_url || record.sourceUrl) || null,
    content: sanitizeMultilineText(record.content),
  };
}
