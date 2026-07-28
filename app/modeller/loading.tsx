import Container from "@/components/layout/container";

export default function ModelsLoading() {
  return (
    <section className="section modelsPage modelsPageLoading" aria-busy="true">
      <Container>
        <div className="pageHeader modelsPageHeader">
          <div className="skeletonLine skeletonEyebrow" />
          <div className="skeletonLine skeletonTitle" />
          <div className="skeletonLine skeletonLead" />
        </div>

        <div className="catalogSticky">
          <div className="catalogToolbar">
            <div className="skeletonLine skeletonToolbarBtn" />
            <div className="skeletonLine skeletonToolbarMeta" />
          </div>
          <div className="skeletonFilterBar" aria-hidden="true" />
        </div>

        <div
          className="cardGrid catalogSkeletonGrid"
          role="status"
          aria-live="polite"
          aria-label="Laster modeller"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="catalogSkeletonCard">
              <div className="catalogSkeletonImage" />
              <div className="catalogSkeletonBody">
                <div className="skeletonLine skeletonBrand" />
                <div className="skeletonLine skeletonModel" />
                <div className="skeletonLine skeletonSpecs" />
              </div>
            </div>
          ))}
          <span className="visuallyHidden">Laster modeller…</span>
        </div>
      </Container>
    </section>
  );
}
