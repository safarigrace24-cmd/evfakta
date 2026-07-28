import Container from "@/components/layout/container";

export default function CompareLoading() {
  return (
    <section className="section comparePageShell comparePageLoading" aria-busy="true">
      <Container>
        <div className="pageHeader comparePageHeader">
          <div className="skeletonLine skeletonEyebrow" />
          <div className="skeletonLine skeletonTitle" />
          <div className="skeletonLine skeletonLead" />
        </div>
        <div className="compareSkeletonPicker" aria-hidden="true">
          <div className="skeletonLine skeletonToolbarMeta" />
          <div className="compareSkeletonChips">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="compareSkeletonTable" aria-hidden="true" />
        <p className="visuallyHidden" role="status" aria-live="polite">
          Laster sammenligning…
        </p>
      </Container>
    </section>
  );
}
