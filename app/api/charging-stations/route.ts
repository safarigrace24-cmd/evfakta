import { NextResponse } from "next/server";
import {
  isValidLatitude,
  isValidLongitude,
  parseAllowedRadiusKm,
  parseConnectorType,
} from "@/lib/charging/geo";
import { fetchNearbyChargingStations } from "@/lib/charging/nobil-client";
import type { ChargingCategory } from "@/lib/charging/types";
import { isChargingMapEnabled } from "@/lib/integrations/feature-flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCategory(raw: string | null): ChargingCategory | null {
  if (!raw) return null;
  if (raw === "hurtiglading" || raw === "normallading") return raw;
  return null;
}

/**
 * GET /api/charging-stations
 * Server-only NOBIL proxy. Never exposes NOBIL_API_KEY.
 * Does not log coordinates in production.
 */
export async function GET(request: Request) {
  if (!isChargingMapEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Ladekartet er ikke aktivert ennå." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("latitude"));
  const lng = Number(searchParams.get("longitude"));
  const radiusKm = parseAllowedRadiusKm(searchParams.get("radius"));
  const connectorType = parseConnectorType(searchParams.get("connectorType"));
  const minPowerRaw = searchParams.get("minimumPower");
  const minimumPowerKw =
    minPowerRaw != null && minPowerRaw !== ""
      ? Number(minPowerRaw)
      : null;
  const chargingCategory = parseCategory(searchParams.get("chargingCategory"));

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return NextResponse.json(
      { ok: false, error: "Ugyldige koordinater." },
      { status: 400 },
    );
  }

  if (radiusKm == null) {
    return NextResponse.json(
      { ok: false, error: "Ugyldig radius. Bruk 5, 10, 25 eller 50 km." },
      { status: 400 },
    );
  }

  if (
    minimumPowerKw != null &&
    (!Number.isFinite(minimumPowerKw) ||
      minimumPowerKw < 0 ||
      minimumPowerKw > 1000)
  ) {
    return NextResponse.json(
      { ok: false, error: "Ugyldig minimumseffekt." },
      { status: 400 },
    );
  }

  const result = await fetchNearbyChargingStations({
    latitude: lat,
    longitude: lng,
    radiusKm,
    connectorType,
    minimumPowerKw:
      minimumPowerKw != null && Number.isFinite(minimumPowerKw)
        ? minimumPowerKw
        : null,
    chargingCategory,
    limit: 50,
  });

  if (!result.ok) {
    const status = result.code === "missing_key" ? 503 : 502;
    return NextResponse.json(
      { ok: false, error: result.error },
      { status },
    );
  }

  // Public contract aliases (connectors / maxPower) alongside full EVFAKTA shape.
  const stations = result.stations.map((station) => ({
    ...station,
    connectors: station.connectorTypes,
    maxPower: station.maximumPowerKw,
  }));

  return NextResponse.json({
    ...result,
    stations,
  });
}
