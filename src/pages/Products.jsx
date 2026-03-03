import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { CONTACT } from "../data/contact";
import { cableProducts } from "../data/products";
import {
  buildProductCatalog,
  getCategoryLabel,
  inferProductCategory,
} from "../utils/productCatalog";

const ADMIN_PRODUCTS_STORAGE_KEY = "oduzz-admin-products-v1";

const EMPTY_ADMIN_FORM = {
  name: "",
  size: "",
  type: "",
  bestFor: "",
};

function sanitizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createAdminProductId(name) {
  const slug = sanitizeValue(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `admin-${slug || "product"}-${Date.now()}`;
}

function normalizeAdminPayload(formValues) {
  return {
    name: sanitizeValue(formValues.name),
    size: sanitizeValue(formValues.size) || "N/A",
    type: sanitizeValue(formValues.type) || "Electrical item",
    bestFor: sanitizeValue(formValues.bestFor) || "General electrical use",
  };
}

function validateAdminPayload(payload) {
  if (!payload.name) return "Product name is required.";
  if (!payload.bestFor) return "Add a short best-for note.";
  return "";
}

function readAdminProductsFromStorage() {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(ADMIN_PRODUCTS_STORAGE_KEY);
    if (!storedValue) return [];

    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        id: sanitizeValue(item.id) || createAdminProductId(`product-${index + 1}`),
        name: sanitizeValue(item.name),
        size: sanitizeValue(item.size),
        type: sanitizeValue(item.type),
        bestFor: sanitizeValue(item.bestFor),
      }))
      .filter((item) => item.name);
  } catch {
    return [];
  }
}

export default function Products() {
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [adminForm, setAdminForm] = React.useState(EMPTY_ADMIN_FORM);
  const [editingProductId, setEditingProductId] = React.useState(null);
  const [adminProducts, setAdminProducts] = React.useState(readAdminProductsFromStorage);
  const [formStatus, setFormStatus] = React.useState({ type: "", message: "" });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, JSON.stringify(adminProducts));
    } catch {
      setFormStatus({
        type: "error",
        message: "Could not save admin products to this browser.",
      });
    }
  }, [adminProducts]);

  const mergedProducts = React.useMemo(
    () => [...cableProducts, ...adminProducts],
    [adminProducts]
  );

  const catalog = React.useMemo(() => buildProductCatalog(mergedProducts), [mergedProducts]);
  const adminCatalog = React.useMemo(() => buildProductCatalog(adminProducts), [adminProducts]);

  const categoryPreviewLabel = React.useMemo(() => {
    const draftCategory = inferProductCategory(adminForm);
    return getCategoryLabel(draftCategory);
  }, [adminForm]);

  function handleFormInputChange(event) {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAdminForm() {
    setAdminForm(EMPTY_ADMIN_FORM);
    setEditingProductId(null);
  }

  function handleAdminSubmit(event) {
    event.preventDefault();

    const payload = normalizeAdminPayload(adminForm);
    const validationError = validateAdminPayload(payload);
    if (validationError) {
      setFormStatus({ type: "error", message: validationError });
      return;
    }

    if (editingProductId) {
      setAdminProducts((prev) =>
        prev.map((item) =>
          item.id === editingProductId
            ? {
                ...item,
                ...payload,
              }
            : item
        )
      );
      setFormStatus({
        type: "success",
        message: "Product updated and re-grouped automatically.",
      });
    } else {
      setAdminProducts((prev) => [
        ...prev,
        {
          id: createAdminProductId(payload.name),
          ...payload,
        },
      ]);
      setFormStatus({
        type: "success",
        message: "Product added and placed in category automatically.",
      });
    }

    resetAdminForm();
  }

  function startEditProduct(productId) {
    const selectedProduct = adminProducts.find((item) => item.id === productId);
    if (!selectedProduct) return;

    setIsAdminOpen(true);
    setEditingProductId(productId);
    setAdminForm({
      name: selectedProduct.name,
      size: selectedProduct.size,
      type: selectedProduct.type,
      bestFor: selectedProduct.bestFor,
    });
    setFormStatus({ type: "", message: "" });
  }

  function handleDeleteProduct(productId) {
    if (typeof window !== "undefined") {
      const approved = window.confirm("Delete this admin product?");
      if (!approved) return;
    }

    setAdminProducts((prev) => prev.filter((item) => item.id !== productId));
    if (editingProductId === productId) {
      resetAdminForm();
    }
    setFormStatus({ type: "success", message: "Product removed." });
  }

  const totalProducts = catalog.items.length;
  const totalCategories = catalog.groups.length;

  return (
    <section className="section productsPage">
      <Container>
        <SectionHeader
          kicker="Products"
          title="Available electrical products"
          subtitle="Default stock plus admin-added products, automatically grouped by category."
        />

        <Reveal delay={0.04}>
          <article className="card productsAdminShell">
            <div className="productsAdminHead">
              <div className="productsAdminHeadCopy">
                <h3 className="productsAdminTitle">Admin product manager</h3>
                <p className="productsAdminLead">
                  Phone-friendly add/edit panel. Products saved here stay on this device and auto-slot into
                  matching categories.
                </p>
              </div>
              <Button
                type="button"
                variant={isAdminOpen ? "outline" : "primary"}
                onClick={() => setIsAdminOpen((prev) => !prev)}
              >
                {isAdminOpen ? "Hide manager" : "Open manager"}
              </Button>
            </div>

            {isAdminOpen ? (
              <div className="productsAdminBody">
                <form className="form productsAdminForm" onSubmit={handleAdminSubmit}>
                  <p className="productsAdminAutoCategory">
                    Auto category: <strong>{categoryPreviewLabel}</strong>
                  </p>
                  <label className="field">
                    <span>Product name *</span>
                    <input
                      type="text"
                      name="name"
                      value={adminForm.name}
                      onChange={handleFormInputChange}
                      placeholder="e.g. 12W LED panel light"
                    />
                  </label>
                  <label className="field">
                    <span>Size / spec</span>
                    <input
                      type="text"
                      name="size"
                      value={adminForm.size}
                      onChange={handleFormInputChange}
                      placeholder="e.g. 12W, 2.5mm, 100Ah"
                    />
                  </label>
                  <label className="field">
                    <span>Type</span>
                    <input
                      type="text"
                      name="type"
                      value={adminForm.type}
                      onChange={handleFormInputChange}
                      placeholder="e.g. LED fixture, Copper single core"
                    />
                  </label>
                  <label className="field">
                    <span>Best for *</span>
                    <textarea
                      rows={3}
                      name="bestFor"
                      value={adminForm.bestFor}
                      onChange={handleFormInputChange}
                      placeholder="Where this product is typically used"
                    />
                  </label>

                  <div className="formActions productsAdminFormActions">
                    <Button type="submit" variant="primary">
                      {editingProductId ? "Update product" : "Add product"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetAdminForm}>
                      {editingProductId ? "Cancel edit" : "Clear form"}
                    </Button>
                  </div>

                  {formStatus.message ? (
                    <p className={`formStatus ${formStatus.type}`}>{formStatus.message}</p>
                  ) : null}
                </form>

                <div className="productsAdminListWrap">
                  <h4 className="productsAdminListTitle">
                    Admin products ({adminCatalog.items.length})
                  </h4>
                  {adminCatalog.items.length === 0 ? (
                    <p className="productsAdminEmpty">No admin products yet.</p>
                  ) : (
                    <ul className="productsAdminList">
                      {adminCatalog.items.map((item) => (
                        <li key={item.id} className="productsAdminItem">
                          <div className="productsAdminItemCopy">
                            <p className="productsAdminItemName">{item.name}</p>
                            <p className="productsAdminItemMeta">
                              {item.categoryLabel} • {item.size} • {item.type}
                            </p>
                          </div>
                          <div className="productsAdminItemActions">
                            <Button type="button" variant="outline" onClick={() => startEditProduct(item.id)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="productsDangerBtn"
                              onClick={() => handleDeleteProduct(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        </Reveal>

        <p className="productsSummary">
          Showing {totalProducts} products across {totalCategories} categories.
        </p>

        {catalog.groups.map((group, groupIndex) => (
          <section className="productsCategorySection" key={group.key}>
            <div className="productsCategoryHead">
              <h3 className="productsCategoryTitle">{group.label}</h3>
              <span className="productsCategoryCount">
                {group.items.length} item{group.items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="productsGrid">
              {group.items.map((item, index) => (
                <Reveal key={item.id} delay={groupIndex * 0.06 + index * 0.03}>
                  <article className="card productsCard">
                    <span className="productsIndex">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="cardTitle productsTitle">{item.name}</h3>
                    <p className="p">{item.bestFor}</p>
                    <div className="productsMeta" aria-label={`${item.name} specifications`}>
                      <span className="productsChip">Size: {item.size}</span>
                      <span className="productsChip">{item.type}</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        <Reveal delay={0.14}>
          <div className="productsFoot">
            <p className="productsNote">
              Need help selecting the right cable size? We respond in {CONTACT.whatsappResponseTime}.
            </p>
            <div className="productsActions">
              <Link to="/quote"><Button variant="primary">Request quote</Button></Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
