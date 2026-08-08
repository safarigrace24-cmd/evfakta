import type { Car } from "@/data/cars";
import type { ChatCarFact } from "@/lib/chat/types";

export function modelPageUrl(slug: string): string {
  return `/modeller/${slug}`;
}

function positiveOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function toChatCarFact(car: Car): ChatCarFact {
  return {
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    url: modelPageUrl(car.slug),
    year: car.year ?? null,
    bodyStyle: car.bodyStyle ?? null,
    seats: car.seats ?? null,
    priceNok: positiveOrNull(car.priceNok),
    rangeKm: positiveOrNull(car.rangeKm),
    winterRangeKm: positiveOrNull(car.winterRangeKm ?? null),
    batteryKwh: positiveOrNull(car.batteryTotalKwh ?? car.batteryKwh),
    batteryUsableKwh: positiveOrNull(car.batteryUsableKwh ?? null),
    dcKw: positiveOrNull(car.dcKw),
    acKw: positiveOrNull(car.acKw),
    chargeTime1080Minutes: positiveOrNull(car.chargeTime1080Minutes ?? null),
    consumptionKwh100km: positiveOrNull(car.consumptionKwh100km ?? null),
    drive: car.drive || null,
    cargoL: positiveOrNull(car.cargoL ?? null),
    towingKg: positiveOrNull(car.towingKg ?? null),
    suitableFor: car.suitableFor ?? null,
    heatPump: car.heatPump ?? null,
  };
}

export function formatCarsForPrompt(cars: ChatCarFact[]): string {
  if (!cars.length) {
    return "Ingen publiserte elbiler ble funnet i EVFAKTA-databasen for dette spørsmålet.";
  }

  return cars
    .map((car, index) => {
      const lines = [
        `${index + 1}. ${car.brand} ${car.model} (${car.slug})`,
        `   Side: ${car.url}`,
        car.year != null ? `   Årsmodell: ${car.year}` : null,
        car.bodyStyle ? `   Karosseri: ${car.bodyStyle}` : null,
        car.seats != null ? `   Seter: ${car.seats}` : null,
        car.priceNok != null
          ? `   Pris (NOK, fra database): ${car.priceNok}`
          : "   Pris: ikke tilgjengelig i databasen",
        car.rangeKm != null
          ? `   WLTP-rekkevidde (km): ${car.rangeKm}`
          : "   WLTP-rekkevidde: ikke tilgjengelig",
        car.winterRangeKm != null
          ? `   Vinterrekkevidde (km, hvis lagret): ${car.winterRangeKm}`
          : null,
        car.batteryKwh != null
          ? `   Batteri (kWh): ${car.batteryKwh}`
          : "   Batteri: ikke tilgjengelig",
        car.batteryUsableKwh != null
          ? `   Brukbart batteri (kWh): ${car.batteryUsableKwh}`
          : null,
        car.dcKw != null ? `   DC-lading (kW): ${car.dcKw}` : null,
        car.acKw != null ? `   AC-lading (kW): ${car.acKw}` : null,
        car.chargeTime1080Minutes != null
          ? `   Ladetid 10–80 (min): ${car.chargeTime1080Minutes}`
          : null,
        car.consumptionKwh100km != null
          ? `   Forbruk (kWh/100 km): ${car.consumptionKwh100km}`
          : null,
        car.drive ? `   Drift: ${car.drive}` : null,
        car.cargoL != null ? `   Bagasje (l): ${car.cargoL}` : null,
        car.towingKg != null ? `   Tilhenger (kg): ${car.towingKg}` : null,
        car.heatPump != null
          ? `   Varmepumpe: ${car.heatPump ? "ja" : "nei/ukjent"}`
          : null,
        car.suitableFor?.length
          ? `   Egnet for: ${car.suitableFor.join("; ")}`
          : null,
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}
