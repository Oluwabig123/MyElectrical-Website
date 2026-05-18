import type { Metadata } from "next";
import AssistantClient from "@/components/assistant/AssistantClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Oduzz AI | Electrical Planning Assistant",
  description:
    "Chat with Oduzz AI for solar sizing, wiring guidance, lighting planning, and quote preparation.",
  path: "/assistant",
  keywords: ["Oduzz AI", "electrical assistant", "quote assistant", "solar sizing assistant"],
});

export default function AssistantPage() {
  return <AssistantClient />;
}
