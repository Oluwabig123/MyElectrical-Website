import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import {
  buildProductPath,
  buildProductTagline,
  formatProductPrice,
  getProductAvailability,
  type Product,
} from "@/lib/product-catalog";
import styles from "./ProductCard.module.css";

type ProductCardVariant = "listing" | "related" | "collection";

type ProductCardProps = {
  product: Product;
  variant?: ProductCardVariant;
  priority?: boolean;
  showCategory?: boolean;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function toStateClassName(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export default function ProductCard({
  product,
  variant = "listing",
  priority = false,
  showCategory,
}: ProductCardProps) {
  const availability = getProductAvailability(product);
  const priceLabel = formatProductPrice(product);
  const showCategoryLabel = showCategory ?? variant !== "related";
  const showState = true;
  const showFeaturedBadge = product.featured && !showState;
  const isCompactVariant = variant === "related" || variant === "collection";
  const productTagline = buildProductTagline(product);
  const availabilityClass = toStateClassName(availability);
  const badgeClass =
    availabilityClass === "in-stock"
      ? styles.badgeInStock
      : availabilityClass === "low-stock"
      ? styles.badgeLowStock
      : availabilityClass === "out-of-stock" || availabilityClass === "inactive"
        ? styles.badgeUnavailable
        : "";

  return (
    <Link
      href={buildProductPath(product)}
      className={styles.card}
      data-variant={variant}
      aria-label={`${product.name} - ${priceLabel}`}
    >
      <div
        className={cn(
          styles.media,
          isCompactVariant && styles.mediaSquare,
          product.featured && styles.featuredMedia,
        )}
      >
        {product.imageUrl ? (
          <SmartImage
            src={product.imageUrl}
            alt={product.name}
            className={styles.image}
            fill
            priority={priority}
            sizes={
              variant === "listing"
                ? "(max-width: 768px) 100vw, (max-width: 1180px) 33vw, 25vw"
                : "(max-width: 768px) 100vw, 25vw"
            }
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">
            Oduzz
          </div>
        )}

        {showState ? (
          <span className={cn(styles.badge, badgeClass)}>{availability}</span>
        ) : showFeaturedBadge ? (
          <span className={cn(styles.badge, styles.badgeFeatured)}>Featured</span>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.metaRow}>
          {showCategoryLabel ? <p className={styles.eyebrow}>{product.categoryLabel}</p> : null}
          <span className={styles.metaLink}>View details</span>
        </div>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.summary}>{productTagline}</p>
        <div className={styles.footer}>
          <strong className={styles.price}>{priceLabel}</strong>
        </div>
      </div>
    </Link>
  );
}
