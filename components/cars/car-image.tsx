"use client";

import { useState } from "react";
import Image from "next/image";
import type { Car } from "@/data/cars";

type CarImageProps = {
  car: Car;
  variant?: "card" | "hero";
  priority?: boolean;
};

function LetterFallback({
  brand,
  variant,
}: {
  brand: string;
  variant: "card" | "hero";
}) {
  return (
    <span
      className={variant === "hero" ? "detailHeroLetter" : undefined}
      aria-hidden="true"
    >
      {brand.slice(0, 1)}
    </span>
  );
}

export default function CarImage({
  car,
  variant = "card",
  priority = false,
}: CarImageProps) {
  const [failed, setFailed] = useState(false);
  const src = car.imageUrl?.trim() || "";
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  if (!src || failed) {
    return <LetterFallback brand={car.brand} variant={variant} />;
  }

  return (
    <Image
      src={src}
      alt={`${car.brand} ${car.model}`}
      fill
      sizes={
        variant === "hero"
          ? "(max-width: 768px) 100vw, 640px"
          : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      }
      priority={priority}
      unoptimized={isRemote}
      className={variant === "hero" ? "carImageHero" : "carImageCard"}
      onError={() => setFailed(true)}
    />
  );
}
