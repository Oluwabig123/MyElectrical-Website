import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import LayoutChrome from "@/components/layout/LayoutChrome";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, BUSINESS_DESCRIPTION, DEFAULT_KEYWORDS } from "@/lib/seo";
import { buildLocalBusinessSchema, buildOrganizationSchema, buildWebsiteSchema } from "@/lib/structured-data";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Electrical Services & Products in Lagos Nigeria",
    template: `${SITE_NAME} | %s`,
  },
  description: BUSINESS_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  icons: {
    icon: [{ url: "/oduzz-logo-transparent.webp", type: "image/webp" }],
    shortcut: ["/oduzz-logo-transparent.webp"],
    apple: [{ url: "/oduzz-logo-transparent.webp" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Electrical Services & Products in Lagos Nigeria",
    description: BUSINESS_DESCRIPTION,
    siteName: SITE_NAME,
    url: "/",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Electrical Services & Products in Lagos Nigeria",
    description: BUSINESS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-NG"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-ink">
        <AppProviders>
          <JsonLd data={[buildOrganizationSchema(), buildWebsiteSchema(), buildLocalBusinessSchema()]} />
          <a className="skip" href="#content">
            Skip to content
          </a>
          <LayoutChrome>{children}</LayoutChrome>
        </AppProviders>
      </body>
    </html>
  );
}
