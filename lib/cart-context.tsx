"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  size: string;
  type: string;
  categoryLabel: string;
  currency: string;
  priceAmount: number;
  stockQty: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalAmount: number;
  hasItems: boolean;
  addItem: (product: Partial<CartItem>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "oduzz_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCartQuantity(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 99)) : 1;
}

function normalizeStockQuantity(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function clampQuantityToStock(quantity: unknown, stockQty: unknown) {
  const safeQuantity = normalizeCartQuantity(quantity);
  const safeStockQty = normalizeStockQuantity(stockQty);

  if (safeStockQty <= 0) return safeQuantity;
  return Math.min(safeQuantity, safeStockQty);
}

function normalizeCartItem(item: Partial<CartItem>): CartItem {
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
    priceAmount: Number.isFinite(Number(item?.priceAmount)) ? Math.max(0, Number(item?.priceAmount)) : 0,
    stockQty,
    quantity: clampQuantityToStock(item?.quantity, stockQty),
  };
}

function readCartFromStorage() {
  if (typeof window === "undefined") return [] as CartItem[];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeCartItem(item)).filter((item) => item.id && item.slug)
      : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setItems(readCartFromStorage());
      setHasLoadedFromStorage(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    persistCart(items);
  }, [hasLoadedFromStorage, items]);

  const addItem = useCallback((product: Partial<CartItem>, quantity = 1) => {
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

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: clampQuantityToStock(quantity, item.stockQty),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0),
    [items],
  );

  const value = useMemo(
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
    [addItem, clearCart, items, removeItem, subtotalAmount, totalItems, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return value;
}
