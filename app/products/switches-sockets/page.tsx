import type { Metadata } from "next";
import ProductCategoryLandingPage from "@/components/products/ProductCategoryLandingPage";
import { productCategoryLandingPageMap } from "@/data/product-category-landing-pages";
import { buildMetadata } from "@/lib/seo";

const category = productCategoryLandingPageMap["switches-sockets"];

export const revalidate = 120;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.description,
  path: category.path,
  keywords: category.keywords,
  image: category.heroImage,
});

export default function SwitchesSocketsPage() {
  return <ProductCategoryLandingPage category={category} />;
}
