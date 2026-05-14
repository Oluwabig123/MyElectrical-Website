import styles from "./FaqAccordion.module.css";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export default function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className={styles.list}>
      {items.map((faq) => (
        <details key={faq.question} className={styles.item}>
          <summary className={styles.summary}>{faq.question}</summary>
          <p className={styles.answer}>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
