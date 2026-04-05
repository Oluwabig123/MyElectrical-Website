import type { Metadata } from "next";
import AssistantClient from "@/components/assistant/AssistantClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Electrical Assistant",
  description:
    "Use the Oduzz assistant for guided electrical questions, quote preparation, and solar or inverter planning flows.",
  path: "/assistant",
  keywords: ["electrical assistant", "quote assistant", "solar sizing assistant"],
});

export default function AssistantPage() {
  return <AssistantClient />;
}
