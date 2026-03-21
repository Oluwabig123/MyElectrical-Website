import React from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import Reveal from "../components/ui/Reveal";
import { CONTACT, buildWhatsAppUrl } from "../data/contact";
import { cableProducts } from "../data/products";
import {
  buildProductCatalog,
  formatProductPrice,
  getCategoryLabel,
  getProductAvailability,
  inferProductCategory,
  normalizeProduct,
} from "../utils/productCatalog";
import {
  ADMIN_PRODUCTS_TABLE,
  isSupabaseConfigured,
  PRODUCT_IMAGES_BUCKET,
  supabase,
} from "../lib/supabaseClient";

const EMPTY_ADMIN_FORM = {
  name: "",
  size: "",
  type: "",
  bestFor: "",
  imageUrl: "",
  price: "",
  currency: "NGN",
  stockQty: "0",
  slug: "",
  isActive: true,
  featured: false,
};

const EMPTY_AUTH_FORM = {
  email: "",
  password: "",
};

const EMPTY_CHECKOUT_FORM = {
  name: "",
  email: "",
  phone: "",
};

const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Small input helpers keep the admin payload predictable before validation.
function sanitizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeImageUrl(value) {
  const rawUrl = sanitizeValue(value);
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }
    return parsed.href;
  } catch {
    return "";
  }
}

function normalizeAdminPayload(formValues) {
  const parsedPrice = Number.parseFloat(String(formValues.price || "").replace(/,/g, ""));
  const safePriceAmount = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice * 100) : 0;
  const parsedStockQty = Number.parseInt(String(formValues.stockQty || ""), 10);

  return {
    name: sanitizeValue(formValues.name),
    size: sanitizeValue(formValues.size) || "N/A",
    type: sanitizeValue(formValues.type) || "Electrical item",
    bestFor: sanitizeValue(formValues.bestFor) || "General electrical use",
    imageUrl: normalizeImageUrl(formValues.imageUrl),
    priceAmount: safePriceAmount,
    currency: sanitizeValue(formValues.currency).toUpperCase() || "NGN",
    stockQty: Number.isFinite(parsedStockQty) ? Math.max(0, parsedStockQty) : 0,
    slug: sanitizeValue(formValues.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80),
    isActive: Boolean(formValues.isActive),
    featured: Boolean(formValues.featured),
  };
}

function validateAdminPayload(payload) {
  if (!payload.name) return "Product name is required.";
  if (!payload.bestFor) return "Add a short best-for note.";
  if (!payload.imageUrl) return "Add a valid image URL or upload an image.";
  if (!payload.priceAmount) return "Add a valid product price.";
  return "";
}

// Converts Supabase rows into the normalized catalog shape used by the page UI.
function mapCloudRowToProduct(row) {
  return normalizeProduct(
    {
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      bestFor: row.best_for,
      imageUrl: row.image_url,
      priceAmount: row.price_amount,
      currency: row.currency,
      stockQty: row.stock_qty,
      slug: row.slug,
      isActive: row.is_active,
      featured: row.featured,
      category: row.category,
      source: "cloud",
    },
    row.id
  );
}

function formatPriceInput(product) {
  const amount = Number(product?.priceAmount || 0);
  return amount > 0 ? String(amount / 100) : "";
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

function validateCheckoutForm(formValues) {
  const name = sanitizeValue(formValues.name);
  const email = sanitizeValue(formValues.email).toLowerCase();
  const phone = sanitizeValue(formValues.phone);

  if (!name) return "Enter your name to continue.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  if (phone && phone.replace(/[^\d+]/g, "").length < 7) {
    return "Enter a valid phone number or leave it blank.";
  }

  return "";
}

function formatSupabaseError(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  const message = sanitizeValue(error.message);
  if (message.toLowerCase().includes("image_url")) {
    return "Database update needed for product images. Re-run supabase/admin_products.sql in Supabase SQL Editor.";
  }
  return message || fallbackMessage;
}

export default function Products() {
  // Admin state, auth state, and product catalog state all live in this page.
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [adminForm, setAdminForm] = React.useState(EMPTY_ADMIN_FORM);
  const [authForm, setAuthForm] = React.useState(EMPTY_AUTH_FORM);
  const [editingProductId, setEditingProductId] = React.useState(null);
  const [cloudProducts, setCloudProducts] = React.useState([]);
  const [authSession, setAuthSession] = React.useState(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = React.useState(true);
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [deletingProductId, setDeletingProductId] = React.useState("");
  const [catalogError, setCatalogError] = React.useState("");
  const [formStatus, setFormStatus] = React.useState({ type: "", message: "" });
  const [authStatus, setAuthStatus] = React.useState({ type: "", message: "" });
  const [checkoutProduct, setCheckoutProduct] = React.useState(null);
  const [checkoutForm, setCheckoutForm] = React.useState(EMPTY_CHECKOUT_FORM);
  const [checkoutStatus, setCheckoutStatus] = React.useState({ type: "", message: "" });
  const [checkoutFeedback, setCheckoutFeedback] = React.useState({ type: "", message: "" });
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);

  const isAuthenticated = Boolean(authSession?.user);

  // Merge shipped product data with cloud-managed records.
  const mergedProducts = React.useMemo(
    () => [...cableProducts, ...cloudProducts],
    [cloudProducts]
  );

  const catalog = React.useMemo(() => buildProductCatalog(mergedProducts), [mergedProducts]);
  const adminCatalog = React.useMemo(
    () => buildProductCatalog(cloudProducts, { includeInactive: true }),
    [cloudProducts]
  );

  const categoryPreviewLabel = React.useMemo(() => {
    const draftCategory = inferProductCategory(adminForm);
    return getCategoryLabel(draftCategory);
  }, [adminForm]);

  // Loads cloud products for both the public catalog and the admin list.
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
      .select("id,name,size,type,best_for,image_url,price_amount,currency,stock_qty,slug,is_active,featured,category,created_at")
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

  // Keep the UI in sync with Supabase changes pushed from any admin session.
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

  // Shared input handlers for the admin auth and product forms.
  function handleFormInputChange(event) {
    const { name, value, type, checked } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handleAuthInputChange(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAdminForm() {
    setAdminForm(EMPTY_ADMIN_FORM);
    setEditingProductId(null);
  }

  function handleCheckoutInputChange(event) {
    const { name, value } = event.target;
    setCheckoutForm((prev) => ({ ...prev, [name]: value }));
  }

  function closeCheckoutModal() {
    if (isCheckoutLoading) return;
    setCheckoutProduct(null);
    setCheckoutStatus({ type: "", message: "" });
    setCheckoutForm(EMPTY_CHECKOUT_FORM);
  }

  function openCheckoutModal(product) {
    setCheckoutProduct(product);
    setCheckoutStatus({ type: "", message: "" });
  }

  // Uploads a selected image to Supabase storage and stores its public URL in the form.
  async function handleImageUploadChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!supabase || !isAuthenticated) {
      setFormStatus({ type: "error", message: "Sign in first to upload product images." });
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFormStatus({ type: "error", message: "Choose a valid image file." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      setFormStatus({
        type: "error",
        message: "Image is too large. Use 5MB or less.",
      });
      event.target.value = "";
      return;
    }

    const fileExtension = sanitizeValue(file.name.split(".").pop()).toLowerCase();
    const safeExtension = fileExtension.replace(/[^a-z0-9]/g, "") || "jpg";
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    const uploadPath = `${authSession?.user?.id || "admin"}/${Date.now()}-${uniqueSuffix}.${safeExtension}`;

    setIsUploadingImage(true);
    setFormStatus({ type: "", message: "" });

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setFormStatus({
        type: "error",
        message: formatSupabaseError(uploadError, "Could not upload image."),
      });
      setIsUploadingImage(false);
      event.target.value = "";
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(uploadPath);

    setAdminForm((prev) => ({
      ...prev,
      imageUrl: publicUrl,
    }));
    setFormStatus({
      type: "success",
      message: "Image uploaded. Save product to publish changes.",
    });
    setIsUploadingImage(false);
    event.target.value = "";
  }

  // Signs an admin into Supabase so they can manage cloud products.
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

  // Creates or updates a cloud product, then refreshes the catalog view.
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
          image_url: payload.imageUrl,
          price_amount: payload.priceAmount,
          currency: payload.currency,
          stock_qty: payload.stockQty,
          slug: payload.slug || null,
          is_active: payload.isActive,
          featured: payload.featured,
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
          image_url: payload.imageUrl,
          price_amount: payload.priceAmount,
          currency: payload.currency,
          stock_qty: payload.stockQty,
          slug: payload.slug || null,
          is_active: payload.isActive,
          featured: payload.featured,
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

  // Loads an existing cloud product back into the same form for editing.
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
      imageUrl: selectedProduct.imageUrl || "",
      price: formatPriceInput(selectedProduct),
      currency: selectedProduct.currency || "NGN",
      stockQty: String(selectedProduct.stockQty ?? 0),
      slug: selectedProduct.slug || "",
      isActive: selectedProduct.isActive,
      featured: selectedProduct.featured,
    });
    setFormStatus({ type: "", message: "" });
  }

  // Removes a cloud-managed product after a client-side confirmation step.
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

  async function startPaystackCheckout(event) {
    event.preventDefault();

    if (!checkoutProduct) return;

    const validationError = validateCheckoutForm(checkoutForm);
    if (validationError) {
      setCheckoutStatus({ type: "error", message: validationError });
      return;
    }

    setIsCheckoutLoading(true);
    setCheckoutStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/create-paystack-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          customerName: sanitizeValue(checkoutForm.name),
          customerEmail: sanitizeValue(checkoutForm.email),
          customerPhone: sanitizeValue(checkoutForm.phone),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.authorizationUrl) {
        setCheckoutStatus({
          type: "error",
          message: payload?.error || "Could not start checkout right now.",
        });
        setIsCheckoutLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = payload.authorizationUrl;
      }
    } catch (error) {
      setCheckoutStatus({
        type: "error",
        message: error?.message || "Could not start checkout right now.",
      });
      setIsCheckoutLoading(false);
    }
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const params = new URLSearchParams(window.location.search);
    const checkoutGateway = params.get("checkout");
    const reference = params.get("reference") || params.get("trxref");

    if (checkoutGateway !== "paystack" || !reference) {
      return undefined;
    }

    let isActive = true;

    async function verifyPayment() {
      setCheckoutFeedback({ type: "info", message: "Confirming payment..." });

      try {
        const response = await fetch(
          `/api/verify-paystack-payment?reference=${encodeURIComponent(reference)}`,
          {
            method: "GET",
          }
        );
        const payload = await response.json().catch(() => ({}));

        if (!isActive) return;

        setCheckoutFeedback({
          type: payload?.verified ? "success" : "error",
          message:
            payload?.message ||
            (payload?.verified ? "Payment confirmed." : payload?.error || "Could not confirm payment."),
        });
      } catch (error) {
        if (!isActive) return;
        setCheckoutFeedback({
          type: "error",
          message: error?.message || "Could not confirm payment.",
        });
      } finally {
        params.delete("checkout");
        params.delete("reference");
        params.delete("trxref");
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    }

    verifyPayment();

    return () => {
      isActive = false;
    };
  }, []);

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

        {/* Inline admin panel for authenticating and managing cloud products. */}
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
                      <span>Image URL *</span>
                      <input
                        type="url"
                        name="imageUrl"
                        value={adminForm.imageUrl}
                        onChange={handleFormInputChange}
                        placeholder="https://...product-image.jpg"
                      />
                    </label>
                    <label className="field">
                      <span>Price *</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="price"
                        value={adminForm.price}
                        onChange={handleFormInputChange}
                        placeholder="e.g. 18500"
                      />
                    </label>
                    <label className="field">
                      <span>Currency</span>
                      <select name="currency" value={adminForm.currency} onChange={handleFormInputChange}>
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Stock quantity</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="stockQty"
                        value={adminForm.stockQty}
                        onChange={handleFormInputChange}
                        placeholder="e.g. 12"
                      />
                    </label>
                    <label className="field">
                      <span>Slug</span>
                      <input
                        type="text"
                        name="slug"
                        value={adminForm.slug}
                        onChange={handleFormInputChange}
                        placeholder="auto-generated-if-empty"
                      />
                    </label>
                    <label className="field">
                      <span>Upload image (optional)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUploadChange}
                        disabled={isUploadingImage}
                      />
                    </label>
                    {adminForm.imageUrl ? (
                      <div className="productsAdminImagePreviewWrap">
                        <img
                          src={adminForm.imageUrl}
                          alt="Product preview"
                          className="productsAdminImagePreview"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : null}
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
                    <label className="productsToggleField">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={adminForm.isActive}
                        onChange={handleFormInputChange}
                      />
                      <span>Show this product publicly</span>
                    </label>
                    <label className="productsToggleField">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={adminForm.featured}
                        onChange={handleFormInputChange}
                      />
                      <span>Feature this product first in its category</span>
                    </label>

                    <div className="formActions productsAdminFormActions">
                      <Button type="submit" variant="primary" disabled={isSavingProduct || isUploadingImage}>
                        {isUploadingImage
                          ? "Uploading image..."
                          : isSavingProduct
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
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="productsAdminThumb"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <div className="productsAdminItemCopy">
                            <p className="productsAdminItemName">{item.name}</p>
                            <p className="productsAdminItemMeta">
                              {item.categoryLabel} | {formatProductPrice(item)} | Stock: {item.stockQty} | {item.isActive ? "Live" : "Hidden"}
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

        {checkoutFeedback.message ? (
          <p className={`formStatus ${checkoutFeedback.type || "success"} productsCheckoutFeedback`}>
            {checkoutFeedback.message}
          </p>
        ) : null}

        {/* Public product catalog grouped by inferred category. */}
        {catalog.groups.map((group, groupIndex) => (
          <section className="productsCategorySection" key={group.key}>
            <div className="productsCategoryHead">
              <h3 className="productsCategoryTitle">{group.label}</h3>
              <span className="productsCategoryCount">
                {group.items.length} item{group.items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="productsGrid">
              {group.items.map((item, index) => {
                const availability = getProductAvailability(item);
                const whatsappUrl = buildWhatsAppUrl(
                  encodeURIComponent(buildProductPurchaseMessage(item))
                );
                const canCheckoutOnline =
                  item.source === "cloud" &&
                  item.isActive &&
                  item.priceAmount > 0 &&
                  item.stockQty > 0;

                return (
                  <Reveal key={item.id} delay={groupIndex * 0.06 + index * 0.03}>
                    <article className="card productsCard">
                      <div className="productsCardHead">
                        <span className="productsIndex">{String(index + 1).padStart(2, "0")}</span>
                        {item.featured ? <span className="productsFeatured">Featured</span> : null}
                      </div>
                      <div className="productsImageWrap">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="productsImage"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="productsImageFallback" aria-hidden="true">
                            Oduzz
                          </div>
                        )}
                      </div>
                      <div className="productsPriceRow">
                        <strong className="productsPrice">{formatProductPrice(item)}</strong>
                        <span className={`productsStock ${availability.toLowerCase().replace(/\s+/g, "-")}`}>
                          {availability}
                        </span>
                      </div>
                      <h3 className="cardTitle productsTitle">{item.name}</h3>
                      <p className="p">{item.bestFor}</p>
                      <div className="productsMeta" aria-label={`${item.name} specifications`}>
                        <span className="productsChip">Size: {item.size}</span>
                        <span className="productsChip">{item.type}</span>
                      </div>
                      <div className="productsCardActions">
                        {canCheckoutOnline ? (
                          <>
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => openCheckoutModal(item)}
                            >
                              Checkout online
                            </button>
                            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn outline">
                              Buy on WhatsApp
                            </a>
                          </>
                        ) : (
                          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn primary">
                            {item.priceAmount > 0 && item.stockQty > 0
                              ? "Buy on WhatsApp"
                              : "Request availability"}
                          </a>
                        )}
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}

        {/* Final CTA for users who need help choosing a product. */}
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

        {checkoutProduct ? (
          <div
            className="productsCheckoutOverlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeCheckoutModal();
              }
            }}
          >
            <div className="card productsCheckoutModal" role="dialog" aria-modal="true" aria-labelledby="products-checkout-title">
              <div className="productsCheckoutHead">
                <div className="productsCheckoutHeadCopy">
                  <p className="productsCheckoutKicker">Secure checkout</p>
                  <h3 id="products-checkout-title" className="productsCheckoutTitle">
                    {checkoutProduct.name}
                  </h3>
                  <p className="productsCheckoutLead">
                    Online payments are processed with Paystack. Orders are recorded before redirect so payment verification stays traceable.
                  </p>
                </div>
                <button
                  type="button"
                  className="productsCheckoutClose"
                  onClick={closeCheckoutModal}
                  aria-label="Close checkout"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>

              <div className="productsCheckoutMeta">
                <span className="productsChip">{formatProductPrice(checkoutProduct)}</span>
                <span className="productsChip">Stock: {checkoutProduct.stockQty}</span>
                <span className="productsChip">{checkoutProduct.categoryLabel}</span>
              </div>

              <form className="form productsCheckoutForm" onSubmit={startPaystackCheckout}>
                <label className="field">
                  <span>Full name *</span>
                  <input
                    type="text"
                    name="name"
                    value={checkoutForm.name}
                    onChange={handleCheckoutInputChange}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input
                    type="email"
                    name="email"
                    value={checkoutForm.email}
                    onChange={handleCheckoutInputChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={checkoutForm.phone}
                    onChange={handleCheckoutInputChange}
                    placeholder="080..."
                    autoComplete="tel"
                  />
                </label>

                <div className="productsCheckoutActions">
                  <button type="submit" className="btn primary" disabled={isCheckoutLoading}>
                    {isCheckoutLoading ? "Redirecting..." : "Pay with Paystack"}
                  </button>
                  <a
                    href={buildWhatsAppUrl(encodeURIComponent(buildProductPurchaseMessage(checkoutProduct)))}
                    target="_blank"
                    rel="noreferrer"
                    className="btn outline"
                  >
                    Order on WhatsApp
                  </a>
                </div>

                {checkoutStatus.message ? (
                  <p className={`formStatus ${checkoutStatus.type}`}>{checkoutStatus.message}</p>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
