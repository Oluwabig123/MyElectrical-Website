import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildCollectionPath, buildProductCatalog } from "@/lib/product-catalog";
import { fetchOnlineProductsCached } from "@/lib/product-directory-server";

type CategoryCard = {
  id: string;
  categoryLabel: string;
  helperLabel: string;
  badgeLabel: string;
  badgeTone: "warm" | "cool";
  imageUrl: string;
  href: string;
};

export default async function FeaturedProducts() {
  const { products } = await fetchOnlineProductsCached();
  const { groups } = buildProductCatalog(products);
  const rankedGroups = [...groups].sort((left, right) => {
    const leftFeatured = left.items.filter((item) => item.featured).length;
    const rightFeatured = right.items.filter((item) => item.featured).length;
    if (leftFeatured !== rightFeatured) return rightFeatured - leftFeatured;
    if (left.items.length !== right.items.length) return right.items.length - left.items.length;
    return left.label.localeCompare(right.label);
  });

  const curatedGroups = rankedGroups.filter((group) => group.items.length >= 2);
  const fallbackGroups = rankedGroups.filter((group) => group.items.length === 1);
  const displayGroups = [...curatedGroups, ...fallbackGroups].slice(0, 4);

  const categoryCards = displayGroups
    .flatMap<CategoryCard>((group) => {
      const representative = group.items.find((item) => item.imageUrl) ?? group.items[0];
      if (!representative?.imageUrl) return [];
      const featuredCount = group.items.filter((item) => item.featured).length;
      const helperLabel =
        group.items.length >= 4
          ? `${group.items.length} stocked products`
          : group.items.length >= 2
            ? `${group.items.length} curated products`
            : "Curated specification";

      return [{
        id: group.key,
        categoryLabel: group.label,
        helperLabel,
        badgeLabel: featuredCount > 0 ? "Flagship Stock" : "Project-Ready",
        badgeTone: featuredCount > 0 ? "warm" : "cool",
        imageUrl: representative.imageUrl,
        href: buildCollectionPath(group.key),
      }];
    });

  if (categoryCards.length === 0) {
    return null;
  }

  return (
    <section className="section featuredProductsHome">
      <Container>
        <div className="featuredProductsHomeShell">
          <SectionHeader
            kicker="Curated supply"
            title="Project materials grouped by use"
            subtitle="Start with the installation scope, then narrow the materials."
          />

          <div className="featuredProductsHomeGrid">
            {categoryCards.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.03}>
                <Link href={product.href} className="featuredProductsHomeCard">
                  <span
                    className={`featuredProductsHomeBadge ${product.badgeTone === "warm" ? "is-warm" : "is-cool"}`}
                  >
                    {product.badgeLabel}
                  </span>
                  <div className="featuredProductsHomeMedia">
                    <Image
                      src={product.imageUrl}
                      alt={product.categoryLabel}
                      className="featuredProductsHomeImage"
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, (max-width: 980px) 50vw, 25vw"
                    />
                  </div>
                  <div className="featuredProductsHomeBody">
                    <div className="featuredProductsHomeText">
                      <span className="featuredProductsHomeHelper">{product.helperLabel}</span>
                      <h3 className="featuredProductsHomeName">{product.categoryLabel}</h3>
                    </div>
                    <span className="featuredProductsHomeArrow" aria-hidden="true">
                      &gt;
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="featuredProductsHomeFoot">
            <Link href="/products" className="btn primary featuredProductsHomeCta">
              Browse All Products
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
