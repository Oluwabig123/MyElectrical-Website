import { NextResponse } from "next/server";
import {
  ASSISTANT_KNOWLEDGE_CONTEXT,
  ASSISTANT_SYSTEM_INSTRUCTIONS,
} from "@/lib/assistant-knowledge";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MAX_OUTPUT_TOKENS = 180;

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTranscript(messages: unknown) {
  return (Array.isArray(messages) ? messages : [])
    .slice(-10)
    .map((message) => {
      const role = typeof message === "object" && message && "role" in message ? message.role : "";
      const text = typeof message === "object" && message && "text" in message ? message.text : "";
      return `${role === "user" ? "User" : "Assistant"}: ${String(text || "").trim()}`;
    })
    .join("\n");
}

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
      output_text?: unknown;
    }>;
  }>;
};

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

const MAX_OUTPUT_TOKENS = readPositiveInt(
  process.env.OPENAI_MAX_OUTPUT_TOKENS,
  DEFAULT_MAX_OUTPUT_TOKENS,
);

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Assistant AI is not configured yet." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const transcript = buildTranscript(body?.messages);

  if (!transcript) {
    return NextResponse.json({ error: "No conversation provided." }, { status: 400 });
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
    return NextResponse.json(
      { error: "OpenAI request failed.", detail: errorText },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const text = extractOutputText(payload);

  if (!text) {
    return NextResponse.json(
      { error: "Assistant returned an empty response." },
      { status: 502 },
    );
  }

  return NextResponse.json({ text });
}
