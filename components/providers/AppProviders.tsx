"use client";

import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/cart/CartDrawer";

export default function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
