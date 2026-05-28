import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ASSISTANT_KNOWLEDGE_CONTEXT,
  ASSISTANT_SYSTEM_INSTRUCTIONS,
} from "@/lib/assistant-knowledge";
import { CONTACT } from "@/data/contact";
import { oduzzAssistantDoc } from "@/data/oduzz-assistant-doc";
import { buildSolarRecommendation } from "@/lib/assistant-core";
import { detectConversationIntent, type ConsultationIntent } from "@/lib/ai/intent-context";
import type { ConsultationEntities } from "@/lib/ai/entity-extraction";
import type { SizingRecommendation } from "@/lib/engineering/types";

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

export type ChatReply = {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    source_url: string | null;
  }>;
  usedKnowledgeBase: boolean;
  quoteIntentDetected: boolean;
  recommendation?: SizingRecommendation | null;
};

export type ConsultationDeskContext = {
  intent?: ConsultationIntent;
  childState?: string;
  requiredFields?: string[];
  missingFields?: string[];
  nextRecommendedQuestion?: string;
  progress?: {
    stage: string;
    label: string;
    percent: number;
  };
  pendingClarifications?: string[];
  conversationSummary?: string;
  collected?: ConsultationEntities;
  engineeringNotes?: string[];
  guidedPaused?: boolean;
  recommendation?: SizingRecommendation | null;
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

type IntentKind = "solar" | "quote" | "wiring" | "cctv" | "lighting" | "product" | "contact" | "general";
type TurnMode = "flow_continue" | "flow_switch" | "general_info" | "mixed";

const SOFT_MODE_ENABLED = /^(1|true|yes|on)$/i.test(
  String(process.env.CONSULTATION_SOFT_MODE || "true"),
);

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

function isGeneralInfoQuestion(text: string) {
  return /\b(about (your|the) company|about oduzz|who are you|what do you do|company profile|your services|where are you located)\b/i.test(
    text,
  );
}

function classifyTurnMode({
  latestMessage,
  consultation,
}: {
  latestMessage: string;
  consultation?: ConsultationDeskContext;
}): TurnMode {
  const hasFlow = Boolean(consultation?.intent);
  const generalInfo = isGeneralInfoQuestion(latestMessage);
  const hasFlowSignals =
    /\b(solar|inverter|battery|panel|load|backup|fan|bulb|freezer|fridge|laptop|tv|watt|kw|kva|protection)\b/i.test(
      latestMessage,
    );

  if (!hasFlow) return generalInfo ? "general_info" : "flow_continue";
  if (generalInfo && hasFlowSignals) return "mixed";
  if (generalInfo) return "general_info";
  if (!hasFlowSignals && consultation?.guidedPaused) return "flow_switch";
  return "flow_continue";
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

function getLastAssistantText(messages: AssistantChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "assistant")?.content || "";
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

function isContactQuestion(messages: AssistantChatMessage[]) {
  const text = getRecentUserTextLower(messages);
  return /\b(contact|phone|call|whatsapp|email|address|reach you|talk to)\b/.test(text);
}

function intentFromConsultation(intent?: ConsultationIntent): IntentKind | null {
  const map: Partial<Record<ConsultationIntent, IntentKind>> = {
    battery_sizing: "solar",
    inverter_recommendation: "solar",
    panel_recommendation: "solar",
    solar_sizing: "solar",
    protection_recommendation: "solar",
    safety_check: "wiring",
    wiring_help: "wiring",
    cctv: "cctv",
    quote: "quote",
    materials_recommendation: "product",
    lighting_recommendation: "lighting",
    whatsapp: "contact",
  };

  return intent ? map[intent] || null : null;
}

function formatKnownParts(parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function getApplianceDetails(collected: ConsultationEntities) {
  return collected.appliance_details || [];
}

function formatApplianceSummary(collected: ConsultationEntities) {
  const details = getApplianceDetails(collected);
  if (details.length) return details.map((item) => item.label || item.name).join(", ");
  return collected.appliances?.join(", ") || "";
}

function formatMissingQuantityNames(collected: ConsultationEntities) {
  const pluralMap: Record<string, string> = {
    TV: "TVs",
    freezer: "freezers",
    fridge: "fridges",
    laptop: "laptops",
    fan: "fans",
    bulb: "bulbs",
    AC: "ACs",
    pump: "pumps",
    decoder: "decoders",
    router: "routers",
  };
  const names = getApplianceDetails(collected)
    .filter((item) => !item.quantity)
    .map((item) => pluralMap[item.name] || `${item.name}s`);

  if (names.length <= 1) return names[0] || "each appliance";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function hasMissingField(consultation: ConsultationDeskContext | undefined, field: string) {
  return Boolean(consultation?.missingFields?.includes(field));
}

function isNextStepQuestion(text: string) {
  return /\b(next useful step|next step|what now|what should i do next|where do we go from here)\b/i.test(text);
}

function buildCapturedLine(collected: ConsultationEntities) {
  const appliances = formatApplianceSummary(collected);
  const knownParts = formatKnownParts([
    appliances ? `appliances: ${appliances}` : "",
    collected.backup_hours ? `backup: ${collected.backup_hours}h` : "",
    collected.total_load_watts ? `load: ${formatNumber(collected.total_load_watts, 0)}W` : "",
    collected.inverter_size || collected.inverter_voltage
      ? `inverter: ${[collected.inverter_voltage, collected.inverter_size, collected.inverter_type].filter(Boolean).join(" ")}`
      : "",
  ]);

  return knownParts ? `I have ${knownParts}.` : "";
}

function buildPlanningReply(consultation: ConsultationDeskContext) {
  if (!consultation.engineeringNotes?.length) return "";

  const compressorMissing = hasMissingField(consultation, "freezer/AC/pump wattage or type");
  const nextLine = compressorMissing
    ? "To firm this up, send the freezer/AC/pump wattage, HP, or label photo when you can."
    : "Next, confirm any existing inverter, battery, panel models, and site route length so the final protection and cable sizes are not guessed.";

  return [
    "Here is a practical planning direction:",
    ...consultation.engineeringNotes.map((item) => `- ${item}`),
    nextLine,
  ].join("\n");
}

function buildConsultationLedReply({
  messages,
  consultation,
}: {
  messages: AssistantChatMessage[];
  consultation?: ConsultationDeskContext;
}) {
  // assistant-rag remains the final response layer; consultation context only
  // tells it what is known, what is missing, and which question is useful next.
  if (!consultation?.intent) return "";

  const latestText = getRecentUserText(messages);
  const collected = consultation.collected || {};
  const capturedLine = buildCapturedLine(collected);

  if (
    consultation.pendingClarifications?.length ||
    hasMissingField(consultation, "clarify ambiguous detail")
  ) {
    return [
      capturedLine || "I need to place that detail correctly before sizing.",
      consultation.nextRecommendedQuestion || "What does that value refer to?",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (isNextStepQuestion(latestText) && consultation.nextRecommendedQuestion) {
    return [
      capturedLine,
      `Next useful step: ${consultation.nextRecommendedQuestion}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (
    consultation.childState === "load_estimation" &&
    !collected.appliance_details?.length &&
    !collected.total_load_watts
  ) {
    return [
      "I can help estimate your load.",
      "",
      "Send the appliances and quantities in a simple list, for example:",
      "- 3 fans",
      "- 8 bulbs",
      "- 1 TV",
      "",
      "Also add the backup hours if you already know them.",
    ].join("\n");
  }

  if (hasMissingField(consultation, "load or appliance list")) {
    return [
      "I can help size it from normal household details.",
      "What appliances do you want to power? You can list them like: TV, freezer, laptop, 3 fans, 8 bulbs.",
    ].join("\n");
  }

  if (hasMissingField(consultation, "quantities")) {
    const names = formatMissingQuantityNames(collected);
    return [
      capturedLine || "Good, I have the appliance types.",
      `How many ${names} do you want to power?`,
      "Example: 3 fans, 8 bulbs.",
    ].join("\n");
  }

  if (hasMissingField(consultation, "backup hours")) {
    return [
      capturedLine || "Good, I have the load direction.",
      "How many hours do you want them to run during outage?",
    ].join("\n");
  }

  if (
    consultation.engineeringNotes?.length &&
    (collected.backup_hours || collected.total_load_watts || collected.appliance_details?.length)
  ) {
    return buildPlanningReply(consultation);
  }

  if (consultation.missingFields?.length && consultation.nextRecommendedQuestion) {
    return [
      capturedLine,
      consultation.nextRecommendedQuestion,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function buildConsultationDeskReply({
  activeIntent,
  messages,
  consultation,
  analyses,
}: {
  activeIntent: IntentKind;
  messages: AssistantChatMessage[];
  consultation?: ConsultationDeskContext;
  analyses: {
    solar: SolarSizingAnalysis;
    wiring: WiringIssueAnalysis;
    cctv: CctvPlanningAnalysis;
    quote: QuotePrepAnalysis;
    lighting: LightingPlanningAnalysis;
    product: ProductRecommendationAnalysis;
  };
}) {
  const latestText = getRecentUserText(messages).toLowerCase();
  const collected = consultation?.collected || {};
  const missingFields = consultation?.missingFields || [];
  const recommendation = consultation?.recommendation;

  if (isContactQuestion(messages)) {
    const quoteLine =
      activeIntent === "quote" || /\bquote|estimate|price|pricing|budget\b/.test(latestText)
        ? "For a quote, include service type, location, urgency, photos/videos where useful, and load details for solar or inverter work."
        : "";

    return [
      `You can call or WhatsApp Oduzz on ${CONTACT.phoneDisplay}.`,
      `Email: ${CONTACT.email}.`,
      quoteLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (recommendation) {
    return [
      recommendation.quickAnswer,
      ...recommendation.decision.slice(0, 4).map((item) => `- ${item}`),
      recommendation.missingInformation.length
        ? `Missing before final confirmation: ${recommendation.missingInformation.join("; ")}.`
        : "",
      recommendation.projectSummary.nextStep,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const consultationLedReply = buildConsultationLedReply({ messages, consultation });
  if (consultationLedReply) return consultationLedReply;

  if (
    consultation?.intent === "solar_sizing" &&
    consultation.engineeringNotes?.length &&
    collected.total_load_watts &&
    collected.backup_hours
  ) {
    return [
      "Planning estimate:",
      ...consultation.engineeringNotes.map((item) => `- ${item}`),
      "Final panel stringing, cable sizes, and protection ratings still need the inverter, battery, panel specs, and site route length.",
    ].join("\n");
  }

  if (consultation?.intent === "solar_sizing" && consultation.engineeringNotes?.length) {
    return [
      "No problem. List the appliances you want to power.",
      "",
      "If you know the wattages, include them. If not, I can use safe planning estimates for TVs, fans, bulbs, laptops, routers, freezers, pumps, or ACs.",
      "For AC, freezer, or pump, add the HP, wattage, or size if you know it.",
    ].join("\n");
  }

  if (activeIntent === "quote") {
    if (!consultation && analyses.quote.isQuoteIntent) {
      return buildQuotePrepReply(analyses.quote);
    }

    const knownParts = formatKnownParts([
      collected.service_type ? `service: ${collected.service_type}` : analyses.quote.serviceType ? `service: ${analyses.quote.serviceType}` : "",
      collected.location ? `location: ${collected.location}` : analyses.quote.location ? `location: ${analyses.quote.location}` : "",
      collected.urgency ? `urgency: ${collected.urgency}` : analyses.quote.urgency ? `urgency: ${analyses.quote.urgency}` : "",
    ]);
    const missing = consultation ? missingFields : analyses.quote.missingInputs;

    return [
      knownParts ? `I can help make this quote-ready. I already have ${knownParts}.` : "I can help make this quote-ready.",
      missing.length ? "Please send these details to complete the brief:" : "The brief is close. Add any final scope notes or photos if available.",
      ...missing.map((item) => `- ${item}`),
      missing.length
        ? "- short description of the project scope or current issue"
        : "Helpful remaining detail: a short description of the project scope or current issue.",
      collected.service_type === "solar/inverter" || analyses.quote.serviceType === "solar/inverter"
        ? "- load list and desired backup hours"
        : "",
      `Best next step: send the details here or on WhatsApp (${CONTACT.phoneDisplay}) so Oduzz can review and prepare the next action.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (activeIntent === "solar" && analyses.solar.isSolarIntent) {
    return buildSolarSizingReply(analyses.solar);
  }

  if (activeIntent === "wiring" && analyses.wiring.isWiringIntent) {
    return buildWiringIssueReply(analyses.wiring);
  }

  if (activeIntent === "cctv" && analyses.cctv.isCctvIntent) {
    return buildCctvPlanningReply(analyses.cctv);
  }

  if (activeIntent === "lighting" && analyses.lighting.isLightingIntent) {
    return buildLightingPlanningReply(analyses.lighting);
  }

  if (activeIntent === "product" && analyses.product.isProductIntent) {
    return buildProductRecommendationReply(analyses.product);
  }

  if (consultation?.nextRecommendedQuestion && consultation.intent) {
    const captured = formatKnownParts([
      collected.service_type ? `service: ${collected.service_type}` : "",
      collected.location ? `location: ${collected.location}` : "",
      collected.backup_hours ? `backup: ${collected.backup_hours}h` : "",
      collected.total_load_watts ? `load: ${formatNumber(collected.total_load_watts, 0)}W` : "",
    ]);

    return [
      captured ? `I captured ${captured}.` : `You're in ${consultation.intent.replace(/_/g, " ")} mode.`,
      consultation.nextRecommendedQuestion,
    ].join("\n");
  }

  return "";
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

  if (intent === "contact") {
    return [query, "company contact whatsapp phone email quote handoff"].join("\n");
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

  if (intent === "contact") {
    if (has("company")) return 10;
    if (has("faq")) return 6;
    if (has("quote")) return 4;
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

function prioritizeSolarMatches(matches: ChunkMatch[], limit = 4) {
  const solarTerms = /\b(solar|inverter|battery|panel|pv|mppt|voc|vmp|isc|imp|backup|load|earthing|breaker|dc|ac)\b/i;
  const scored = matches
    .map((match) => {
      const category = sanitizeText(match.category).toLowerCase();
      const title = sanitizeText(match.title).toLowerCase();
      const text = sanitizeText(match.chunk_text).toLowerCase();
      const combined = `${category} ${title} ${text}`;

      let score = 0;
      if (category.includes("solar")) score += 12;
      if (title.includes("solar")) score += 10;
      if (category.includes("inverter") || title.includes("inverter")) score += 8;
      if (category.includes("battery") || title.includes("battery")) score += 8;
      if (category.includes("protection") || title.includes("protection")) score += 5;
      if (category.includes("cables") || title.includes("cable")) score += 4;
      if (solarTerms.test(combined)) score += 4;
      score += Number(match.similarity || 0);

      return { match, score };
    })
    .sort((a, b) => b.score - a.score);

  const preferred = scored.filter((entry) => entry.score > 0).map((entry) => entry.match);
  return dedupeMatches(preferred.length ? preferred : matches, limit);
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
    "You are the only user-facing response generator. Consultation guide data is context, not a script.",
    "When engineering recommendation context is present, use it actively: combine retrieved specs with calculations, explain compatibility, runtime, battery bank size, panel count, charge-current limits, and tradeoffs in plain language.",
    "Behave like an experienced electrical consultant speaking to a layperson: collect appliances, quantities, and backup hours before asking technical voltage, MPPT, Voc, or breaker-rating questions.",
    "When a consultation field is missing, ask one useful follow-up question and briefly explain why it matters.",
    "If the user gives an ambiguous value such as a bare wattage, ask what it refers to instead of assuming panel wattage, total load, or appliance rating.",
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
  consultation,
}: {
  messages: AssistantChatMessage[];
  matches: ChunkMatch[];
  consultation?: ConsultationDeskContext;
}) {
  const { openAiApiKey } = ensureServerConfig();

  const transcript = buildTranscript(messages);
  const context = buildKnowledgeContext(matches);
  const consultationContext = consultation
    ? [
        consultation.intent ? `Intent: ${consultation.intent}` : "",
        consultation.childState ? `Child state: ${consultation.childState}` : "",
        consultation.progress ? `Progress: ${consultation.progress.label} (${consultation.progress.percent}%)` : "",
        consultation.conversationSummary ? `Conversation summary: ${consultation.conversationSummary}` : "",
        consultation.pendingClarifications?.length
          ? `Pending clarifications: ${consultation.pendingClarifications.join(", ")}`
          : "",
        consultation.requiredFields?.length ? `Required fields: ${consultation.requiredFields.join(", ")}` : "",
        consultation.missingFields?.length ? `Missing fields: ${consultation.missingFields.join(", ")}` : "",
        consultation.nextRecommendedQuestion ? `Next recommended question: ${consultation.nextRecommendedQuestion}` : "",
        consultation.collected ? `Captured structured state: ${JSON.stringify(consultation.collected)}` : "",
        consultation.engineeringNotes?.length ? `Engineering notes: ${consultation.engineeringNotes.join(" | ")}` : "",
        consultation.recommendation
          ? `Engineering recommendation: ${JSON.stringify({
              quickAnswer: consultation.recommendation.quickAnswer,
              verifiedSpecs: consultation.recommendation.verifiedSpecs,
              calculations: consultation.recommendation.calculations,
              decision: consultation.recommendation.decision,
              missingInformation: consultation.recommendation.missingInformation,
              sources: consultation.recommendation.sources,
            })}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

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
                "Consultation orchestration context:",
                consultationContext || "No active consultation context.",
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

export async function generateAssistantChatReply(
  rawMessages: unknown,
  options: {
    consultation?: ConsultationDeskContext;
  } = {},
): Promise<ChatReply> {
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
  const turnMode = classifyTurnMode({
    latestMessage: latestUserMessage.content,
    consultation: options.consultation,
  });

  const solarAnalysis = analyzeSolarSizing(messages);
  const wiringAnalysis = analyzeWiringIssue(messages);
  const cctvAnalysis = analyzeCctvPlanning(messages);
  const consultationIntent = intentFromConsultation(options.consultation?.intent);
  const quoteIntentDetected =
    options.consultation?.intent === "quote" || isQuoteIntent(latestUserMessage.content);
  const quoteAnalysis = analyzeQuotePrep(messages);
  const lightingAnalysis = analyzeLightingPlanning(messages);
  const productAnalysis = analyzeProductRecommendation(messages);
  const activeIntent: IntentKind =
    consultationIntent ||
    (isContactQuestion(messages)
      ? "contact"
      : solarAnalysis.isSolarIntent
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
                : "general");
  // Soft mode architecture: consultation flow provides context/planning only.
  // It should not directly own the response path unless we are in a hard fallback.
  const deskAnswer = buildConsultationDeskReply({
    activeIntent,
    messages,
    consultation: options.consultation,
    analyses: {
      solar: solarAnalysis,
      wiring: wiringAnalysis,
      cctv: cctvAnalysis,
      quote: quoteAnalysis,
      lighting: lightingAnalysis,
      product: productAnalysis,
    },
  });

  if (!SOFT_MODE_ENABLED && deskAnswer) {
    const previousAssistant = getLastAssistantText(messages);
    const compactFollowup =
      previousAssistant && previousAssistant.trim() === deskAnswer.trim()
        ? options.consultation?.nextRecommendedQuestion
          ? `Next useful step: ${options.consultation.nextRecommendedQuestion}`
          : "Next useful step: share one missing detail so I can refine the recommendation."
        : "";
    return {
      answer: compactFollowup || deskAnswer,
      sources: [],
      usedKnowledgeBase: false,
      quoteIntentDetected,
      recommendation: options.consultation?.recommendation || null,
    };
  }

  if (turnMode === "general_info" && options.consultation?.intent) {
    return {
      answer: [
        "Oduzz Electrical Concept provides electrical engineering support including solar/inverter planning, wiring, protection, CCTV/smart home, lighting, and quote handoff.",
        "If you want, we can continue your current consultation immediately after this.",
      ].join("\n"),
      sources: [],
      usedKnowledgeBase: false,
      quoteIntentDetected,
      recommendation: options.consultation?.recommendation || null,
    };
  }

  try {
    const retrievalQuery = buildRetrievalQuery(messages);
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
    const prioritizedMatches =
      activeIntent === "solar" ? prioritizeSolarMatches(filteredMatches, 4) : filteredMatches;

    if (!matches.length) {
      const answer = isGeneralInfoQuestion(latestUserMessage.content)
        ? [
            "Oduzz Electrical Concept provides electrical engineering support including solar/inverter planning, wiring, protection, CCTV/smart home, lighting, and quote handoff.",
            "Share your location and project scope if you want tailored guidance right away.",
          ].join("\n")
        : await generateGroundedAnswer({
            messages,
            matches: [],
            consultation: options.consultation,
          });

      return {
        answer: answer || NO_KNOWLEDGE_MESSAGE,
        sources: [],
        usedKnowledgeBase: false,
        quoteIntentDetected,
        recommendation: options.consultation?.recommendation || null,
      };
    }

    const answer = await generateGroundedAnswer({
      messages,
      matches: prioritizedMatches,
      consultation: options.consultation,
    });

    return {
      answer,
      sources: buildSources(prioritizedMatches),
      usedKnowledgeBase: prioritizedMatches.length > 0,
      quoteIntentDetected,
      recommendation: options.consultation?.recommendation || null,
    };
  } catch {
    const fallbackDesk = deskAnswer;
    return {
      answer: fallbackDesk || NO_KNOWLEDGE_MESSAGE,
      sources: [],
      usedKnowledgeBase: false,
      quoteIntentDetected,
      recommendation: options.consultation?.recommendation || null,
    };
  }
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
