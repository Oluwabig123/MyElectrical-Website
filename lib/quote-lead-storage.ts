import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import type { QuoteForm } from "@/lib/quote-request";

export const QUOTE_LEADS_TABLE = "assistant_quote_leads";
export const QUOTE_LEAD_IMAGES_BUCKET = "quote-intake-images";
export const MAX_QUOTE_IMAGE_COUNT = 3;
export const MAX_QUOTE_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function sanitizeSegment(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function safeExtension(filename: unknown, fallback = "jpg") {
  const extension = String(filename || "").split(".").pop()?.toLowerCase() || fallback;
  return extension.replace(/[^a-z0-9]/g, "") || fallback;
}

export function canUploadQuoteImages() {
  return Boolean(isSupabaseConfigured && supabase);
}

export async function uploadQuoteLeadImages({
  files,
  referenceId,
}: {
  files: File[];
  referenceId: string;
}) {
  if (!canUploadQuoteImages() || !supabase) {
    return { imageUrls: [] as string[], error: "Image uploads are unavailable because Supabase is not configured." };
  }

  const selectedFiles = Array.from(files || []).slice(0, MAX_QUOTE_IMAGE_COUNT);
  const imageUrls: string[] = [];

  for (const file of selectedFiles) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      return { imageUrls: [] as string[], error: "Choose valid JPEG, PNG, WebP, or HEIC images only." };
    }

    if (file.size > MAX_QUOTE_IMAGE_SIZE_BYTES) {
      return { imageUrls: [] as string[], error: "Each image must be 3MB or less." };
    }

    const uploadPath = [
      sanitizeSegment(referenceId || "quote"),
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension(file.name)}`,
    ].join("/");

    const { error: uploadError } = await supabase.storage
      .from(QUOTE_LEAD_IMAGES_BUCKET)
      .upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { imageUrls: [] as string[], error: uploadError.message || "Could not upload image." };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(QUOTE_LEAD_IMAGES_BUCKET).getPublicUrl(uploadPath);

    imageUrls.push(publicUrl);
  }

  return { imageUrls, error: "" };
}

export async function saveQuoteLead({
  form,
  source = "website",
  channel = "quote-page",
  summary = "",
  conversation = [],
}: {
  form: QuoteForm;
  source?: string;
  channel?: string;
  summary?: string;
  conversation?: unknown[];
}) {
  if (!canUploadQuoteImages() || !supabase) {
    return { saved: false, error: "Supabase is not configured." };
  }

  const payload = {
    reference_id: form.referenceId || null,
    source: String(source || "website").slice(0, 64),
    channel: String(channel || "quote-page").slice(0, 64),
    customer_name: String(form.name || "").slice(0, 140),
    phone: String(form.phone || "").slice(0, 40),
    service: String(form.service || "").slice(0, 120),
    location: String(form.location || "").slice(0, 180),
    details: String(form.details || "").slice(0, 2500),
    urgency: String(form.urgency || "").slice(0, 80),
    budget: String(form.budget || "").slice(0, 120),
    image_urls: Array.isArray(form.imageUrls) ? form.imageUrls.slice(0, MAX_QUOTE_IMAGE_COUNT) : [],
    summary: String(summary || "").slice(0, 2000),
    metadata: {
      conversation: Array.isArray(conversation) ? conversation.slice(-24) : [],
      image_count: Array.isArray(form.imageUrls) ? form.imageUrls.length : 0,
    },
  };

  // Use INSERT only so anonymous clients cannot overwrite existing lead records.
  const { error } = await supabase.from(QUOTE_LEADS_TABLE).insert([payload]);

  return { saved: !error, error: error?.message || "" };
}
