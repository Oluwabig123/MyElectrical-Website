import React from "react";

const CART_STORAGE_KEY = "oduzz_cart_v1";
const CartContext = React.createContext(null);

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCartQuantity(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 99)) : 1;
}

function normalizeStockQuantity(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function clampQuantityToStock(quantity, stockQty) {
  const safeQuantity = normalizeCartQuantity(quantity);
  const safeStockQty = normalizeStockQuantity(stockQty);

  if (safeStockQty <= 0) return safeQuantity;
  return Math.min(safeQuantity, safeStockQty);
}

function normalizeCartItem(item) {
  const stockQty = normalizeStockQuantity(item?.stockQty);
  return {
    id: sanitizeText(item?.id),
    slug: sanitizeText(item?.slug),
    name: sanitizeText(item?.name) || "Unnamed product",
    imageUrl: sanitizeText(item?.imageUrl),
    size: sanitizeText(item?.size) || "N/A",
    type: sanitizeText(item?.type) || "Electrical item",
    categoryLabel: sanitizeText(item?.categoryLabel),
    currency: sanitizeText(item?.currency).toUpperCase() || "NGN",
    priceAmount: Number.isFinite(Number(item?.priceAmount)) ? Math.max(0, Number(item.priceAmount)) : 0,
    stockQty,
    quantity: clampQuantityToStock(item?.quantity, stockQty),
  };
}

function readCartFromStorage() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeCartItem).filter((item) => item.id && item.slug)
      : [];
  } catch {
    return [];
  }
}

function persistCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = React.useState(() => readCartFromStorage());

  React.useEffect(() => {
    persistCart(items);
  }, [items]);

  const addItem = React.useCallback((product, quantity = 1) => {
    const nextQuantity = clampQuantityToStock(quantity, product?.stockQty);
    const normalized = normalizeCartItem({ ...product, quantity: nextQuantity });

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === normalized.id);
      if (existingIndex === -1) {
        return [...current, normalized];
      }

      const updated = [...current];
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        ...normalized,
        quantity: clampQuantityToStock(existing.quantity + nextQuantity, normalized.stockQty),
      };
      return updated;
    });
  }, []);

  const updateQuantity = React.useCallback((productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: clampQuantityToStock(quantity, item.stockQty),
            }
          : item
      )
    );
  }, []);

  const removeItem = React.useCallback((productId) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotalAmount = React.useMemo(
    () => items.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0),
    [items]
  );

  const value = React.useMemo(
    () => ({
      items,
      totalItems,
      subtotalAmount,
      hasItems: items.length > 0,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, subtotalAmount, totalItems, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = React.useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return value;
}
