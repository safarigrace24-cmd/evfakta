"use client";

import Image from "next/image";
import { useState } from "react";
import type { Car, CarGalleryImage } from "@/data/cars";
import { CAR_IMAGE_TYPE_LABELS } from "@/lib/admin/car-image-types";

type CarGalleryProps = {
  car: Car;
};

function fallbackSrc(car: Car): string {
  return car.imageUrl?.trim() || `/images/cars/${car.slug}.webp`;
}

export default function CarGallery({ car }: CarGalleryProps) {
  const gallery = car.images?.length
    ? car.images
    : ([
        {
          id: "legacy",
          imageUrl: fallbackSrc(car),
          imageType: "other" as const,
          altText: `${car.brand} ${car.model}`,
          sortOrder: 0,
          isPrimary: true,
        },
      ] satisfies CarGalleryImage[]);

  const primaryIndex = Math.max(
    0,
    gallery.findIndex((image) => image.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex >= 0 ? primaryIndex : 0);
  const [failedMain, setFailedMain] = useState(false);

  const active = gallery[activeIndex] ?? gallery[0];
  const src = active?.imageUrl?.trim() || fallbackSrc(car);
  const isRemote = src.startsWith("http://") || src.startsWith("https://");
  const showThumbs = gallery.length > 1;

  return (
    <div className="carGallery">
      <div className="detailHero carGalleryMain">
        <div className="detailHeroGlow" aria-hidden="true" />
        {failedMain ? (
          <span className="detailHeroLetter" aria-hidden="true">
            {car.brand.slice(0, 1)}
          </span>
        ) : (
          <Image
            src={src}
            alt={active?.altText || `${car.brand} ${car.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
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
      </div>

      {showThumbs && (
        <ul className="carGalleryThumbs" aria-label="Bildegalleri">
          {gallery.map((image, index) => {
            const thumbSrc = image.imageUrl?.trim() || fallbackSrc(car);
            const thumbRemote =
              thumbSrc.startsWith("http://") || thumbSrc.startsWith("https://");
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
                  onClick={() => {
                    setActiveIndex(index);
                    setFailedMain(false);
                  }}
                >
                  <Image
                    src={thumbSrc}
                    alt=""
                    fill
                    sizes="96px"
                    unoptimized={thumbRemote}
                    className="carGalleryThumbImg"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
