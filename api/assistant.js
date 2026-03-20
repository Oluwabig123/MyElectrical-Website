import {
  ASSISTANT_KNOWLEDGE_CONTEXT,
  ASSISTANT_SYSTEM_INSTRUCTIONS,
} from "../src/lib/assistantKnowledge.js";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MAX_OUTPUT_TOKENS = 180;

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function buildTranscript(messages) {
  return (Array.isArray(messages) ? messages : [])
    .slice(-10)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${String(message.text || "").trim()}`)
    .join("\n");
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .map((content) => content?.text || content?.output_text || "")
    .filter(Boolean);

  return chunks.join("\n").trim();
}

const MAX_OUTPUT_TOKENS = readPositiveInt(
  process.env.OPENAI_MAX_OUTPUT_TOKENS,
  DEFAULT_MAX_OUTPUT_TOKENS
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Assistant AI is not configured yet." });
  }

  const body = readRequestBody(req);
  const transcript = buildTranscript(body.messages);

  if (!transcript) {
    return res.status(400).json({ error: "No conversation provided." });
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      instructions: ASSISTANT_SYSTEM_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Use the business knowledge below to answer the customer accurately.",
                "",
                ASSISTANT_KNOWLEDGE_CONTEXT,
                "",
                "Conversation transcript:",
                transcript,
              ].join("\n"),
            },
          ],
        },
      ],
      max_output_tokens: MAX_OUTPUT_TOKENS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return res.status(502).json({ error: "OpenAI request failed.", detail: errorText });
  }

  const payload = await response.json();
  const text = extractOutputText(payload);

  if (!text) {
    return res.status(502).json({ error: "Assistant returned an empty response." });
  }

  return res.status(200).json({ text });
}
