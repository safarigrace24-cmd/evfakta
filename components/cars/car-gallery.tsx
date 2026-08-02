"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { Car, CarGalleryImage } from "@/data/cars";
import { CAR_IMAGE_TYPE_LABELS } from "@/lib/admin/car-image-types";

type CarGalleryProps = {
  car: Car;
};

function resolveGallery(car: Car): CarGalleryImage[] {
  if (car.images?.length) {
    return car.images.filter((image) => Boolean(image.imageUrl?.trim()));
  }
  const hero = car.imageUrl?.trim();
  if (!hero) return [];
  return [
    {
      id: "legacy",
      imageUrl: hero,
      imageType: "other",
      altText: `${car.brand} ${car.model}`,
      sortOrder: 0,
      isPrimary: true,
    },
  ];
}

export default function CarGallery({ car }: CarGalleryProps) {
  const gallery = resolveGallery(car);
  const primaryIndex = Math.max(
    0,
    gallery.findIndex((image) => image.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex >= 0 ? primaryIndex : 0);
  const [failedMain, setFailedMain] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const active = gallery[activeIndex] ?? gallery[0];
  const src = active?.imageUrl?.trim() || "";
  const isRemote = src.startsWith("http://") || src.startsWith("https://");
  const showThumbs = gallery.length > 1;
  const canNavigate = gallery.length > 1;
  const showLetter = !src || failedMain;

  const goTo = useCallback(
    (index: number) => {
      if (gallery.length === 0) return;
      const next = ((index % gallery.length) + gallery.length) % gallery.length;
      setActiveIndex(next);
      setFailedMain(false);
    },
    [gallery.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  return (
    <div className="carGallery">
      <div
        className="detailHero carGalleryMain"
        role="region"
        tabIndex={canNavigate ? 0 : undefined}
        aria-roledescription="bildegalleri"
        aria-label={`${car.brand} ${car.model} bilder`}
        onKeyDown={(event) => {
          if (!canNavigate) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrev();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
          }
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null || !canNavigate) return;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const delta = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 40) return;
          if (delta > 0) goPrev();
          else goNext();
        }}
      >
        <div className="detailHeroGlow" aria-hidden="true" />
        {showLetter ? (
          <span className="detailHeroLetter" aria-hidden="true">
            {car.brand.slice(0, 1)}
          </span>
        ) : (
          <Image
            key={src}
            src={src}
            alt={active?.altText || `${car.brand} ${car.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 640px"
            priority
            unoptimized={isRemote}
            className="carImageHero"
            onError={() => setFailedMain(true)}
          />
        )}
        <div className="detailHeroMeta">
          <span>
            {active ? CAR_IMAGE_TYPE_LABELS[active.imageType] : car.drive}
          </span>
          <span>Oppdatert {car.updated}</span>
        </div>
        {canNavigate ? (
          <div className="carGalleryNav">
            <button
              type="button"
              className="carGalleryNavBtn"
              onClick={goPrev}
              aria-label="Forrige bilde"
            >
              ←
            </button>
            <button
              type="button"
              className="carGalleryNavBtn"
              onClick={goNext}
              aria-label="Neste bilde"
            >
              →
            </button>
          </div>
        ) : null}
      </div>

      {gallery.length > 0 ? (
        <p className="visuallyHidden" aria-live="polite">
          Bilde {activeIndex + 1} av {gallery.length}
          {active
            ? `: ${CAR_IMAGE_TYPE_LABELS[active.imageType]}`
            : ""}
        </p>
      ) : null}

      {showThumbs && (
        <ul className="carGalleryThumbs" aria-label="Bildegalleri miniatyrer">
          {gallery.map((image, index) => {
            const thumbSrc = image.imageUrl?.trim() || "";
            const thumbRemote =
              thumbSrc.startsWith("http://") || thumbSrc.startsWith("https://");
            const thumbFailed = failedThumbs[image.id];
            return (
              <li key={image.id}>
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "carGalleryThumb carGalleryThumbActive"
                      : "carGalleryThumb"
                  }
                  aria-label={`Vis ${CAR_IMAGE_TYPE_LABELS[image.imageType]} bilde`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => goTo(index)}
                >
                  {!thumbSrc || thumbFailed ? (
                    <span className="carGalleryThumbLetter" aria-hidden="true">
                      {car.brand.slice(0, 1)}
                    </span>
                  ) : (
                    <Image
                      src={thumbSrc}
                      alt=""
                      fill
                      sizes="112px"
                      loading="lazy"
                      unoptimized={thumbRemote}
                      className="carGalleryThumbImg"
                      onError={() =>
                        setFailedThumbs((prev) => ({ ...prev, [image.id]: true }))
                      }
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
