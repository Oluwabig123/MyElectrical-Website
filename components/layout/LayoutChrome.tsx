"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import OduzzAssistantWidget from "@/components/layout/OduzzAssistantWidget";

type LayoutChromeProps = {
  children: React.ReactNode;
};

export default function LayoutChrome({ children }: LayoutChromeProps) {
  const pathname = usePathname();
  const isAssistantRoute = pathname === "/assistant";

  return (
    <>
      {isAssistantRoute ? null : <Navbar />}
      <main id="content">{children}</main>
      {isAssistantRoute ? null : <Footer />}
      <OduzzAssistantWidget />
    </>
  );
}
