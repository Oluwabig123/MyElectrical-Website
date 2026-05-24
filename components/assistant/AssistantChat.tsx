import { Fragment, type ReactNode, type RefObject } from "react";
import styles from "./AssistantClient.module.css";

export type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
  isSafety?: boolean;
  usedKnowledgeBase?: boolean;
};

type AssistantChatProps = {
  messages: AssistantMessage[];
  isResponding: boolean;
  assistantStatus: string;
  bodyRef: RefObject<HTMLDivElement | null>;
  children?: ReactNode;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function renderMessageText(text: string) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, blockIndex) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const isListBlock =
        lines.length > 1 && lines.every((line) => /^(\d+\.\s|[-*]\s)/.test(line));

      if (isListBlock) {
        return (
          <ol key={`list-${blockIndex}`} className={styles.messageList}>
            {lines.map((line, lineIndex) => (
              <li key={`${blockIndex}-${lineIndex}`}>{line.replace(/^(\d+\.\s|[-*]\s)/, "")}</li>
            ))}
          </ol>
        );
      }

      return (
        <p key={`text-${blockIndex}`} className={styles.messageText}>
          {lines.map((line, lineIndex) => (
            <Fragment key={`${blockIndex}-${lineIndex}`}>
              {lineIndex > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </p>
      );
    });
}

export default function AssistantChat({
  messages,
  isResponding,
  assistantStatus,
  bodyRef,
  children,
}: AssistantChatProps) {
  return (
    <div className={styles.chatThread} ref={bodyRef} role="log" aria-live="polite">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={cn(styles.messageRow, message.role === "user" && styles.messageRowUser)}
        >
          <div
            className={cn(
              styles.messageContent,
              message.role === "user" && styles.messageContentUser,
            )}
          >
            <span className={styles.srOnly}>{message.role === "user" ? "You" : "Oduzz AI"}</span>
            <div
              className={cn(
                styles.messageBubble,
                message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant,
                message.isSafety && styles.messageBubbleSafety,
              )}
            >
              {renderMessageText(message.text)}
            </div>
            {message.usedKnowledgeBase ? (
              <p className={styles.messageSourceTag}>Based on Oduzz knowledge base</p>
            ) : null}
          </div>
        </div>
      ))}

      {isResponding ? (
        <div className={styles.messageRow} aria-label="Assistant is typing">
          <div className={styles.messageContent}>
            <span className={styles.srOnly}>Oduzz AI</span>
            <div
              className={cn(
                styles.messageBubble,
                styles.messageBubbleAssistant,
                styles.messageBubbleTyping,
              )}
              aria-hidden="true"
            >
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        </div>
      ) : null}

      {assistantStatus ? (
        <p className={styles.chatNotice} role="status">
          {assistantStatus}
        </p>
      ) : null}

      {children}
    </div>
  );
}
