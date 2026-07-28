import "server-only";

import type { CarImageRow } from "@/lib/admin/car-image-types";
import { listAdminCarImages } from "@/lib/admin/car-images";
import { getAdminCarById, listAdminCars } from "@/lib/admin/cars";
import {
  buildImageReviewCard,
  computeImageReviewReadiness,
  sortImageReviewCards,
  type ImageReviewCard,
  type ImageReviewReadiness,
} from "@/lib/admin/image-review";
import { hydrateCandidateReviewCopies } from "@/lib/admin/image-review-storage";
import { processFailedImageCandidateReplacements } from "@/lib/admin/image-role-replacement";
import {
  filterDefaultImageReviewCandidates,
  NO_OFFICIAL_IMAGE_MESSAGE,
} from "@/lib/admin/image-review-preview";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import type { AdminCar } from "@/lib/admin/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type ImageReviewModelSummary = {
  car: Pick<AdminCar, "id" | "slug" | "brand" | "model" | "image_url" | "is_published" | "import_status">;
  readiness: ImageReviewReadiness;
};

export type ImageReviewWorkspace = {
  car: AdminCar;
  gallery: CarImageRow[];
  /** All candidates including history (failed / superseded). */
  candidates: ResearchImageCandidate[];
  /** Usable candidates shown by default in Image Review. */
  cards: ImageReviewCard[];
  readiness: ImageReviewReadiness;
  /** Empty-state copy when no usable candidates remain. */
  emptyCandidatesMessage: string | null;
};

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function listImageCandidatesForCar(
  carId: string,
): Promise<ResearchImageCandidate[]> {
  if (!carId || !dbReady()) return [];

  const supabase = createAdminClient();
  const { data: items, error: itemsError } = await supabase
    .from("research_items")
    .select("id")
    .eq("existing_car_id", carId);

  if (itemsError || !items?.length) {
    if (itemsError) {
      console.error("[image-review] list items failed:", itemsError.message);
    }
    return [];
  }

  const itemIds = items.map((item) => item.id as string).filter(Boolean);
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("research_image_candidates")
    .select("*")
    .in("item_id", itemIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[image-review] list candidates failed:", error.message);
    return [];
  }

  return (data ?? []) as ResearchImageCandidate[];
}

export async function loadImageCandidatesByCarIds(
  carIds: string[],
): Promise<Map<string, ResearchImageCandidate[]>> {
  const map = new Map<string, ResearchImageCandidate[]>();
  if (carIds.length === 0 || !dbReady()) return map;

  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("research_items")
    .select("id, existing_car_id")
    .in("existing_car_id", carIds);

  const itemToCar = new Map(
    (items ?? [])
      .filter((item) => item.existing_car_id && item.id)
      .map((item) => [item.id as string, item.existing_car_id as string]),
  );
  const itemIds = [...itemToCar.keys()];
  if (itemIds.length === 0) return map;

  const { data: candidates } = await supabase
    .from("research_image_candidates")
    .select("*")
    .in("item_id", itemIds)
    .order("created_at", { ascending: true });

  for (const candidate of (candidates ?? []) as ResearchImageCandidate[]) {
    const carId = itemToCar.get(candidate.item_id);
    if (!carId) continue;
    const list = map.get(carId) ?? [];
    list.push(candidate);
    map.set(carId, list);
  }

  return map;
}

export async function loadImageReviewWorkspace(
  carId: string,
): Promise<ImageReviewWorkspace | null> {
  const car = await getAdminCarById(carId);
  if (!car) return null;

  const [gallery, rawCandidates] = await Promise.all([
    listAdminCarImages(car.id),
    listImageCandidatesForCar(car.id),
  ]);

  // Ensure local review copies exist — never hotlink OEM CDN in Image Review.
  const hydrated = await hydrateCandidateReviewCopies({
    candidates: rawCandidates,
    brand: car.brand || car.slug,
    modelSlug: car.slug,
  });

  // Permanently failed → queue replacement research per image role (history kept).
  const candidates = await processFailedImageCandidateReplacements({
    candidates: hydrated,
    brand: car.brand || car.slug,
    modelSlug: car.slug,
    modelName: car.model,
    carId: car.id,
  });

  const visible = filterDefaultImageReviewCandidates(candidates);
  const cards = sortImageReviewCards(
    visible.map((image) => buildImageReviewCard(image, candidates)),
  );
  const readiness = computeImageReviewReadiness({
    gallery,
    candidates,
    carImageUrl: car.image_url,
  });

  const emptyCandidatesMessage =
    visible.length === 0
      ? rawCandidates.length > 0 || candidates.length > 0
        ? NO_OFFICIAL_IMAGE_MESSAGE
        : null
      : null;

  return {
    car,
    gallery,
    candidates,
    cards,
    readiness,
    emptyCandidatesMessage,
  };
}

export async function loadImageReviewSummaries(): Promise<ImageReviewModelSummary[]> {
  const cars = await listAdminCars();
  const carIds = cars.map((car) => car.id);
  const candidatesByCar = await loadImageCandidatesByCarIds(carIds);

  const galleryByCar = new Map<string, CarImageRow[]>();
  if (carIds.length > 0 && dbReady()) {
    const supabase = createAdminClient();
    const { data: images } = await supabase
      .from("car_images")
      .select("*")
      .in("car_id", carIds);
    for (const image of (images ?? []) as CarImageRow[]) {
      const list = galleryByCar.get(image.car_id) ?? [];
      list.push(image);
      galleryByCar.set(image.car_id, list);
    }
  }

  return cars
    .map((car) => {
      const gallery = galleryByCar.get(car.id) ?? [];
      const candidates = candidatesByCar.get(car.id) ?? [];
      return {
        car: {
          id: car.id,
          slug: car.slug,
          brand: car.brand,
          model: car.model,
          image_url: car.image_url,
          is_published: car.is_published,
          import_status: car.import_status,
        },
        readiness: computeImageReviewReadiness({
          gallery,
          candidates,
          carImageUrl: car.image_url,
        }),
      };
    })
    .sort((a, b) => {
      if (a.readiness.imagesReady !== b.readiness.imagesReady) {
        return a.readiness.imagesReady ? 1 : -1;
      }
      return `${a.car.brand} ${a.car.model}`.localeCompare(
        `${b.car.brand} ${b.car.model}`,
      );
    });
}
