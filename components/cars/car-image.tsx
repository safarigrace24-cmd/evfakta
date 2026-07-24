"use client";

import { useState } from "react";
import Image from "next/image";
import type { Car } from "@/data/cars";

type CarImageProps = {
  car: Car;
  variant?: "card" | "hero";
  priority?: boolean;
};

export default function CarImage({
  car,
  variant = "card",
  priority = false,
}: CarImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={variant === "hero" ? "detailHeroLetter" : undefined}
        aria-hidden="true"
      >
        {car.brand.slice(0, 1)}
      </span>
    );
  }

  return (
    <Image
      src={`/images/cars/${car.slug}.webp`}
      alt={`${car.brand} ${car.model}`}
      fill
      sizes={
        variant === "hero"
          ? "(max-width: 768px) 100vw, 640px"
          : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      }
      priority={priority}
      className={variant === "hero" ? "carImageHero" : "carImageCard"}
      onError={() => setFailed(true)}
    />
  );
}
