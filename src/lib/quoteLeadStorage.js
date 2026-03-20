import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

export const QUOTE_LEADS_TABLE = "assistant_quote_leads";
export const QUOTE_LEAD_IMAGES_BUCKET = "quote-intake-images";
export const MAX_QUOTE_IMAGE_COUNT = 3;
export const MAX_QUOTE_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function safeExtension(filename, fallback = "jpg") {
  const extension = String(filename || "").split(".").pop()?.toLowerCase() || fallback;
  return extension.replace(/[^a-z0-9]/g, "") || fallback;
}

export function canUploadQuoteImages() {
  return Boolean(isSupabaseConfigured && supabase);
}

export async function uploadQuoteLeadImages({ files, referenceId }) {
  if (!canUploadQuoteImages()) {
    return { imageUrls: [], error: "Image uploads are unavailable because Supabase is not configured." };
  }

  const selectedFiles = Array.from(files || []).slice(0, MAX_QUOTE_IMAGE_COUNT);
  const imageUrls = [];

  for (const file of selectedFiles) {
    if (!file.type.startsWith("image/")) {
      return { imageUrls: [], error: "Choose valid image files only." };
    }

    if (file.size > MAX_QUOTE_IMAGE_SIZE_BYTES) {
      return { imageUrls: [], error: "Each image must be 3MB or less." };
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
      return { imageUrls: [], error: uploadError.message || "Could not upload image." };
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
}) {
  if (!canUploadQuoteImages()) {
    return { saved: false, error: "Supabase is not configured." };
  }

  const payload = {
    reference_id: form.referenceId || null,
    source,
    channel,
    customer_name: form.name || "",
    phone: form.phone || "",
    service: form.service || "",
    location: form.location || "",
    details: form.details || "",
    urgency: form.urgency || "",
    budget: form.budget || "",
    image_urls: Array.isArray(form.imageUrls) ? form.imageUrls : [],
    summary: summary || "",
    metadata: {
      conversation,
      image_count: Array.isArray(form.imageUrls) ? form.imageUrls.length : 0,
    },
  };

  const { error } = await supabase.from(QUOTE_LEADS_TABLE).upsert([payload], {
    onConflict: "reference_id",
  });
  return { saved: !error, error: error?.message || "" };
}
