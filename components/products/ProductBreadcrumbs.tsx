import Link from "next/link";
import styles from "./ProductBreadcrumbs.module.css";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ProductBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function ProductBreadcrumbs({ items }: ProductBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {item.href && !isCurrent ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current={isCurrent ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
