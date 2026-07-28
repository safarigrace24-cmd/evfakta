import Container from "@/components/layout/container";

export default function ModelDetailLoading() {
  return (
    <section className="section modelPage modelPageLoading" aria-busy="true">
      <Container>
        <div className="pageBreadcrumb">
          <div className="skeletonLine skeletonBreadcrumb" />
        </div>

        <div className="modelHero">
          <div className="modelHeroMedia">
            <div className="modelSkeletonHero" />
            <div className="modelSkeletonThumbs" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="modelHeroAside">
            <div className="skeletonLine skeletonEyebrow" />
            <div className="skeletonLine skeletonTitle" />
            <div className="skeletonLine skeletonLead" />
            <div className="modelSkeletonFacts" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <p className="visuallyHidden" role="status" aria-live="polite">
          Laster modell…
        </p>
      </Container>
    </section>
  );
}
