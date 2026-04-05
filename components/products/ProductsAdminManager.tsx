"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildProductCatalog,
  formatProductPrice,
  getCategoryLabel,
  inferProductCategory,
  isValidProductCategory,
  PRODUCT_CATEGORY_DEFINITIONS,
  type Product,
} from "@/lib/product-catalog";
import { fetchOnlineProducts } from "@/lib/product-directory";
import {
  ADMIN_PRODUCTS_TABLE,
  PRODUCT_IMAGES_BUCKET,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase-client";

const EMPTY_ADMIN_FORM = {
  name: "",
  brand: "Oduzz",
  size: "",
  type: "",
  bestFor: "",
  description: "",
  keyFeatures: "",
  imageUrl: "",
  price: "",
  currency: "NGN",
  stockQty: "0",
  slug: "",
  category: "",
  isActive: true,
  featured: false,
};

const EMPTY_AUTH_FORM = {
  email: "",
  password: "",
};

const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
type ProductCategoryOption = (typeof PRODUCT_CATEGORY_DEFINITIONS)[number];

function sanitizeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeImageUrl(value: unknown) {
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

function inferAdminFormCategory(formValues: typeof EMPTY_ADMIN_FORM) {
  const safeKeyFeatures = String(formValues.keyFeatures || "")
    .split(/\r?\n/)
    .map((value) => sanitizeValue(value))
    .filter(Boolean)
    .slice(0, 8);

  return inferProductCategory({
    name: formValues.name,
    brand: formValues.brand,
    size: formValues.size,
    type: formValues.type,
    bestFor: formValues.bestFor,
    description: formValues.description,
    keyFeatures: safeKeyFeatures,
  });
}

function normalizeAdminPayload(formValues: typeof EMPTY_ADMIN_FORM) {
  const parsedPrice = Number.parseFloat(String(formValues.price || "").replace(/,/g, ""));
  const safePriceAmount =
    Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice * 100) : 0;
  const parsedStockQty = Number.parseInt(String(formValues.stockQty || ""), 10);
  const safeKeyFeatures = String(formValues.keyFeatures || "")
    .split(/\r?\n/)
    .map((value) => sanitizeValue(value))
    .filter(Boolean)
    .slice(0, 8);
  const requestedCategory = sanitizeValue(formValues.category);
  const inferredCategory = inferAdminFormCategory(formValues);
  const finalCategory = isValidProductCategory(requestedCategory)
    ? requestedCategory
    : inferredCategory;

  return {
    name: sanitizeValue(formValues.name),
    brand: sanitizeValue(formValues.brand) || "Oduzz",
    size: sanitizeValue(formValues.size) || "N/A",
    type: sanitizeValue(formValues.type) || "Electrical item",
    bestFor: sanitizeValue(formValues.bestFor) || "General electrical use",
    description: sanitizeValue(formValues.description),
    keyFeatures: safeKeyFeatures,
    imageUrl: normalizeImageUrl(formValues.imageUrl),
    priceAmount: safePriceAmount,
    currency: sanitizeValue(formValues.currency).toUpperCase() || "NGN",
    stockQty: Number.isFinite(parsedStockQty) ? Math.max(0, parsedStockQty) : 0,
    slug: sanitizeValue(formValues.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80),
    category: finalCategory,
    isActive: Boolean(formValues.isActive),
    featured: Boolean(formValues.featured),
  };
}

function validateAdminPayload(payload: ReturnType<typeof normalizeAdminPayload>) {
  if (!payload.name) return "Product name is required.";
  if (!payload.bestFor) return "Add a short best-for note.";
  if (!payload.description) return "Add a product description.";
  if (!payload.imageUrl) return "Add a valid image URL or upload an image.";
  if (!payload.priceAmount) return "Add a valid product price.";
  return "";
}

function formatPriceInput(product: Partial<Product>) {
  const amount = Number(product?.priceAmount || 0);
  return amount > 0 ? String(amount / 100) : "";
}

function formatKeyFeaturesInput(product: Partial<Product>) {
  return Array.isArray(product?.keyFeatures) ? product.keyFeatures.join("\n") : "";
}

function formatSupabaseError(
  error: { message?: string } | null | undefined,
  fallbackMessage: string,
) {
  if (!error) return fallbackMessage;
  const message = sanitizeValue(error.message);
  if (message.toLowerCase().includes("image_url")) {
    return "Database update needed for product images. Re-run supabase/admin_products.sql in Supabase SQL Editor.";
  }
  return message || fallbackMessage;
}

export default function ProductsAdminManager() {
  const router = useRouter();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH_FORM);
  const [editingProductId, setEditingProductId] = useState("");
  const [cloudProducts, setCloudProducts] = useState<Product[]>([]);
  const [authSessionEmail, setAuthSessionEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [authStatus, setAuthStatus] = useState({ type: "", message: "" });

  const adminCatalog = useMemo(
    () => buildProductCatalog(cloudProducts, { includeInactive: true }),
    [cloudProducts],
  );
  const inferredCategoryLabel = useMemo(() => {
    const draftCategory = inferAdminFormCategory(adminForm);
    return getCategoryLabel(draftCategory);
  }, [adminForm]);
  const selectedCategoryLabel = useMemo(() => {
    if (!adminForm.category) return "Auto-detect";
    return getCategoryLabel(adminForm.category);
  }, [adminForm.category]);
  const groupedAdminCategoryOptions = useMemo(() => {
    const query = sanitizeValue(categoryFilter).toLowerCase();
    const filteredCategories = PRODUCT_CATEGORY_DEFINITIONS.filter((category) => {
      if (!query) return true;
      return (
        category.label.toLowerCase().includes(query) ||
        String(category.group || "").toLowerCase().includes(query)
      );
    });
    const selectedCategory = PRODUCT_CATEGORY_DEFINITIONS.find(
      (category) => category.key === adminForm.category,
    );
    const includeSelectedOutsideFilter =
      selectedCategory &&
      !filteredCategories.some((category) => category.key === selectedCategory.key);
    const categoriesForDisplay = includeSelectedOutsideFilter
      ? [selectedCategory, ...filteredCategories]
      : filteredCategories;
    const groups = categoriesForDisplay.reduce<Record<string, ProductCategoryOption[]>>(
      (acc, category) => {
        const groupLabel =
          includeSelectedOutsideFilter && category.key === selectedCategory?.key
            ? "Current selection"
            : category.group || "Other";

        if (!acc[groupLabel]) acc[groupLabel] = [];
        if (!acc[groupLabel].some((item) => item.key === category.key)) {
          acc[groupLabel].push(category);
        }
        return acc;
      },
      {},
    );

    return Object.entries(groups).map(([label, items]) => ({
      label,
      items,
    }));
  }, [adminForm.category, categoryFilter]);
  const visibleAdminCategoryCount = useMemo(
    () =>
      groupedAdminCategoryOptions.reduce((total, group) => total + group.items.length, 0),
    [groupedAdminCategoryOptions],
  );

  const loadCloudProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudProducts([]);
      setCatalogError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable online product updates.",
      );
      setIsCatalogLoading(false);
      return;
    }

    setIsCatalogLoading(true);
    setCatalogError("");

    const { products, error } = await fetchOnlineProducts({ activeOnly: false });
    if (error) {
      setCatalogError(formatSupabaseError(error, "Could not load cloud products."));
      setCloudProducts([]);
      setIsCatalogLoading(false);
      return;
    }

    setCloudProducts(products);
    setIsCatalogLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false);
      setAuthSessionEmail("");
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
        setIsAuthenticated(Boolean(data.session?.user));
        setAuthSessionEmail(data.session?.user?.email || "");
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session?.user));
      setAuthSessionEmail(session?.user?.email || "");
      if (!session?.user) {
        setEditingProductId("");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void loadCloudProducts();
  }, [loadCloudProducts]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    const channel = supabase
      .channel("admin-products-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ADMIN_PRODUCTS_TABLE },
        () => {
          void loadCloudProducts();
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [loadCloudProducts, router]);

  function handleFormInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    const isCheckbox =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox";
    const nextValue =
      isCheckbox && event.target instanceof HTMLInputElement ? event.target.checked : value;
    setAdminForm((prev) => ({ ...prev, [name]: nextValue }));
    if (name === "category") setCategoryFilter("");
  }

  function handleAuthInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAdminForm() {
    setAdminForm(EMPTY_ADMIN_FORM);
    setCategoryFilter("");
    setEditingProductId("");
  }

  async function handleImageUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
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
      setFormStatus({ type: "error", message: "Image is too large. Use 5MB or less." });
      event.target.value = "";
      return;
    }

    const fileExtension = sanitizeValue(file.name.split(".").pop()).toLowerCase();
    const safeExtension = fileExtension.replace(/[^a-z0-9]/g, "") || "jpg";
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    const uploadPath = `${authSessionEmail || "admin"}/${Date.now()}-${uniqueSuffix}.${safeExtension}`;

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

    setAdminForm((prev) => ({ ...prev, imageUrl: publicUrl }));
    setFormStatus({
      type: "success",
      message: "Image uploaded. Save product to publish changes.",
    });
    setIsUploadingImage(false);
    event.target.value = "";
  }

  async function handleAdminLogin(event: React.FormEvent<HTMLFormElement>) {
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
    setAuthStatus({
      type: "success",
      message: "Signed in. You can now manage cloud products.",
    });
    setIsAuthLoading(false);
  }

  async function handleAdminLogout() {
    const logoutTasks: Promise<unknown>[] = [fetch("/api/admin/logout", { method: "POST" })];

    if (supabase) {
      logoutTasks.push(supabase.auth.signOut());
    }

    const results = await Promise.allSettled(logoutTasks);
    const signOutResult = results.find(
      (result) =>
        result.status === "fulfilled" &&
        typeof result.value === "object" &&
        result.value !== null &&
        "error" in result.value,
    ) as PromiseFulfilledResult<{ error?: { message?: string } | null }> | undefined;

    if (signOutResult?.value?.error) {
      setAuthStatus({
        type: "error",
        message: formatSupabaseError(signOutResult.value.error, "Could not sign out."),
      });
      return;
    }

    resetAdminForm();
    setAuthStatus({ type: "success", message: "Signed out." });
    router.replace("/admin/login");
    router.refresh();
  }

  async function handleAdminSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setIsSavingProduct(true);
    setFormStatus({ type: "", message: "" });

    if (editingProductId) {
      const { error } = await supabase
        .from(ADMIN_PRODUCTS_TABLE)
        .update({
          name: payload.name,
          brand: payload.brand,
          size: payload.size,
          type: payload.type,
          best_for: payload.bestFor,
          description: payload.description,
          key_features: payload.keyFeatures,
          image_url: payload.imageUrl,
          price_amount: payload.priceAmount,
          currency: payload.currency,
          stock_qty: payload.stockQty,
          slug: payload.slug || null,
          is_active: payload.isActive,
          featured: payload.featured,
          category: payload.category,
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
        message: "Cloud product updated.",
      });
    } else {
      const { error } = await supabase.from(ADMIN_PRODUCTS_TABLE).insert([
        {
          name: payload.name,
          brand: payload.brand,
          size: payload.size,
          type: payload.type,
          best_for: payload.bestFor,
          description: payload.description,
          key_features: payload.keyFeatures,
          image_url: payload.imageUrl,
          price_amount: payload.priceAmount,
          currency: payload.currency,
          stock_qty: payload.stockQty,
          slug: payload.slug || null,
          is_active: payload.isActive,
          featured: payload.featured,
          category: payload.category,
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
        message: "Cloud product added.",
      });
    }

    resetAdminForm();
    setIsSavingProduct(false);
    await loadCloudProducts();
    router.refresh();
  }

  function startEditProduct(productId: string) {
    const selectedProduct = cloudProducts.find((item) => item.id === productId);
    if (!selectedProduct) return;

    setIsAdminOpen(true);
    setEditingProductId(productId);
    setAdminForm({
      name: selectedProduct.name,
      brand: selectedProduct.brand || "Oduzz",
      size: selectedProduct.size,
      type: selectedProduct.type,
      bestFor: selectedProduct.bestFor,
      description: selectedProduct.description || "",
      keyFeatures: formatKeyFeaturesInput(selectedProduct),
      imageUrl: selectedProduct.imageUrl || "",
      price: formatPriceInput(selectedProduct),
      currency: selectedProduct.currency || "NGN",
      stockQty: String(selectedProduct.stockQty ?? 0),
      slug: selectedProduct.slug || "",
      category: selectedProduct.category || "",
      isActive: selectedProduct.isActive,
      featured: selectedProduct.featured,
    });
    setCategoryFilter("");
    setFormStatus({ type: "", message: "" });
  }

  async function handleDeleteProduct(productId: string) {
    if (!supabase || !isAuthenticated) {
      setFormStatus({ type: "error", message: "Sign in first to delete products." });
      return;
    }
    if (typeof window !== "undefined" && !window.confirm("Delete this cloud product?")) {
      return;
    }

    setDeletingProductId(productId);
    const { error } = await supabase.from(ADMIN_PRODUCTS_TABLE).delete().eq("id", productId);

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
    await loadCloudProducts();
    router.refresh();
  }

  const cloudSyncMessage = isSupabaseConfigured
    ? "Cloud sync is active. Updates appear online after save."
    : "Cloud sync is disabled. Add Supabase env keys to update products online.";

  return (
    <article className="card productsAdminShell">
      <div className="productsAdminHead">
        <div className="productsAdminHeadCopy">
          <h2 className="productsAdminTitle">Cloud product manager</h2>
          <p className="productsAdminLead">
            Sign in to add, edit, upload images, and control what appears in the live product
            catalog.
          </p>
        </div>
        <button
          type="button"
          className={`btn ${isAdminOpen ? "outline" : "primary"}`}
          onClick={() => setIsAdminOpen((prev) => !prev)}
        >
          {isAdminOpen ? "Hide manager" : "Open manager"}
        </button>
      </div>

      <p className={`productsCloudBadge ${isSupabaseConfigured ? "online" : "offline"}`}>
        {cloudSyncMessage}
      </p>

      {isAdminOpen ? (
        <div className="productsAdminBody">
          {!isSupabaseConfigured ? (
            <p className="formStatus error">
              Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then reload.
            </p>
          ) : null}

          {isSupabaseConfigured && isAuthLoading ? (
            <p className="formStatus info">Checking admin session...</p>
          ) : null}

          {isSupabaseConfigured && !isAuthLoading && !isAuthenticated ? (
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
                <button type="submit" className="btn primary" disabled={isAuthLoading}>
                  {isAuthLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
              {authStatus.message ? (
                <p className={`formStatus ${authStatus.type}`}>{authStatus.message}</p>
              ) : null}
            </form>
          ) : null}

          {isSupabaseConfigured && !isAuthLoading && isAuthenticated ? (
            <form className="form productsAdminForm" onSubmit={handleAdminSubmit}>
              <p className="productsAdminAutoCategory">
                Auto category: <strong>{inferredCategoryLabel}</strong>
              </p>
              <p className="productsAdminAutoCategory">
                Category in use: <strong>{selectedCategoryLabel}</strong>
              </p>
              <p className="productsAdminAuthMeta">
                Signed in as {authSessionEmail || "admin"}
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
                <span>Brand</span>
                <input
                  type="text"
                  name="brand"
                  value={adminForm.brand}
                  onChange={handleFormInputChange}
                  placeholder="e.g. Lagostar"
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
                <span>Find category</span>
                <input
                  type="search"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  placeholder="Filter electrical or CCTV categories"
                />
              </label>
              <label className="field">
                <span>Category</span>
                <select
                  name="category"
                  value={adminForm.category}
                  onChange={handleFormInputChange}
                >
                  <option value="">Auto-detect from product details</option>
                  {groupedAdminCategoryOptions.length ? (
                    groupedAdminCategoryOptions.map((group) => (
                      <optgroup key={group.label} label={`${group.label} (${group.items.length})`}>
                        {group.items.map((category) => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    <option value="" disabled>
                      No categories match this filter
                    </option>
                  )}
                </select>
                <small className="productsAdminCategoryHint">
                  Showing {visibleAdminCategoryCount} of {PRODUCT_CATEGORY_DEFINITIONS.length}{" "}
                  categories.
                </small>
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
                <select
                  name="currency"
                  value={adminForm.currency}
                  onChange={handleFormInputChange}
                >
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
              <label className="field">
                <span>Description *</span>
                <textarea
                  rows={4}
                  name="description"
                  value={adminForm.description}
                  onChange={handleFormInputChange}
                  placeholder="Short product description for the detail page and assistant context"
                />
              </label>
              <label className="field">
                <span>Key features</span>
                <textarea
                  rows={4}
                  name="keyFeatures"
                  value={adminForm.keyFeatures}
                  onChange={handleFormInputChange}
                  placeholder={"One feature per line\nPure copper conductor\nSuitable for domestic wiring"}
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
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSavingProduct || isUploadingImage}
                >
                  {isUploadingImage
                    ? "Uploading image..."
                    : isSavingProduct
                      ? "Saving..."
                      : editingProductId
                        ? "Update product"
                        : "Add product"}
                </button>
                <button
                  type="button"
                  className="btn outline"
                  onClick={resetAdminForm}
                >
                  {editingProductId ? "Cancel edit" : "Clear form"}
                </button>
                <button
                  type="button"
                  className="btn outline"
                  onClick={handleAdminLogout}
                >
                  Sign out
                </button>
              </div>
              {formStatus.message ? (
                <p className={`formStatus ${formStatus.type}`}>{formStatus.message}</p>
              ) : null}
            </form>
          ) : null}

          <div className="productsAdminListWrap">
            <h3 className="productsAdminListTitle">
              Cloud products ({adminCatalog.items.length})
            </h3>
            {isCatalogLoading ? (
              <p className="productsAdminEmpty">Loading cloud products...</p>
            ) : null}
            {!isCatalogLoading && catalogError ? (
              <p className="formStatus error">{catalogError}</p>
            ) : null}
            {!isCatalogLoading && !catalogError && adminCatalog.items.length === 0 ? (
              <p className="productsAdminEmpty">
                No online products yet. Add stock from the manager to publish it here.
              </p>
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
                        {item.brand} | {item.categoryLabel} | {formatProductPrice(item)} | Stock:{" "}
                        {item.stockQty} | {item.isActive ? "Live" : "Hidden"}
                      </p>
                    </div>
                    {isAuthenticated ? (
                      <div className="productsAdminItemActions">
                        <button
                          type="button"
                          className="btn outline"
                          onClick={() => startEditProduct(item.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn outline productsDangerBtn"
                          disabled={deletingProductId === item.id}
                          onClick={() => handleDeleteProduct(item.id)}
                        >
                          {deletingProductId === item.id ? "Deleting..." : "Delete"}
                        </button>
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
  );
}
