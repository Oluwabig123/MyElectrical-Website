import React from "react";
import { Link } from "react-router-dom";
import Container from "../../components/layout/Container";
import SectionHeader from "../../components/ui/SectionHeader";
import Reveal from "../../components/ui/Reveal";
import { ADMIN_PRODUCTS_TABLE, supabase } from "../../lib/supabaseClient";
import { fetchOnlineProducts } from "../../lib/productDirectory";
import { buildProductPath, selectMixedProducts } from "../../utils/productCatalog";

const DESKTOP_PRODUCT_LIMIT = 10;

export default function FeaturedProducts() {
  const [products, setProducts] = React.useState([]);

  const loadProducts = React.useCallback(async () => {
    const { products: onlineProducts, error } = await fetchOnlineProducts();

    if (error) {
      setProducts([]);
      return;
    }

    setProducts(onlineProducts);
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel("home-featured-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ADMIN_PRODUCTS_TABLE },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const featuredProducts = React.useMemo(
    () => selectMixedProducts(products, DESKTOP_PRODUCT_LIMIT),
    [products]
  );

  if (!featuredProducts.length) return null;

  return (
    <section className="section featuredProductsHome">
      <Container>
        <div className="featuredProductsHomeShell">
          <SectionHeader
            kicker="Featured Products"
            title="Available products"
            subtitle="A quick look at current online stock."
          />

          <div className="featuredProductsHomeGrid">
            {featuredProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.03}>
                <Link to={buildProductPath(product)} className="featuredProductsHomeCard">
                  <div className="featuredProductsHomeMedia">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.categoryLabel}
                        className="featuredProductsHomeImage"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="featuredProductsHomeFallback" aria-hidden="true">
                        Oduzz
                      </div>
                    )}
                  </div>
                  <h3 className="featuredProductsHomeName">{product.categoryLabel}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
