import { assistantFlows, assistantFlowOrder, type AssistantFlowId } from "@/lib/assistant-flows";
import type { ConsultationIntent } from "@/lib/ai/intent-context";
import styles from "./AssistantClient.module.css";

type QuickActionsProps = {
  activeIntent: ConsultationIntent | null;
  flowIntents: Record<AssistantFlowId, ConsultationIntent>;
  disabled?: boolean;
  onSelect: (flowId: AssistantFlowId) => void;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function QuickActions({
  activeIntent,
  flowIntents,
  disabled,
  onSelect,
}: QuickActionsProps) {
  return (
    <div className={styles.quickChipRow} aria-label="Assistant services">
      {assistantFlowOrder.map((flowId) => {
        const flow = assistantFlows[flowId];

        return (
          <button
            key={flow.id}
            type="button"
            className={cn(
              styles.quickChip,
              activeIntent === flowIntents[flow.id] && styles.quickChipActive,
            )}
            onClick={() => onSelect(flow.id)}
            disabled={disabled}
          >
            {flow.chipLabel}
          </button>
        );
      })}
    </div>
  );
}
