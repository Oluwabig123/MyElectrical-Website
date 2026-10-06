export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-screen bg-[#060c14] text-white [--editorial-surface:rgba(16,25,42,0.75)] [--editorial-ink:#ffffff] [--editorial-muted:rgba(255,255,255,0.75)] [--editorial-border:rgba(255,255,255,0.08)] [--editorial-accent:#ffd400]"
      style={{
        backgroundImage: `
          radial-gradient(900px 400px at 10% 0%, rgba(255, 212, 0, 0.08), transparent 60%),
          radial-gradient(800px 400px at 90% 100%, rgba(46, 233, 255, 0.06), transparent 60%)
        `,
      }}
    >
      {children}
    </div>
  );
}
