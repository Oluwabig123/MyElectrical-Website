import React from "react";
import { Link, useParams } from "react-router-dom";
import Container from "../components/layout/Container";
import Reveal from "../components/ui/Reveal";
import SEO from "../components/ui/SEO";
import { CONTACT, buildWhatsAppUrl } from "../data/contact";
import { fetchOnlineProducts } from "../lib/productDirectory";
import {
  buildProductPath,
  formatProductPrice,
  getProductAvailability,
} from "../utils/productCatalog";

const PAYSTACK_UNAVAILABLE_MESSAGE =
  "Online card payment is being finalized. Please place this order on WhatsApp for now.";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildProductPurchaseMessage(product) {
  const lines = [
    "Hello Oduzz, I want to buy this product.",
    `Product: ${product.name}`,
    `Slug: ${product.slug || product.id}`,
    `Price: ${formatProductPrice(product)}`,
    `Availability: ${getProductAvailability(product)}`,
    `Size/Spec: ${product.size || "N/A"}`,
    `Type: ${product.type || "N/A"}`,
  ];

  return lines.join("\n");
}

function buildRelatedProducts(products, currentProduct, limit = 4) {
  const sameCategory = [];
  const others = [];

  products.forEach((product) => {
    if (!product || product.id === currentProduct.id) return;
    if (product.category === currentProduct.category) {
      sameCategory.push(product);
      return;
    }
    others.push(product);
  });

  return [...sameCategory, ...others].slice(0, limit);
}

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const [product, setProduct] = React.useState(null);
  const [relatedProducts, setRelatedProducts] = React.useState([]);
  const [status, setStatus] = React.useState("loading");

  const isPaystackEnabled = import.meta.env.VITE_PAYSTACK_ENABLED === "true";

  React.useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setStatus("loading");

      const { products, error } = await fetchOnlineProducts();
      if (!isMounted) return;

      if (error) {
        setStatus("error");
        setProduct(null);
        setRelatedProducts([]);
        return;
      }

      const selectedProduct = products.find((item) => item.slug === sanitizeText(slug));
      if (!selectedProduct) {
        setStatus("missing");
        setProduct(null);
        setRelatedProducts([]);
        return;
      }

      setProduct(selectedProduct);
      setRelatedProducts(buildRelatedProducts(products, selectedProduct));
      setStatus("ready");
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const whatsappUrl = React.useMemo(() => {
    if (!product) return "";
    return buildWhatsAppUrl(encodeURIComponent(buildProductPurchaseMessage(product)));
  }, [product]);

  return (
    <section className="section productDetailPage">
      <Container>
        <SEO
          title={
            product
              ? `${product.name} | Oduzz Electrical Concept`
              : "Product details | Oduzz Electrical Concept"
          }
          description={
            product
              ? `${product.name}. ${product.bestFor} View current stock direction and contact Oduzz for ordering.`
              : "View electrical product details from Oduzz Electrical Concept."
          }
        />

        <div className="productDetailTopbar">
          <Link to="/products" className="productDetailBackLink">
            Back to products
          </Link>
          {product ? <span className="productDetailCategory">{product.categoryLabel}</span> : null}
        </div>

        {status === "loading" ? (
          <div className="card productDetailLoading">Loading product details...</div>
        ) : null}

        {status === "error" ? (
          <div className="card productDetailLoading">
            Product details are unavailable right now. Please try again or continue on WhatsApp.
          </div>
        ) : null}

        {status === "missing" ? (
          <div className="card productDetailMissing">
            <h2 className="productDetailMissingTitle">Product not found</h2>
            <p className="productDetailMissingText">
              This product may have been removed or its slug may have changed. Continue with the live
              catalog instead.
            </p>
            <div className="productDetailActions">
              <Link to="/products" className="btn primary">
                View products
              </Link>
              <a href={CONTACT.whatsappNumber ? buildWhatsAppUrl() : "#"} target="_blank" rel="noreferrer" className="btn outline">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        ) : null}

        {status === "ready" && product ? (
          <>
            <Reveal delay={0.03}>
              <div className="productDetailHero">
                <div className="card productDetailMediaCard">
                  <div className="productDetailMedia">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="productDetailImage"
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <div className="productDetailFallback" aria-hidden="true">
                        Oduzz
                      </div>
                    )}
                  </div>
                </div>

                <div className="card productDetailSummary">
                  <p className="productDetailKicker">Available product</p>
                  <h1 className="productDetailTitle">{product.name}</h1>
                  <p className="productDetailLead">{product.bestFor}</p>

                  <div className="productDetailPriceRow">
                    <strong className="productDetailPrice">{formatProductPrice(product)}</strong>
                    <span className={`productsStock ${getProductAvailability(product).toLowerCase().replace(/\s+/g, "-")}`}>
                      {getProductAvailability(product)}
                    </span>
                  </div>

                  <div className="productsMeta" aria-label={`${product.name} specifications`}>
                    <span className="productsChip">Size: {product.size}</span>
                    <span className="productsChip">{product.type}</span>
                    <span className="productsChip">{product.categoryLabel}</span>
                  </div>

                  <div className="productDetailActions">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn primary">
                      Buy on WhatsApp
                    </a>
                    <button type="button" className="btn outline" disabled={!isPaystackEnabled}>
                      {isPaystackEnabled ? "Checkout online" : "Checkout coming soon"}
                    </button>
                  </div>

                  {!isPaystackEnabled ? (
                    <p className="formStatus info productDetailStatus">{PAYSTACK_UNAVAILABLE_MESSAGE}</p>
                  ) : null}

                  <div className="productDetailSupportMeta">
                    <span>WhatsApp response: {CONTACT.whatsappResponseTime}</span>
                    <span>Stock shown online can change with current restock.</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="productDetailGrid">
              <Reveal delay={0.06}>
                <article className="card productDetailInfo">
                  <h2 className="productDetailSectionTitle">Product details</h2>
                  <p className="productDetailBody">
                    {product.name} is currently listed in the {product.categoryLabel.toLowerCase()} category.
                    Use the size and type notes below to confirm fit before ordering.
                  </p>
                  <div className="productDetailFacts">
                    <div className="productDetailFact">
                      <span className="productDetailFactLabel">Best for</span>
                      <strong>{product.bestFor}</strong>
                    </div>
                    <div className="productDetailFact">
                      <span className="productDetailFactLabel">Type</span>
                      <strong>{product.type}</strong>
                    </div>
                    <div className="productDetailFact">
                      <span className="productDetailFactLabel">Size / spec</span>
                      <strong>{product.size}</strong>
                    </div>
                    <div className="productDetailFact">
                      <span className="productDetailFactLabel">Availability</span>
                      <strong>{getProductAvailability(product)}</strong>
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.09}>
                <aside className="card productDetailSupport">
                  <h2 className="productDetailSectionTitle">Need help choosing?</h2>
                  <p className="productDetailBody">
                    If you are unsure about the right cable size, fitting, or accessory match, send the
                    intended use and location and Oduzz will help narrow it down.
                  </p>
                  <div className="productDetailSupportActions">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn outline">
                      Ask about this product
                    </a>
                    <Link to="/quote" className="btn primary">
                      Request product quote
                    </Link>
                  </div>
                </aside>
              </Reveal>
            </div>

            {relatedProducts.length ? (
              <Reveal delay={0.12}>
                <div className="productDetailRelated">
                  <div className="productDetailRelatedHead">
                    <div>
                      <p className="productDetailRelatedLabel">More products</p>
                      <h2 className="productDetailSectionTitle">Related items</h2>
                    </div>
                    <Link to="/products" className="productDetailBackLink">
                      View all
                    </Link>
                  </div>

                  <div className="productDetailRelatedGrid">
                    {relatedProducts.map((item) => (
                      <Link key={item.id} to={buildProductPath(item)} className="card productDetailRelatedCard">
                        <div className="productDetailRelatedMedia">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="productDetailRelatedImage"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="productDetailFallback" aria-hidden="true">
                              Oduzz
                            </div>
                          )}
                        </div>
                        <h3 className="productDetailRelatedName">{item.name}</h3>
                        <strong className="productDetailRelatedPrice">{formatProductPrice(item)}</strong>
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </>
        ) : null}
      </Container>
    </section>
  );
}
