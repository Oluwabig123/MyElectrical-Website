import type { Metadata } from "next";
import AssistantClient from "@/components/assistant/AssistantClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Oduzz AI Electrical Assistant | Solar, Wiring, CCTV & Lighting Help in Lagos",
  description:
    "Chat with the Oduzz Electrical Concept AI assistant for solar sizing, electrical materials, wiring support, lighting recommendations, CCTV planning, and quote requests in Lagos.",
  path: "/assistant",
  keywords: [
    "electrical assistant Lagos",
    "solar sizing Lagos",
    "wiring help Ikorodu",
    "CCTV installation Lagos",
    "lighting recommendation",
    "electrical materials Nigeria",
    "Oduzz Electrical Concept",
  ],
});

export default function AssistantPage() {
  return <AssistantClient />;
}
