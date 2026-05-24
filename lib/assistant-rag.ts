import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ASSISTANT_KNOWLEDGE_CONTEXT,
  ASSISTANT_SYSTEM_INSTRUCTIONS,
} from "@/lib/assistant-knowledge";
import { CONTACT } from "@/data/contact";
import { oduzzAssistantDoc } from "@/data/oduzz-assistant-doc";
import { buildSolarRecommendation } from "@/lib/assistant-core";
import { detectConversationIntent } from "@/lib/ai/intent-context";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

const DEFAULT_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const DEFAULT_MAX_OUTPUT_TOKENS = readPositiveInt(process.env.OPENAI_MAX_OUTPUT_TOKENS, 320);

const CHUNK_MIN_WORDS = 180;
const CHUNK_TARGET_WORDS = 280;
const CHUNK_MAX_WORDS = 380;
const PRIMARY_SIMILARITY_THRESHOLD = 0.58;
const SECONDARY_SIMILARITY_THRESHOLD = 0.32;
const KEYWORD_CONTEXT_SLICE_CHARS = 1400;
const RETRIEVAL_MATCH_COUNT = 8;
const RETRIEVAL_USER_MESSAGE_WINDOW = 3;

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
  replaceExistingTitle?: boolean | null;
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

type KnowledgeDocumentRow = {
  title: string | null;
  category: string | null;
  source_url: string | null;
  content: string | null;
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

type SolarSizingAnalysis = {
  isSolarIntent: boolean;
  loadWatts: number | null;
  backupHours: number | null;
  location: string;
  usedDefaultSunHours: boolean;
  missingInputs: string[];
};

type WiringIssueAnalysis = {
  isWiringIntent: boolean;
  location: string;
  urgency: string;
  issueSignals: string[];
  missingInputs: string[];
};

type CctvPlanningAnalysis = {
  isCctvIntent: boolean;
  location: string;
  propertyType: string;
  urgency: string;
  coverageNeeds: string[];
  missingInputs: string[];
};

type QuotePrepAnalysis = {
  isQuoteIntent: boolean;
  location: string;
  serviceType: string;
  urgency: string;
  hasPhotosHint: boolean;
  missingInputs: string[];
};

type LightingPlanningAnalysis = {
  isLightingIntent: boolean;
  location: string;
  propertyType: string;
  roomPurpose: string;
  fixtureInterest: string[];
  controlZones: string;
  missingInputs: string[];
};

type ProductRecommendationAnalysis = {
  isProductIntent: boolean;
  location: string;
  projectType: string;
  productCategory: string;
  loadContext: string;
  hasReplacementPhotoHint: boolean;
  missingInputs: string[];
};

type IntentKind = "solar" | "quote" | "wiring" | "cctv" | "lighting" | "product" | "general";

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

function sanitizeBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = sanitizeText(value).toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;

  return fallback;
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits,
  }).format(value);
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
  const replaceExistingTitle = sanitizeBoolean(input.replaceExistingTitle, true);

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

  let deactivatedCount = 0;

  if (replaceExistingTitle) {
    const { data: staleRows, error: staleLookupError } = await supabaseAdmin!
      .from("documents")
      .select("id")
      .ilike("title", title)
      .eq("is_active", true)
      .neq("id", documentRow.id);

    if (staleLookupError) {
      throw new Error(staleLookupError.message || "Could not check previous document versions.");
    }

    const staleIds = (Array.isArray(staleRows) ? staleRows : [])
      .map((row) => sanitizeText((row as { id?: unknown })?.id))
      .filter(Boolean);

    if (staleIds.length > 0) {
      const { error: deactivateError } = await supabaseAdmin!
        .from("documents")
        .update({ is_active: false })
        .in("id", staleIds);

      if (deactivateError) {
        throw new Error(deactivateError.message || "Could not deactivate previous document versions.");
      }

      deactivatedCount = staleIds.length;
    }
  }

  return {
    documentId: documentRow.id,
    chunkCount: chunkRows.length,
    deactivatedCount,
  };
}

function isQuoteIntent(text: string) {
  if (detectConversationIntent(text) === "LOAD_ESTIMATION") return false;
  return /(quote|estimate|pricing|price|budget|inspection|site visit|whatsapp|contact)/i.test(text);
}

const SEARCH_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "my",
  "your",
  "our",
  "about",
  "with",
  "can",
  "could",
  "please",
  "tell",
  "need",
  "help",
  "project",
]);

function toSearchTokens(text: string) {
  return Array.from(
    new Set(
      sanitizeText(text)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !SEARCH_STOP_WORDS.has(token)),
    ),
  ).slice(0, 12);
}

function scoreDocumentByTokens(document: KnowledgeDocumentRow, tokens: string[]) {
  const title = sanitizeText(document.title).toLowerCase();
  const category = sanitizeText(document.category).toLowerCase();
  const content = sanitizeText(document.content).toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (category.includes(token)) score += 2;
    if (content.includes(token)) score += 1;
  }

  return score;
}

function getRecentUserText(messages: AssistantChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .slice(-RETRIEVAL_USER_MESSAGE_WINDOW)
    .map((message) => sanitizeText(message.content))
    .filter(Boolean)
    .join("\n");
}

function getRecentUserTextLower(messages: AssistantChatMessage[]) {
  return getRecentUserText(messages).toLowerCase();
}

function isSolarSizingIntent(messages: AssistantChatMessage[]) {
  const text = getRecentUserText(messages).toLowerCase();
  const hasSolarContext = /(solar|inverter|battery|panel|backup power|critical load)/.test(text);
  const hasSizingIntent = /(size|sizing|capacity|calculate|help|quote|load|battery size|panel size|inverter size)/.test(
    text,
  );
  return hasSolarContext && hasSizingIntent;
}

function extractLocation(messages: AssistantChatMessage[]) {
  const text = getRecentUserText(messages).toLowerCase();
  const knownLocations = oduzzAssistantDoc.solarSizing.peakSunHoursByLocation.flatMap((row) => row.match);
  const directMatch = knownLocations.find((token) => token !== "default" && text.includes(token));

  if (directMatch) {
    return directMatch
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const fallbackMatch = text.match(
    /\b(?:in|at|from|location is|located in)\s+([a-z][a-z\s]{2,30})(?:[.,]|$)/i,
  );
  const candidate = sanitizeText(fallbackMatch?.[1] || "");
  const genericPlaces = new Set(["the house", "house", "home", "my house", "my home", "shop", "office"]);

  return genericPlaces.has(candidate.toLowerCase()) ? "" : candidate;
}

function extractUrgency(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  if (/(urgent|asap|immediately|today|now)/.test(text)) return "urgent";
  if (/(tomorrow|this week|soon|quickly)/.test(text)) return "soon";
  if (/(routine|whenever|no rush|later)/.test(text)) return "routine";
  return "";
}

function extractPropertyType(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  const map: Array<[RegExp, string]> = [
    [/\b(shop|store|retail)\b/, "shop"],
    [/\b(office|workspace)\b/, "office"],
    [/\b(home|house|flat|apartment)\b/, "home"],
    [/\b(compound|estate)\b/, "compound"],
    [/\b(warehouse)\b/, "warehouse"],
  ];

  const match = map.find(([pattern]) => pattern.test(text));
  return match ? match[1] : "";
}

function extractRoomPurpose(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  const map: Array<[RegExp, string]> = [
    [/\b(living room|parlour|sitting room)\b/, "living room"],
    [/\b(bedroom|room)\b/, "bedroom"],
    [/\b(kitchen)\b/, "kitchen"],
    [/\b(shop|store)\b/, "shop"],
    [/\b(office)\b/, "office"],
    [/\b(outdoor|compound|exterior)\b/, "outdoor area"],
  ];

  const match = map.find(([pattern]) => pattern.test(text));
  return match ? match[1] : "";
}

function extractFixtureInterest(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  const fixtures: string[] = [];
  if (/(pop|recessed|downlight|spotlight)/.test(text)) fixtures.push("POP or recessed lighting");
  if (/(chandelier|pendant)/.test(text)) fixtures.push("decorative hanging fixture");
  if (/(security light|flood light|outdoor light)/.test(text)) fixtures.push("outdoor/security lighting");
  if (/(accent|feature light|strip light)/.test(text)) fixtures.push("accent lighting");
  if (/(general light|brightness|room light)/.test(text)) fixtures.push("general room lighting");
  return fixtures;
}

function extractControlZones(messages: AssistantChatMessage[]) {
  const text = getRecentUserText(messages);
  const explicit = text.match(/(\d+)\s*(?:zones|switch zones|control zones)/i);
  if (explicit) return `${explicit[1]} zones`;
  if (/(separate switch|different switch|layered control)/i.test(text)) return "multiple zones";
  return "";
}

function extractProjectType(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  if (/(new build|new house|new project)/.test(text)) return "new installation";
  if (/(replace|replacement|change old)/.test(text)) return "replacement";
  if (/(upgrade|renovation|remodel)/.test(text)) return "upgrade";
  return "";
}

function extractProductCategory(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  if (/(cable|wire|conduit)/.test(text)) return "cables and wiring materials";
  if (/(socket|switch|outlet|faceplate)/.test(text)) return "switches and sockets";
  if (/(light|lighting|chandelier|panel light|downlight)/.test(text)) return "lighting products";
  if (/(breaker|distribution board|db|surge protector|isolator)/.test(text)) return "protection and distribution";
  if (/(solar|inverter|battery|panel)/.test(text)) return "solar/inverter accessories";
  if (/(cctv|camera|smart home|automation)/.test(text)) return "CCTV or smart-home accessories";
  return "";
}

function extractLoadContext(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  if (/(air conditioner|ac|heavy load|pump|heater)/.test(text)) return "heavy-load appliance";
  if (/(lighting circuit|lights|room lighting)/.test(text)) return "lighting use";
  if (/(office equipment|workstation|computer)/.test(text)) return "office equipment";
  if (/(solar|inverter|battery)/.test(text)) return "solar/inverter use";
  return "";
}

function extractIssueSignals(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  const signals: string[] = [];
  if (/(trip|tripping|breaker)/.test(text)) signals.push("recurring tripping");
  if (/(hot socket|hot switch|overheat|burning smell|smell)/.test(text)) signals.push("hot point or overheating");
  if (/(buzz|buzzing|panel noise)/.test(text)) signals.push("buzzing panel");
  if (/(flicker|dimming light|dim light)/.test(text)) signals.push("flickering or dimming");
  if (/(outage|no light|power failure|intermittent)/.test(text)) signals.push("intermittent outage");
  return signals;
}

function extractCoverageNeeds(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  const needs: string[] = [];
  if (/(entry|entrance|gate|door)/.test(text)) needs.push("entry points");
  if (/(perimeter|outside|exterior|compound)/.test(text)) needs.push("perimeter");
  if (/(indoor|inside|counter|stock|hall|room)/.test(text)) needs.push("indoor zones");
  if (/(remote view|phone view|remote access)/.test(text)) needs.push("remote viewing");
  if (/(backup|inverter|power backup)/.test(text)) needs.push("backup-aware monitoring");
  return needs;
}

function extractServiceType(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  if (/(solar|inverter|panel|battery)/.test(text)) return "solar/inverter";
  if (/(cctv|camera|surveillance|remote viewing)/.test(text)) return "CCTV";
  if (/(wiring|rewiring|breaker|tripping|fault|socket|panel)/.test(text)) return "electrical fault/wiring";
  if (/(lighting|chandelier|pop light)/.test(text)) return "lighting";
  if (/(smart home|smart switch|automation)/.test(text)) return "smart home";
  return "";
}

function extractBackupHours(messages: AssistantChatMessage[]) {
  const text = getRecentUserText(messages);
  const explicitMatch = Array.from(
    text.matchAll(
      /(?:backup|outage|runtime|for)\D{0,18}(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|h)\b/gi,
    ),
  ).pop();

  if (explicitMatch) {
    const value = Number(explicitMatch[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  const genericMatch = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|h)\b/gi)).pop();
  if (!genericMatch) return null;

  const value = Number(genericMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractLoadWatts(messages: AssistantChatMessage[]) {
  const text = getRecentUserText(messages);
  const explicitMatch = Array.from(
    text.matchAll(
      /(?:total load|critical load|load(?:s)?|power need(?:s)?|consumption)\D{0,24}(\d+(?:\.\d+)?)\s*(kw|w|watts)\b/gi,
    ),
  ).pop();

  if (explicitMatch) {
    const rawValue = Number(explicitMatch[1]);
    if (Number.isFinite(rawValue) && rawValue > 0) {
      return explicitMatch[2].toLowerCase().startsWith("k") ? rawValue * 1000 : rawValue;
    }
  }

  const powerMatches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(kw|w|watts)\b/gi)).map((match) => {
    const rawValue = Number(match[1]);
    if (!Number.isFinite(rawValue) || rawValue <= 0) return 0;
    return match[2].toLowerCase().startsWith("k") ? rawValue * 1000 : rawValue;
  });

  if (powerMatches.length === 0) return null;
  if (powerMatches.length === 1) return powerMatches[0];

  const summed = powerMatches.reduce((total, value) => total + value, 0);
  return summed > 0 ? summed : null;
}

function analyzeSolarSizing(messages: AssistantChatMessage[]): SolarSizingAnalysis {
  const isSolarIntent = isSolarSizingIntent(messages);
  const loadWatts = isSolarIntent ? extractLoadWatts(messages) : null;
  const backupHours = isSolarIntent ? extractBackupHours(messages) : null;
  const location = isSolarIntent ? extractLocation(messages) : "";

  const missingInputs: string[] = [];
  if (!loadWatts) missingInputs.push("total critical load in watts or appliance list with wattage");
  if (!backupHours) missingInputs.push("backup hours you want during outage");
  if (!location) missingInputs.push("installation location");

  return {
    isSolarIntent,
    loadWatts,
    backupHours,
    location,
    usedDefaultSunHours: !location,
    missingInputs,
  };
}

function analyzeWiringIssue(messages: AssistantChatMessage[]): WiringIssueAnalysis {
  const text = getRecentUserTextLower(messages);
  const isWiringIntent = /(wiring|rewiring|breaker|tripping|fault|socket|switch|panel|overheat|flicker|buzzing)/.test(
    text,
  );
  const location = isWiringIntent ? extractLocation(messages) : "";
  const urgency = isWiringIntent ? extractUrgency(messages) : "";
  const issueSignals = isWiringIntent ? extractIssueSignals(messages) : [];

  const missingInputs: string[] = [];
  if (!location) missingInputs.push("location");
  if (issueSignals.length === 0) missingInputs.push("main symptom you are seeing");
  if (!urgency) missingInputs.push("urgency or when it started");

  return {
    isWiringIntent,
    location,
    urgency,
    issueSignals,
    missingInputs,
  };
}

function analyzeCctvPlanning(messages: AssistantChatMessage[]): CctvPlanningAnalysis {
  const text = getRecentUserTextLower(messages);
  const isCctvIntent = /(cctv|camera|surveillance|dvr|nvr|remote viewing|monitor)/.test(text);
  const location = isCctvIntent ? extractLocation(messages) : "";
  const propertyType = isCctvIntent ? extractPropertyType(messages) : "";
  const urgency = isCctvIntent ? extractUrgency(messages) : "";
  const coverageNeeds = isCctvIntent ? extractCoverageNeeds(messages) : [];

  const missingInputs: string[] = [];
  if (!location) missingInputs.push("location");
  if (!propertyType) missingInputs.push("property type");
  if (coverageNeeds.length === 0) missingInputs.push("coverage goals");

  return {
    isCctvIntent,
    location,
    propertyType,
    urgency,
    coverageNeeds,
    missingInputs,
  };
}

function analyzeQuotePrep(messages: AssistantChatMessage[]): QuotePrepAnalysis {
  const isQuote = isQuoteIntent(getRecentUserText(messages));
  const location = isQuote ? extractLocation(messages) : "";
  const serviceType = isQuote ? extractServiceType(messages) : "";
  const urgency = isQuote ? extractUrgency(messages) : "";
  const hasPhotosHint = isQuote ? /(photo|photos|video|videos|picture|pictures)/.test(getRecentUserTextLower(messages)) : false;

  const missingInputs: string[] = [];
  if (!serviceType) missingInputs.push("service type");
  if (!location) missingInputs.push("location");
  if (!urgency) missingInputs.push("urgency or preferred timeline");
  if (!hasPhotosHint) missingInputs.push("photos or short video of the current setup");

  return {
    isQuoteIntent: isQuote,
    location,
    serviceType,
    urgency,
    hasPhotosHint,
    missingInputs,
  };
}

function analyzeLightingPlanning(messages: AssistantChatMessage[]): LightingPlanningAnalysis {
  const text = getRecentUserTextLower(messages);
  const isLightingIntent = /(lighting|light design|chandelier|pop light|downlight|spotlight|accent light|security light)/.test(
    text,
  );
  const location = isLightingIntent ? extractLocation(messages) : "";
  const propertyType = isLightingIntent ? extractPropertyType(messages) : "";
  const roomPurpose = isLightingIntent ? extractRoomPurpose(messages) : "";
  const fixtureInterest = isLightingIntent ? extractFixtureInterest(messages) : [];
  const controlZones = isLightingIntent ? extractControlZones(messages) : "";

  const missingInputs: string[] = [];
  if (!propertyType && !roomPurpose) missingInputs.push("property type or room purpose");
  if (fixtureInterest.length === 0) missingInputs.push("fixture style or lighting goal");
  if (!controlZones) missingInputs.push("number of control zones or switching preference");

  return {
    isLightingIntent,
    location,
    propertyType,
    roomPurpose,
    fixtureInterest,
    controlZones,
    missingInputs,
  };
}

function analyzeProductRecommendation(messages: AssistantChatMessage[]): ProductRecommendationAnalysis {
  const text = getRecentUserTextLower(messages);
  const isProductIntent = /(product|material|recommend|recommendation|buy|need.*(cable|wire|socket|switch|light|breaker|panel|battery|inverter)|which .* should i use)/.test(
    text,
  );
  const location = isProductIntent ? extractLocation(messages) : "";
  const projectType = isProductIntent ? extractProjectType(messages) : "";
  const productCategory = isProductIntent ? extractProductCategory(messages) : "";
  const loadContext = isProductIntent ? extractLoadContext(messages) : "";
  const hasReplacementPhotoHint = isProductIntent
    ? /(photo|photos|video|videos|label|nameplate|picture|pictures)/.test(text)
    : false;

  const missingInputs: string[] = [];
  if (!productCategory) missingInputs.push("product category or item you need");
  if (!projectType) missingInputs.push("project type or whether this is new installation, replacement, or upgrade");
  if (!loadContext) missingInputs.push("intended load or use case");

  return {
    isProductIntent,
    location,
    projectType,
    productCategory,
    loadContext,
    hasReplacementPhotoHint,
    missingInputs,
  };
}

function buildSolarSizingReply(analysis: SolarSizingAnalysis) {
  if (!analysis.isSolarIntent) return "";

  if (!analysis.loadWatts || !analysis.backupHours) {
    const knownParts = [
      analysis.loadWatts ? `load: ${formatNumber(analysis.loadWatts, 0)}W` : "",
      analysis.backupHours ? `backup: ${formatNumber(analysis.backupHours)}h` : "",
      analysis.location ? `location: ${analysis.location}` : "",
    ].filter(Boolean);

    return [
      knownParts.length ? `I can size this properly. I already have ${knownParts.join(", ")}.` : "I can size this properly.",
      "Please send these details so I can return one brief solar recommendation:",
      ...analysis.missingInputs.map((item) => `- ${item}`),
      "I’ll use that to estimate inverter size, battery size, panel size, cable categories, and protection kit in one reply.",
    ].join("\n");
  }

  const recommendation = buildSolarRecommendation({
    loadsWatts: analysis.loadWatts,
    backupHours: analysis.backupHours,
    location: analysis.location || "default",
  });
  const panelCountMin = Math.max(1, Math.floor(recommendation.solarWp / 550));
  const panelCountMax = Math.max(1, Math.ceil(recommendation.solarWp / 550));
  const panelCountLabel =
    panelCountMin === panelCountMax ? `${panelCountMax} x 550W` : `${panelCountMin}-${panelCountMax} x 550W`;
  const locationLine = analysis.location
    ? `${analysis.location} (${recommendation.sunHours} peak sun hours used)`
    : `default sunlight assumption (${recommendation.sunHours} peak sun hours used)`;

  return [
    "Preliminary solar sizing:",
    `- Basis: ${formatNumber(analysis.loadWatts, 0)}W simultaneous critical load, ${formatNumber(analysis.backupHours)}h backup`,
    `- Inverter: about ${formatNumber(recommendation.inverterKVA)}kVA`,
    `- Battery bank: about ${formatNumber(recommendation.batteryKWh)}kWh nominal (~${formatNumber(recommendation.batteryAhAt48V, 0)}Ah @48V)`,
    `- Solar array: about ${formatNumber(recommendation.solarWp, 0)}Wp, roughly ${panelCountLabel} panels`,
    "- Cables: PV cable, battery cable, and AC output cable, all finally sized from actual current and run length",
    "- Protection: battery fuse/isolator, DC breaker or combiner, surge protection, AC breakers/changeover, and earthing",
    `- Location basis: ${locationLine}`,
    analysis.usedDefaultSunHours
      ? `This is preliminary until you confirm location. Final cable and protection ratings depend on the appliance list, route length, and site layout. Send details and site photos on WhatsApp (${CONTACT.phoneDisplay}).`
      : `This is preliminary. Final cable and protection ratings depend on the appliance list, route length, and site layout. Send details and site photos on WhatsApp (${CONTACT.phoneDisplay}).`,
  ].join("\n");
}

function buildWiringIssueReply(analysis: WiringIssueAnalysis) {
  if (!analysis.isWiringIntent) return "";

  const knownParts = [
    analysis.location ? `location: ${analysis.location}` : "",
    analysis.issueSignals.length ? `issue: ${analysis.issueSignals.join(", ")}` : "",
    analysis.urgency ? `urgency: ${analysis.urgency}` : "",
  ].filter(Boolean);

  return [
    knownParts.length
      ? `This looks like a wiring or fault-diagnosis case. I already have ${knownParts.join(", ")}.`
      : "This looks like a wiring or fault-diagnosis case.",
    "Safe first step: avoid repeated breaker resets, and switch off any point that smells hot, sparks, or feels unusually warm if it is safe to do so.",
    "Please send these details for a focused next step:",
    ...analysis.missingInputs.map((item) => `- ${item}`),
    `You can also send panel, socket, or affected-area photos on WhatsApp (${CONTACT.phoneDisplay}) for faster assessment.`,
  ].join("\n");
}

function buildCctvPlanningReply(analysis: CctvPlanningAnalysis) {
  if (!analysis.isCctvIntent) return "";

  if (analysis.location && analysis.propertyType && analysis.coverageNeeds.length > 0) {
    return [
      "Preliminary CCTV scope:",
      `- Property: ${analysis.propertyType}${analysis.location ? ` in ${analysis.location}` : ""}`,
      `- Coverage focus: ${analysis.coverageNeeds.join(", ")}`,
      "- System planning: camera placement, recorder/storage, stable power path, and clean cable routing",
      "- Add-ons to confirm: remote viewing, backup power, and night coverage requirements",
      `Next step: send a simple layout, photos, or video of the property on WhatsApp (${CONTACT.phoneDisplay}) so Oduzz can advise quantity and final scope.`,
    ].join("\n");
  }

  return [
    "I can help plan the CCTV scope briefly.",
    "Please send these details:",
    ...analysis.missingInputs.map((item) => `- ${item}`),
    "- whether you want remote viewing or backup-aware monitoring",
    `Once I have that, I can summarize camera coverage, power needs, and the likely installation scope in one reply.`,
  ].join("\n");
}

function buildQuotePrepReply(analysis: QuotePrepAnalysis) {
  if (!analysis.isQuoteIntent) return "";

  const knownParts = [
    analysis.serviceType ? `service: ${analysis.serviceType}` : "",
    analysis.location ? `location: ${analysis.location}` : "",
    analysis.urgency ? `urgency: ${analysis.urgency}` : "",
  ].filter(Boolean);

  return [
    knownParts.length
      ? `I can help make this quote-ready. I already have ${knownParts.join(", ")}.`
      : "I can help make this quote-ready.",
    "Please send these details to complete the brief:",
    ...analysis.missingInputs.map((item) => `- ${item}`),
    "- short description of the project scope or current issue",
    analysis.serviceType === "solar/inverter" ? "- load list and desired backup hours" : "",
    `Best next step: send the details here or on WhatsApp (${CONTACT.phoneDisplay}) so Oduzz can review and prepare the next action.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLightingPlanningReply(analysis: LightingPlanningAnalysis) {
  if (!analysis.isLightingIntent) return "";

  if ((analysis.propertyType || analysis.roomPurpose) && analysis.fixtureInterest.length > 0) {
    const space = analysis.roomPurpose || analysis.propertyType;

    return [
      "Preliminary lighting plan:",
      `- Space: ${space}${analysis.location ? ` in ${analysis.location}` : ""}`,
      `- Direction: ${analysis.fixtureInterest.join(", ")}`,
      `- Control: ${analysis.controlZones || "separate switch zones for layered control"}`,
      "- Focus: balanced brightness, safe fixture support, neat wiring, and accessible maintenance points",
      "- Final fixture and wiring layout still depend on ceiling type, spacing, and site review",
      `Next step: send room photos, ceiling type, and your preferred mood or color temperature on WhatsApp (${CONTACT.phoneDisplay}) for a sharper recommendation.`,
    ].join("\n");
  }

  return [
    "I can help shape the lighting plan.",
    "Please send:",
    ...analysis.missingInputs.map((item) => `- ${item}`),
    analysis.location ? "" : "- location if you want area-specific follow-up",
    "With that, I can summarize fixture direction, control zoning, and installation considerations in one reply.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildProductRecommendationReply(analysis: ProductRecommendationAnalysis) {
  if (!analysis.isProductIntent) return "";

  if (analysis.productCategory && analysis.projectType && analysis.loadContext) {
    return [
      "Preliminary product direction:",
      `- Category: ${analysis.productCategory}`,
      `- Use case: ${analysis.projectType}${analysis.loadContext ? ` for ${analysis.loadContext}` : ""}`,
      "- Direction: use authentic, compatible materials matched to the actual load and installation context",
      analysis.hasReplacementPhotoHint
        ? "- Good: include existing labels or photos so Oduzz can confirm compatibility faster"
        : "- Helpful next input: send existing labels or photos if this is a replacement",
      "- Final stock, price, and exact spec confirmation should be checked during direct inquiry or quote prep",
      `Next step: send load details, location, and any existing product photos on WhatsApp (${CONTACT.phoneDisplay}) for a more exact shortlist.`,
    ].join("\n");
  }

  return [
    "I can guide the product choice.",
    "Please send:",
    ...analysis.missingInputs.map((item) => `- ${item}`),
    analysis.location ? "" : "- location",
    analysis.hasReplacementPhotoHint ? "" : "- photo of the existing item or label if this is a replacement",
    "That will help me narrow the right category and compatibility direction without guessing exact specs.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRetrievalQuery(messages: AssistantChatMessage[]) {
  const recentUserMessages = messages.filter((message) => message.role === "user").slice(-RETRIEVAL_USER_MESSAGE_WINDOW);
  const latestUserMessage = recentUserMessages[recentUserMessages.length - 1];

  if (!latestUserMessage) return "";
  if (recentUserMessages.length === 1) return latestUserMessage.content;

  const previousContext = recentUserMessages
    .slice(0, -1)
    .map((message) => sanitizeText(message.content))
    .filter(Boolean)
    .join("\n");

  return [
    `Latest user question: ${sanitizeText(latestUserMessage.content)}`,
    previousContext ? `Recent user context:\n${previousContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildIntentAwareRetrievalQuery(baseQuery: string, intent: IntentKind) {
  const query = sanitizeText(baseQuery);
  if (!query) return "";

  if (intent === "solar") {
    return [
      query,
      "solar sizing inverter battery panels pv cable protection breaker earthing load backup hours",
    ].join("\n");
  }

  if (intent === "lighting") {
    return [query, "lighting zones chandelier recessed pop fixture ceiling layout"].join("\n");
  }

  if (intent === "product") {
    return [query, "product compatibility category load installation context authentic materials"].join("\n");
  }

  return query;
}

function dedupeMatches(matches: ChunkMatch[], limit = 6) {
  const seen = new Set<string>();
  const unique: ChunkMatch[] = [];

  for (const match of matches) {
    const key = [
      sanitizeText(match.title).toLowerCase(),
      sanitizeText(match.category).toLowerCase(),
      sanitizeText(match.chunk_text).slice(0, 240).toLowerCase(),
    ].join("::");

    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(match);

    if (unique.length >= limit) break;
  }

  return unique;
}

function getIntentCategoryScore(match: ChunkMatch, intent: IntentKind) {
  const category = sanitizeText(match.category).toLowerCase();
  const title = sanitizeText(match.title).toLowerCase();

  const has = (value: string) => category.includes(value) || title.includes(value);

  if (intent === "solar") {
    if (has("solar")) return 10;
    if (has("protection")) return 6;
    if (has("cables")) return 5;
    if (has("quote")) return 4;
    if (has("faq")) return 3;
    if (has("company")) return 2;
    return 0;
  }

  if (intent === "wiring") {
    if (has("electrical services")) return 10;
    if (has("safety")) return 7;
    if (has("protection")) return 6;
    if (has("cables")) return 5;
    if (has("quote")) return 4;
    if (has("faq")) return 3;
    return 0;
  }

  if (intent === "cctv") {
    if (has("cctv")) return 10;
    if (has("quote")) return 6;
    if (has("electrical services")) return 4;
    if (has("faq")) return 3;
    if (has("company")) return 2;
    return 0;
  }

  if (intent === "lighting") {
    if (has("lighting")) return 10;
    if (has("electrical services")) return 5;
    if (has("switches")) return 4;
    if (has("quote")) return 4;
    if (has("faq")) return 3;
    return 0;
  }

  if (intent === "product") {
    if (has("products")) return 10;
    if (has("cables")) return 7;
    if (has("switches")) return 7;
    if (has("lighting")) return 7;
    if (has("protection")) return 7;
    if (has("cctv")) return 6;
    if (has("solar")) return 6;
    if (has("faq")) return 3;
    return 0;
  }

  if (intent === "quote") {
    if (has("quote")) return 10;
    if (has("faq")) return 5;
    if (has("company")) return 4;
    if (has("electrical services")) return 4;
    if (has("solar")) return 4;
    if (has("cctv")) return 4;
    if (has("lighting")) return 4;
    return 0;
  }

  if (has("faq")) return 4;
  if (has("company")) return 3;
  return 1;
}

function filterMatchesForIntent(matches: ChunkMatch[], intent: IntentKind, limit = 4) {
  const ranked = matches
    .map((match) => ({
      match,
      score: getIntentCategoryScore(match, intent),
      similarity: Number(match.similarity || 0),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.similarity - left.similarity;
    });

  const relevant = ranked.filter((entry) => entry.score > 0).map((entry) => entry.match);
  const source = relevant.length > 0 ? relevant : matches;
  return dedupeMatches(source, limit);
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

async function findKeywordRelevantChunks(userQuestion: string, matchCount = 4) {
  ensureServerConfig();

  const tokens = toSearchTokens(userQuestion);
  if (!tokens.length) return [] as ChunkMatch[];

  const { data, error } = await supabaseAdmin!
    .from("documents")
    .select("title, category, source_url, content")
    .eq("is_active", true)
    .limit(120);

  if (error) {
    throw new Error(error.message || "Keyword search failed.");
  }

  const ranked = (Array.isArray(data) ? (data as KnowledgeDocumentRow[]) : [])
    .map((row) => ({
      row,
      score: scoreDocumentByTokens(row, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, matchCount));

  return ranked.map((entry, index) => {
    const content = sanitizeText(entry.row.content).slice(0, KEYWORD_CONTEXT_SLICE_CHARS);
    return {
      chunk_text: content,
      title: sanitizeText(entry.row.title) || "Oduzz knowledge",
      category: sanitizeText(entry.row.category) || "General",
      source_url: sanitizeText(entry.row.source_url) || null,
      similarity: Math.max(0.18, 0.34 - index * 0.03),
      metadata: {
        retrieval: "keyword_fallback",
        score: entry.score,
      },
    } as ChunkMatch;
  });
}

function buildSystemInstructions() {
  return [
    ASSISTANT_SYSTEM_INSTRUCTIONS,
    "Use retrieved Oduzz knowledge as the primary source for company-specific facts and guidance.",
    "If the retrieved context is partial, combine it with the baseline Oduzz business context and normal reasoning to give the most helpful answer you can.",
    "Treat recent conversation turns as part of the user's intent, especially for follow-up questions.",
    "Do not invent exact prices, warranties, stock availability, inspection outcomes, or technical specs that are not supported by the provided business context.",
    "For cable, breaker, panel, inverter, battery, or other spec-sensitive product questions, prefer category-level guidance and state which load, distance, breaker, or site details are still needed before exact sizing.",
    "Do not guess exact cable gauges, breaker sizes, battery capacities, or equipment ratings unless they are explicitly supported by the retrieved business context.",
    "When the user asks for a quote or inspection, structure the reply around the missing quote inputs: service type, location, scope, urgency, photos/videos, and load details where relevant.",
    "For quote-ready users, end with one clear next step, usually sharing the required details here or on WhatsApp for faster handoff.",
    "If the business context is still insufficient for a specific claim, say what is missing and ask one useful follow-up question.",
    "Use this fallback sentence only when neither retrieved context nor baseline business context can answer the request well: \"I don’t have that exact information in the Oduzz knowledge base yet, but I can help you prepare the right details for the Oduzz team.\"",
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
                "Use the retrieved context first, then the baseline Oduzz business context below, then general reasoning.",
                "",
                "Baseline Oduzz business context:",
                ASSISTANT_KNOWLEDGE_CONTEXT,
                "",
                "Retrieved Oduzz knowledge context:",
                context || "No specific retrieved knowledge context.",
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

  const retrievalQuery = buildRetrievalQuery(messages);
  const solarAnalysis = analyzeSolarSizing(messages);
  const wiringAnalysis = analyzeWiringIssue(messages);
  const cctvAnalysis = analyzeCctvPlanning(messages);
  const quoteIntentDetected = isQuoteIntent(latestUserMessage.content);
  const quoteAnalysis = analyzeQuotePrep(messages);
  const lightingAnalysis = analyzeLightingPlanning(messages);
  const productAnalysis = analyzeProductRecommendation(messages);
  const activeIntent: IntentKind = solarAnalysis.isSolarIntent
    ? "solar"
    : quoteAnalysis.isQuoteIntent
      ? "quote"
      : wiringAnalysis.isWiringIntent
        ? "wiring"
        : cctvAnalysis.isCctvIntent
          ? "cctv"
          : lightingAnalysis.isLightingIntent
            ? "lighting"
            : productAnalysis.isProductIntent
              ? "product"
              : "general";
  const intentAwareQuery = buildIntentAwareRetrievalQuery(
    retrievalQuery || latestUserMessage.content,
    activeIntent,
  );
  const primaryMatches = await findRelevantChunks(
    intentAwareQuery,
    RETRIEVAL_MATCH_COUNT,
    PRIMARY_SIMILARITY_THRESHOLD,
  );
  const secondaryMatches =
    primaryMatches.length > 0
      ? primaryMatches
      : await findRelevantChunks(
          intentAwareQuery,
          RETRIEVAL_MATCH_COUNT,
          SECONDARY_SIMILARITY_THRESHOLD,
        );
  const matches = dedupeMatches(
    secondaryMatches.length > 0
      ? secondaryMatches
      : await findKeywordRelevantChunks(intentAwareQuery, 4),
  );
  const filteredMatches = filterMatchesForIntent(matches, activeIntent);

  if (solarAnalysis.isSolarIntent) {
    return {
      answer: buildSolarSizingReply(solarAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (quoteAnalysis.isQuoteIntent) {
    return {
      answer: buildQuotePrepReply(quoteAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (wiringAnalysis.isWiringIntent) {
    return {
      answer: buildWiringIssueReply(wiringAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (cctvAnalysis.isCctvIntent) {
    return {
      answer: buildCctvPlanningReply(cctvAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (lightingAnalysis.isLightingIntent) {
    return {
      answer: buildLightingPlanningReply(lightingAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (productAnalysis.isProductIntent) {
    return {
      answer: buildProductRecommendationReply(productAnalysis),
      sources: buildSources(filteredMatches),
      usedKnowledgeBase: filteredMatches.length > 0,
      quoteIntentDetected,
    };
  }

  if (!matches.length) {
    const answer = await generateGroundedAnswer({
      messages,
      matches: [],
    });

    return {
      answer: answer || NO_KNOWLEDGE_MESSAGE,
      sources: [],
      usedKnowledgeBase: false,
      quoteIntentDetected,
    };
  }

  const answer = await generateGroundedAnswer({
    messages,
    matches: filteredMatches,
  });

  return {
    answer,
    sources: buildSources(filteredMatches),
    usedKnowledgeBase: filteredMatches.length > 0,
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
    replaceExistingTitle: sanitizeBoolean(record.replace_existing ?? record.replaceExistingTitle, true),
  };
}
