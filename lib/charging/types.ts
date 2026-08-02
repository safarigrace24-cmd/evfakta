/**
 * Normalized EVFAKTA charging-station shape (provider-agnostic).
 */

export type ChargingConnectorType =
  | "CCS"
  | "CHAdeMO"
  | "Type2"
  | "Schuko"
  | "Other";

export type ChargingCategory = "hurtiglading" | "normallading" | "unknown";

export type ChargingStation = {
  id: string;
  name: string;
  operator: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  chargingPointCount: number | null;
  connectorTypes: ChargingConnectorType[];
  maximumPowerKw: number | null;
  accessInformation: string | null;
  openingHours: string | null;
  chargingCategory: ChargingCategory;
  /** Distance in metres from query origin when known. */
  distanceMeters: number | null;
  source: "NOBIL";
  lastUpdated: string | null;
  /**
   * Live availability is never claimed unless NOBIL explicitly provides
   * reliable realtime data for the station. Default null = unknown.
   */
  liveAvailability: null;
};

export type ChargingStationsQuery = {
  latitude: number;
  longitude: number;
  /** Radius in kilometres. */
  radiusKm: number;
  connectorType?: ChargingConnectorType | null;
  minimumPowerKw?: number | null;
  chargingCategory?: ChargingCategory | null;
  limit?: number;
};

export type ChargingStationsResponse = {
  ok: true;
  stations: ChargingStation[];
  attribution: string;
  query: {
    radiusKm: number;
    count: number;
  };
  /** Filters that have matching data in this result set. */
  availableFilters: {
    connectorTypes: ChargingConnectorType[];
    categories: ChargingCategory[];
    maxPowerKw: number | null;
  };
};

export const ALLOWED_RADIUS_KM = [5, 10, 25, 50] as const;
export type AllowedRadiusKm = (typeof ALLOWED_RADIUS_KM)[number];

export const NOBIL_ATTRIBUTION =
  "Data: NOBIL (Enova) — Creative Commons Attribution 4.0 International.";
