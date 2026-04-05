import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${fraunces.variable} [--editorial-bg:#cdb7a3] [--editorial-surface:#fffdfa] [--editorial-ink:#0b1020] [--editorial-muted:#5d5f68] [--editorial-border:rgba(11,16,32,0.1)] [--editorial-accent:#ffd400] bg-[radial-gradient(circle_at_top_left,rgba(255,212,0,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(11,16,32,0.12),transparent_28%),var(--editorial-bg)] text-[var(--editorial-ink)]`}
    >
      {children}
    </div>
  );
}
