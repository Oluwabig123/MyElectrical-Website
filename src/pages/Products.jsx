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
  normalizeProduct,
} from "../utils/productCatalog";
import {
  ADMIN_PRODUCTS_TABLE,
  isSupabaseConfigured,
  supabase,
} from "../lib/supabaseClient";

const EMPTY_ADMIN_FORM = {
  name: "",
  size: "",
  type: "",
  bestFor: "",
};

const EMPTY_AUTH_FORM = {
  email: "",
  password: "",
};

function sanitizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
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

function mapCloudRowToProduct(row) {
  return normalizeProduct(
    {
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      bestFor: row.best_for,
      category: row.category,
    },
    row.id
  );
}

function formatSupabaseError(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  return sanitizeValue(error.message) || fallbackMessage;
}

export default function Products() {
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [adminForm, setAdminForm] = React.useState(EMPTY_ADMIN_FORM);
  const [authForm, setAuthForm] = React.useState(EMPTY_AUTH_FORM);
  const [editingProductId, setEditingProductId] = React.useState(null);
  const [cloudProducts, setCloudProducts] = React.useState([]);
  const [authSession, setAuthSession] = React.useState(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = React.useState(true);
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);
  const [deletingProductId, setDeletingProductId] = React.useState("");
  const [catalogError, setCatalogError] = React.useState("");
  const [formStatus, setFormStatus] = React.useState({ type: "", message: "" });
  const [authStatus, setAuthStatus] = React.useState({ type: "", message: "" });

  const isAuthenticated = Boolean(authSession?.user);

  const mergedProducts = React.useMemo(
    () => [...cableProducts, ...cloudProducts],
    [cloudProducts]
  );

  const catalog = React.useMemo(() => buildProductCatalog(mergedProducts), [mergedProducts]);
  const adminCatalog = React.useMemo(() => buildProductCatalog(cloudProducts), [cloudProducts]);

  const categoryPreviewLabel = React.useMemo(() => {
    const draftCategory = inferProductCategory(adminForm);
    return getCategoryLabel(draftCategory);
  }, [adminForm]);

  const loadCloudProducts = React.useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudProducts([]);
      setCatalogError("Supabase is not configured yet. Add env keys to enable online product updates.");
      setIsCatalogLoading(false);
      return;
    }

    setIsCatalogLoading(true);
    setCatalogError("");

    const { data, error } = await supabase
      .from(ADMIN_PRODUCTS_TABLE)
      .select("id,name,size,type,best_for,category,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setCatalogError(formatSupabaseError(error, "Could not load cloud products."));
      setCloudProducts([]);
      setIsCatalogLoading(false);
      return;
    }

    setCloudProducts((data || []).map(mapCloudRowToProduct));
    setIsCatalogLoading(false);
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setAuthSession(null);
      setIsAuthLoading(false);
      return undefined;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setAuthStatus({
            type: "error",
            message: formatSupabaseError(error, "Could not check admin session."),
          });
        }
        setAuthSession(data.session || null);
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setAuthSession(session || null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    loadCloudProducts();
  }, [loadCloudProducts]);

  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    const channel = supabase
      .channel("admin-products-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ADMIN_PRODUCTS_TABLE },
        () => {
          loadCloudProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCloudProducts]);

  function handleFormInputChange(event) {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAuthInputChange(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAdminForm() {
    setAdminForm(EMPTY_ADMIN_FORM);
    setEditingProductId(null);
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;

    const email = sanitizeValue(authForm.email);
    const password = sanitizeValue(authForm.password);
    if (!email || !password) {
      setAuthStatus({ type: "error", message: "Enter your admin email and password." });
      return;
    }

    setIsAuthLoading(true);
    setAuthStatus({ type: "", message: "" });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthStatus({
        type: "error",
        message: formatSupabaseError(error, "Sign-in failed."),
      });
      setIsAuthLoading(false);
      return;
    }

    setAuthForm((prev) => ({ ...prev, password: "" }));
    setAuthStatus({ type: "success", message: "Signed in. You can now manage cloud products." });
    setIsAuthLoading(false);
  }

  async function handleAdminLogout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthStatus({
        type: "error",
        message: formatSupabaseError(error, "Could not sign out."),
      });
      return;
    }

    resetAdminForm();
    setAuthStatus({ type: "success", message: "Signed out." });
  }

  async function handleAdminSubmit(event) {
    event.preventDefault();
    if (!supabase || !isAuthenticated) {
      setFormStatus({ type: "error", message: "Sign in first to manage products." });
      return;
    }

    const payload = normalizeAdminPayload(adminForm);
    const validationError = validateAdminPayload(payload);
    if (validationError) {
      setFormStatus({ type: "error", message: validationError });
      return;
    }

    const inferredCategory = inferProductCategory(payload);
    setIsSavingProduct(true);
    setFormStatus({ type: "", message: "" });

    if (editingProductId) {
      const { error } = await supabase
        .from(ADMIN_PRODUCTS_TABLE)
        .update({
          name: payload.name,
          size: payload.size,
          type: payload.type,
          best_for: payload.bestFor,
          category: inferredCategory,
        })
        .eq("id", editingProductId);

      if (error) {
        setFormStatus({
          type: "error",
          message: formatSupabaseError(error, "Could not update product."),
        });
        setIsSavingProduct(false);
        return;
      }

      setFormStatus({
        type: "success",
        message: "Cloud product updated and re-grouped automatically.",
      });
    } else {
      const { error } = await supabase.from(ADMIN_PRODUCTS_TABLE).insert([
        {
          name: payload.name,
          size: payload.size,
          type: payload.type,
          best_for: payload.bestFor,
          category: inferredCategory,
          created_by: authSession?.user?.id || null,
        },
      ]);

      if (error) {
        setFormStatus({
          type: "error",
          message: formatSupabaseError(error, "Could not add product."),
        });
        setIsSavingProduct(false);
        return;
      }

      setFormStatus({
        type: "success",
        message: "Cloud product added and placed in category automatically.",
      });
    }

    resetAdminForm();
    setIsSavingProduct(false);
    loadCloudProducts();
  }

  function startEditProduct(productId) {
    const selectedProduct = cloudProducts.find((item) => item.id === productId);
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

  async function handleDeleteProduct(productId) {
    if (!supabase || !isAuthenticated) {
      setFormStatus({ type: "error", message: "Sign in first to delete products." });
      return;
    }

    if (typeof window !== "undefined") {
      const approved = window.confirm("Delete this cloud product?");
      if (!approved) return;
    }

    setDeletingProductId(productId);

    const { error } = await supabase
      .from(ADMIN_PRODUCTS_TABLE)
      .delete()
      .eq("id", productId);

    if (error) {
      setFormStatus({
        type: "error",
        message: formatSupabaseError(error, "Could not delete product."),
      });
      setDeletingProductId("");
      return;
    }

    if (editingProductId === productId) {
      resetAdminForm();
    }

    setFormStatus({ type: "success", message: "Cloud product removed." });
    setDeletingProductId("");
    loadCloudProducts();
  }

  const totalProducts = catalog.items.length;
  const totalCategories = catalog.groups.length;

  const cloudSyncMessage = isSupabaseConfigured
    ? "Cloud sync is active. Updates appear online after save."
    : "Cloud sync is disabled. Add Supabase env keys to update products online.";

  return (
    <section className="section productsPage">
      <Container>
        <SectionHeader
          kicker="Products"
          title="Available electrical products"
          subtitle="Base stock plus cloud-managed products, automatically grouped by category."
        />

        <Reveal delay={0.04}>
          <article className="card productsAdminShell">
            <div className="productsAdminHead">
              <div className="productsAdminHeadCopy">
                <h3 className="productsAdminTitle">Cloud product manager</h3>
                <p className="productsAdminLead">
                  Update products from your phone online. New items are auto-placed in the right category.
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

            <p className={`productsCloudBadge ${isSupabaseConfigured ? "online" : "offline"}`}>
              {cloudSyncMessage}
            </p>

            {isAdminOpen ? (
              <div className="productsAdminBody">
                {!isSupabaseConfigured ? (
                  <p className="formStatus error">
                    Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then reload.
                  </p>
                ) : null}

                {isSupabaseConfigured && !isAuthenticated ? (
                  <form className="form productsAdminAuthForm" onSubmit={handleAdminLogin}>
                    <p className="productsAdminAuthTitle">Admin sign-in</p>
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        value={authForm.email}
                        onChange={handleAuthInputChange}
                        placeholder="admin@email.com"
                        autoComplete="email"
                      />
                    </label>
                    <label className="field">
                      <span>Password</span>
                      <input
                        type="password"
                        name="password"
                        value={authForm.password}
                        onChange={handleAuthInputChange}
                        placeholder="Your admin password"
                        autoComplete="current-password"
                      />
                    </label>
                    <div className="formActions productsAdminFormActions">
                      <Button type="submit" variant="primary" disabled={isAuthLoading}>
                        {isAuthLoading ? "Signing in..." : "Sign in"}
                      </Button>
                    </div>
                    {authStatus.message ? (
                      <p className={`formStatus ${authStatus.type}`}>{authStatus.message}</p>
                    ) : null}
                  </form>
                ) : null}

                {isSupabaseConfigured && isAuthenticated ? (
                  <form className="form productsAdminForm" onSubmit={handleAdminSubmit}>
                    <p className="productsAdminAutoCategory">
                      Auto category: <strong>{categoryPreviewLabel}</strong>
                    </p>
                    <p className="productsAdminAuthMeta">
                      Signed in as {authSession?.user?.email || "admin"}
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
                      <Button type="submit" variant="primary" disabled={isSavingProduct}>
                        {isSavingProduct
                          ? "Saving..."
                          : editingProductId
                          ? "Update product"
                          : "Add product"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetAdminForm}>
                        {editingProductId ? "Cancel edit" : "Clear form"}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleAdminLogout}>
                        Sign out
                      </Button>
                    </div>

                    {formStatus.message ? (
                      <p className={`formStatus ${formStatus.type}`}>{formStatus.message}</p>
                    ) : null}
                  </form>
                ) : null}

                <div className="productsAdminListWrap">
                  <h4 className="productsAdminListTitle">
                    Cloud products ({adminCatalog.items.length})
                  </h4>
                  {isCatalogLoading ? (
                    <p className="productsAdminEmpty">Loading cloud products...</p>
                  ) : null}
                  {!isCatalogLoading && catalogError ? (
                    <p className="formStatus error">{catalogError}</p>
                  ) : null}
                  {!isCatalogLoading && !catalogError && adminCatalog.items.length === 0 ? (
                    <p className="productsAdminEmpty">No cloud products yet.</p>
                  ) : null}
                  {!isCatalogLoading && !catalogError && adminCatalog.items.length > 0 ? (
                    <ul className="productsAdminList">
                      {adminCatalog.items.map((item) => (
                        <li key={item.id} className="productsAdminItem">
                          <div className="productsAdminItemCopy">
                            <p className="productsAdminItemName">{item.name}</p>
                            <p className="productsAdminItemMeta">
                              {item.categoryLabel} | {item.size} | {item.type}
                            </p>
                          </div>
                          {isAuthenticated ? (
                            <div className="productsAdminItemActions">
                              <Button type="button" variant="outline" onClick={() => startEditProduct(item.id)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="productsDangerBtn"
                                disabled={deletingProductId === item.id}
                                onClick={() => handleDeleteProduct(item.id)}
                              >
                                {deletingProductId === item.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
