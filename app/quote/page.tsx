import type { Metadata } from "next";
import QuoteClient from "@/components/quote/QuoteClient";
import {
  createQuoteReference,
  readQuotePrefill,
  type QuoteForm,
} from "@/lib/quote-request";
import { buildMetadata } from "@/lib/seo";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildMetadata({
  title: "Request a Quote",
  description:
    "Request a quote for electrical installation in Lagos, wiring and cables in Ikorodu, lighting, CCTV, and solar inverter installation Lagos projects from Oduzz Electrical Concept.",
  path: "/quote",
  keywords: [
    "electrical quote",
    "electrical installation in Lagos",
    "wiring and cables in Ikorodu",
    "lighting installation Lagos",
    "solar inverter installation Lagos",
    "verified electrical materials",
  ],
});

function buildSearchString(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (typeof firstValue === "string" && firstValue.trim()) {
      params.set(key, firstValue);
    }
  });

  const search = params.toString();
  return search ? `?${search}` : "";
}

export default async function QuotePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const prefill = readQuotePrefill(buildSearchString(resolvedSearchParams));
  const initialReferenceId = prefill.form.referenceId || createQuoteReference();
  const initialForm: QuoteForm = {
    ...prefill.form,
    imageUrls: [],
    referenceId: initialReferenceId,
  };
  const hasPrefill = Object.values(prefill.form).some((value) => String(value || "").trim());
  const initialStatusText = hasPrefill
    ? prefill.source === "assistant"
      ? "Assistant details loaded. Review and send when ready."
      : "Quote details loaded. Review and send when ready."
    : "";
  const initialStatusType = hasPrefill ? "success" : "";

  return (
    <QuoteClient
      initialForm={initialForm}
      initialSource={prefill.source}
      initialStatusText={initialStatusText}
      initialStatusType={initialStatusType}
    />
  );
}
