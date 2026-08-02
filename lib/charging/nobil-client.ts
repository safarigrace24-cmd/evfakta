/**
 * NOBIL client for charging stations.
 * Call only from server route handlers. Never expose NOBIL_API_KEY to the browser.
 */

import {
  availableFiltersFromStations,
  filterStations,
  radiusKmToMeters,
  sortStationsByDistance,
} from "@/lib/charging/geo";
import { normalizeNobilResponse } from "@/lib/charging/normalize-nobil";
import {
  NOBIL_ATTRIBUTION,
  type ChargingStationsQuery,
  type ChargingStationsResponse,
} from "@/lib/charging/types";

const NOBIL_SEARCH_URL = "https://nobil.no/api/server/search.php";

export function getNobilApiKey(): string | null {
  return process.env.NOBIL_API_KEY?.trim() || null;
}

export function isNobilConfigured(): boolean {
  return Boolean(getNobilApiKey());
}

export type NobilFetchResult =
  | ChargingStationsResponse
  | { ok: false; error: string; code: "missing_key" | "upstream" | "empty" };

/**
 * Query nearby stations via NOBIL type=near.
 * Coordinates must already be validated by the route layer.
 * Does not log latitude/longitude.
 */
export async function fetchNearbyChargingStations(
  query: ChargingStationsQuery,
  options?: { fetchImpl?: typeof fetch },
): Promise<NobilFetchResult> {
  const apiKey = getNobilApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "Ladestasjonsdata er midlertidig utilgjengelig.",
      code: "missing_key",
    };
  }

  const limit = Math.min(Math.max(query.limit ?? 40, 1), 100);
  const distance = radiusKmToMeters(query.radiusKm);
  const fetchImpl = options?.fetchImpl ?? fetch;

  const body = new URLSearchParams({
    apikey: apiKey,
    apiversion: "3",
    action: "search",
    type: "near",
    lat: String(query.latitude),
    long: String(query.longitude),
    distance: String(distance),
    limit: String(limit),
    format: "json",
  });

  let payload: unknown;
  try {
    const response = await fetchImpl(NOBIL_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: "Kunne ikke hente ladestasjoner akkurat nå.",
        code: "upstream",
      };
    }

    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: "Kunne ikke hente ladestasjoner akkurat nå.",
      code: "upstream",
    };
  }

  const origin = { lat: query.latitude, lng: query.longitude };
  let stations = normalizeNobilResponse(payload, origin);
  stations = filterStations(stations, query);
  stations = sortStationsByDistance(stations).slice(0, limit);

  return {
    ok: true,
    stations,
    attribution: NOBIL_ATTRIBUTION,
    query: {
      radiusKm: query.radiusKm,
      count: stations.length,
    },
    availableFilters: availableFiltersFromStations(stations),
  };
}
