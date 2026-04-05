import type { Metadata } from "next";
import CartClient from "@/components/cart/CartClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cart",
  description:
    "Review selected electrical products, fixtures, and materials before continuing with your order or quote request.",
  path: "/cart",
  keywords: ["electrical cart", "order electrical products", "lighting cart"],
});

export default function CartPage() {
  return <CartClient />;
}
