import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildCollectionPath, buildProductCatalog } from "@/lib/product-catalog";
import { fetchOnlineProducts } from "@/lib/product-directory";

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
  const { products } = await fetchOnlineProducts();
  const { groups } = buildProductCatalog(products);
  const categoryCards = groups
    .flatMap<CategoryCard>((group) => {
      const representative = group.items.find((item) => item.imageUrl) ?? group.items[0];
      if (!representative?.imageUrl) return [];

      return [{
        id: group.key,
        categoryLabel: group.label,
        helperLabel: `${group.items.length} product${group.items.length === 1 ? "" : "s"}`,
        badgeLabel: "Top Selling",
        badgeTone: "warm",
        imageUrl: representative.imageUrl,
        href: buildCollectionPath(group.key),
      }];
    })
    .slice(0, 4)
    .map((card, index) => ({
      ...card,
      badgeLabel: index < 2 ? "Top Selling" : "In Stock",
      badgeTone: index < 2 ? "warm" : "cool",
    }));

  if (categoryCards.length === 0) {
    return null;
  }

  return (
    <section className="section featuredProductsHome">
      <Container>
        <div className="featuredProductsHomeShell">
          <SectionHeader
            kicker="Shop solar, CCTV, and lighting supplies"
            title="Electrical materials for cleaner installs"
            subtitle="Browse the categories clients ask for most when planning wiring, lighting, CCTV, and backup power."
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
