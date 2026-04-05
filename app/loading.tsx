import Container from "@/components/layout/Container";

export default function SiteLoading() {
  return (
    <div className="routeFallback" role="status" aria-live="polite">
      <Container>
        <div className="routeFallbackCard">Loading page...</div>
      </Container>
    </div>
  );
}
