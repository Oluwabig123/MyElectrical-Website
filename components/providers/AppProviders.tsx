"use client";

import { CartProvider } from "@/lib/cart-context";

export default function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <CartProvider>{children}</CartProvider>;
}
