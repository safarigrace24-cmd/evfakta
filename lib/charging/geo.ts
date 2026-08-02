/**
 * Pure helpers for charging queries — no secrets, safe to unit test.
 */

import {
  ALLOWED_RADIUS_KM,
  type AllowedRadiusKm,
  type ChargingCategory,
  type ChargingConnectorType,
  type ChargingStation,
  type ChargingStationsQuery,
} from "@/lib/charging/types";

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function parseAllowedRadiusKm(raw: unknown): AllowedRadiusKm | null {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return null;
  return (ALLOWED_RADIUS_KM as readonly number[]).includes(n)
    ? (n as AllowedRadiusKm)
    : null;
}

export function radiusKmToMeters(radiusKm: number): number {
  return Math.round(radiusKm * 1000);
}

/** Haversine distance in metres. */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function parseConnectorType(raw: string | null | undefined): ChargingConnectorType | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (v === "ccs" || v.includes("combo") || v.includes("ccs")) return "CCS";
  if (v === "chademo" || v.includes("chademo")) return "CHAdeMO";
  if (v === "type2" || v === "type 2" || v.includes("type 2") || v.includes("type2")) {
    return "Type2";
  }
  if (v.includes("schuko") || v.includes("cee 7")) return "Schuko";
  if (v === "other") return "Other";
  return null;
}

export function inferChargingCategory(maxPowerKw: number | null): ChargingCategory {
  if (maxPowerKw == null || !Number.isFinite(maxPowerKw)) return "unknown";
  if (maxPowerKw >= 50) return "hurtiglading";
  return "normallading";
}

export function parsePowerKwFromText(text: string | null | undefined): number | null {
  if (!text?.trim()) return null;
  const lower = text.toLowerCase();
  // Explicit kW
  const kw = lower.match(/(\d+(?:[.,]\d+)?)\s*kw/);
  if (kw) return Math.round(Number(kw[1].replace(",", ".")));
  // Common NOBIL capacity strings
  if (lower.includes("500v") && lower.includes("dc")) return 150;
  if (lower.includes("400v") && lower.includes("dc") && lower.includes("125")) return 50;
  if (lower.includes("400v") && lower.includes("dc")) return 50;
  if (lower.includes("230v") && lower.includes("32a")) return 22;
  if (lower.includes("230v") && lower.includes("16a")) return 3.7;
  if (lower.includes("400v") && lower.includes("16a")) return 11;
  if (lower.includes("400v") && lower.includes("32a")) return 22;
  return null;
}

export function filterStations(
  stations: ChargingStation[],
  query: Pick<
    ChargingStationsQuery,
    "connectorType" | "minimumPowerKw" | "chargingCategory"
  >,
): ChargingStation[] {
  return stations.filter((station) => {
    if (query.connectorType && !station.connectorTypes.includes(query.connectorType)) {
      return false;
    }
    if (
      query.minimumPowerKw != null &&
      (station.maximumPowerKw == null ||
        station.maximumPowerKw < query.minimumPowerKw)
    ) {
      return false;
    }
    if (
      query.chargingCategory &&
      query.chargingCategory !== "unknown" &&
      station.chargingCategory !== query.chargingCategory
    ) {
      return false;
    }
    return true;
  });
}

export type ChargingStationSort =
  | "nearest"
  | "highest_power"
  | "most_points";

export function sortStationsByDistance(stations: ChargingStation[]): ChargingStation[] {
  return [...stations].sort((a, b) => {
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}

export function sortStations(
  stations: ChargingStation[],
  sort: ChargingStationSort,
): ChargingStation[] {
  if (sort === "nearest") return sortStationsByDistance(stations);
  if (sort === "highest_power") {
    return [...stations].sort((a, b) => {
      const pa = a.maximumPowerKw ?? -1;
      const pb = b.maximumPowerKw ?? -1;
      if (pb !== pa) return pb - pa;
      return (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
        (b.distanceMeters ?? Number.POSITIVE_INFINITY);
    });
  }
  return [...stations].sort((a, b) => {
    const ca = a.chargingPointCount ?? -1;
    const cb = b.chargingPointCount ?? -1;
    if (cb !== ca) return cb - ca;
    return (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (b.distanceMeters ?? Number.POSITIVE_INFINITY);
  });
}

/** Public Google Maps directions URL (no API key). */
export function googleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
): string {
  const destination = `${latitude},${longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function availableFiltersFromStations(stations: ChargingStation[]) {
  const connectorTypes = new Set<ChargingConnectorType>();
  const categories = new Set<ChargingCategory>();
  let maxPowerKw: number | null = null;
  for (const station of stations) {
    for (const c of station.connectorTypes) connectorTypes.add(c);
    categories.add(station.chargingCategory);
    if (station.maximumPowerKw != null) {
      maxPowerKw =
        maxPowerKw == null
          ? station.maximumPowerKw
          : Math.max(maxPowerKw, station.maximumPowerKw);
    }
  }
  return {
    connectorTypes: [...connectorTypes],
    categories: [...categories].filter((c) => c !== "unknown"),
    maxPowerKw,
  };
}
