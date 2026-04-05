import type { Metadata } from "next";
import MemoryGameClient from "@/components/games/MemoryGameClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Test Your Memory",
  description:
    "Play the branded Oduzz memory game and test recall with a lightweight interactive experience.",
  path: "/test-your-memory",
  keywords: ["memory game", "oduzz game", "interactive game"],
});

export default function MemoryGamePage() {
  return <MemoryGameClient />;
}
