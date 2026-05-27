import { runConsultationOrchestrator } from "@/lib/ai/consultation-orchestrator";

const prompts = [
  "Help me size my solar system",
  "Help estimate it",
  "I have a 24V 3kVA transformerless inverter and I want to power TV, freezer, laptop, 3 fans, and 8 bulbs for 6 hours. What battery size, panels, and protections do I need?",
  "Tell me about your company",
  "Fans and bulbs for 4 hours",
  "100W",
  "What is the next useful step?",
];

async function main() {
  let messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let state: unknown = undefined;

  for (const [index, prompt] of prompts.entries()) {
    messages = [...messages, { role: "user" as const, content: prompt }].slice(-12);
    const result = await runConsultationOrchestrator({ messages, state: state as never });

    console.log(`\n#${String.fromCharCode(65 + index)} ${prompt}`);
    console.log(`intent=${result.state.intent || "none"} child=${result.state.childState || "none"}`);
    console.log(`guidedPaused=${Boolean(result.state.guidedPaused)} missing=${JSON.stringify(result.state.missing)}`);
    console.log(`usedKnowledgeBase=${result.usedKnowledgeBase}`);
    console.log(`answer=${result.answer.replace(/\n/g, " | ")}`);

    messages = [...messages, { role: "assistant" as const, content: result.answer }].slice(-12);
    state = result.state;
  }
}

void main();
