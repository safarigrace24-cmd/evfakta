/**
 * Normalize raw NOBIL API payloads into EVFAKTA ChargingStation[].
 * Never invents prices or live availability.
 */

import {
  distanceMeters,
  inferChargingCategory,
  parseConnectorType,
  parsePowerKwFromText,
} from "@/lib/charging/geo";
import type { ChargingConnectorType, ChargingStation } from "@/lib/charging/types";

function parsePosition(raw: unknown): { lat: number; lng: number } | null {
  if (typeof raw !== "string") return null;
  const match = raw.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function readAttrTrans(attr: unknown, typeId: string): string | null {
  if (!attr || typeof attr !== "object") return null;
  const root = attr as Record<string, unknown>;
  for (const group of ["st", "conn"]) {
    const block = root[group];
    if (!block || typeof block !== "object") continue;
    for (const value of Object.values(block as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      if (String(row.attrtypeid) === typeId) {
        const trans = row.trans ?? row.attrval;
        return trans == null ? null : String(trans);
      }
    }
  }
  // Flat conn map keyed by connector index with nested attrs
  const conn = root.conn;
  if (conn && typeof conn === "object") {
    for (const point of Object.values(conn as Record<string, unknown>)) {
      if (!point || typeof point !== "object") continue;
      // point may itself be attrtypeid map
      for (const value of Object.values(point as Record<string, unknown>)) {
        if (!value || typeof value !== "object") continue;
        const row = value as Record<string, unknown>;
        if (String(row.attrtypeid) === typeId) {
          const trans = row.trans ?? row.attrval;
          return trans == null ? null : String(trans);
        }
      }
    }
  }
  return null;
}

function collectConnectors(attr: unknown): {
  connectors: ChargingConnectorType[];
  maxPowerKw: number | null;
} {
  const connectors = new Set<ChargingConnectorType>();
  let maxPowerKw: number | null = null;

  const pushConnector = (label: string | null) => {
    const parsed = parseConnectorType(label);
    if (parsed) connectors.add(parsed);
    else if (label?.trim()) connectors.add("Other");
  };

  const pushPower = (label: string | null) => {
    const kw = parsePowerKwFromText(label);
    if (kw != null) {
      maxPowerKw = maxPowerKw == null ? kw : Math.max(maxPowerKw, kw);
    }
  };

  if (attr && typeof attr === "object") {
    const root = attr as Record<string, unknown>;
    const conn = root.conn;
    if (conn && typeof conn === "object") {
      for (const point of Object.values(conn as Record<string, unknown>)) {
        if (!point || typeof point !== "object") continue;
        const pointObj = point as Record<string, unknown>;
        // Shape A: point is map of attrtypeid → attr
        for (const value of Object.values(pointObj)) {
          if (!value || typeof value !== "object") continue;
          const row = value as Record<string, unknown>;
          const typeId = String(row.attrtypeid ?? "");
          const label = String(row.trans ?? row.attrval ?? "");
          if (typeId === "4") pushConnector(label);
          if (typeId === "5") pushPower(label);
        }
        // Shape B: direct fields
        if (typeof pointObj.Connector === "string") pushConnector(pointObj.Connector);
        if (typeof pointObj.trans === "string" && String(pointObj.attrtypeid) === "4") {
          pushConnector(pointObj.trans);
        }
      }
    }
  }

  // Station-level fallbacks
  pushConnector(readAttrTrans(attr, "4"));
  pushPower(readAttrTrans(attr, "5"));

  return { connectors: [...connectors], maxPowerKw };
}

function normalizeOne(
  raw: Record<string, unknown>,
  origin: { lat: number; lng: number } | null,
): ChargingStation | null {
  const csmd =
    raw.csmd && typeof raw.csmd === "object"
      ? (raw.csmd as Record<string, unknown>)
      : raw;

  const position =
    parsePosition(csmd.Position) ||
    parsePosition(csmd.geolocation) ||
    parsePosition(csmd.position);

  if (!position) return null;

  const id = String(
    csmd.International_id ||
      csmd.international_id ||
      csmd.id ||
      `${position.lat},${position.lng}`,
  );

  const name = String(csmd.name || csmd.Name || "Ladestasjon").trim() || "Ladestasjon";
  const street = [csmd.Street, csmd.House_number, csmd.address]
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ")
    .trim();
  const city =
    typeof csmd.City === "string"
      ? csmd.City
      : typeof csmd.city === "string"
        ? csmd.city
        : null;
  const operator =
    typeof csmd.Owned_by === "string"
      ? csmd.Owned_by
      : typeof csmd.owner === "string"
        ? csmd.owner
        : null;

  const pointCountRaw =
    csmd.Number_charging_points ?? csmd.chargerpointnumber ?? csmd.charging_points;
  const chargingPointCount =
    typeof pointCountRaw === "number"
      ? pointCountRaw
      : typeof pointCountRaw === "string" && pointCountRaw.trim()
        ? Number(pointCountRaw)
        : null;

  const attr = raw.attr;
  const { connectors, maxPowerKw } = collectConnectors(attr);
  const chargerspeed =
    typeof csmd.chargerspeed === "string" ? csmd.chargerspeed : null;
  const power =
    maxPowerKw ?? parsePowerKwFromText(chargerspeed) ?? null;

  const access =
    readAttrTrans(attr, "2") ||
    (typeof csmd.accessibility === "string" ? csmd.accessibility : null) ||
    (typeof csmd.Contact_info === "string" ? csmd.Contact_info : null);

  const open24 = readAttrTrans(attr, "24");
  const openingHours =
    open24 === "Yes" || open24 === "true"
      ? "Åpent 24 timer"
      : typeof csmd.User_comment === "string"
        ? csmd.User_comment
        : null;

  const updated =
    typeof csmd.Updated === "string"
      ? csmd.Updated
      : typeof csmd.updated === "string"
        ? csmd.updated
        : null;

  const dist =
    origin != null
      ? distanceMeters(origin.lat, origin.lng, position.lat, position.lng)
      : null;

  return {
    id,
    name,
    operator,
    latitude: position.lat,
    longitude: position.lng,
    address: street || null,
    city,
    chargingPointCount:
      chargingPointCount != null && Number.isFinite(chargingPointCount)
        ? chargingPointCount
        : null,
    connectorTypes: connectors,
    maximumPowerKw: power,
    accessInformation: access,
    openingHours,
    chargingCategory: inferChargingCategory(power),
    distanceMeters: dist,
    source: "NOBIL",
    lastUpdated: updated,
    liveAvailability: null,
  };
}

/**
 * Accepts common NOBIL search response envelopes and returns stations.
 */
export function normalizeNobilResponse(
  payload: unknown,
  origin: { lat: number; lng: number } | null = null,
): ChargingStation[] {
  let rows: unknown[] = [];

  if (Array.isArray(payload)) {
    // Sometimes top-level is [{ Provider, chargerstations: [...] }]
    if (
      payload.length === 1 &&
      payload[0] &&
      typeof payload[0] === "object" &&
      Array.isArray((payload[0] as { chargerstations?: unknown }).chargerstations)
    ) {
      rows = (payload[0] as { chargerstations: unknown[] }).chargerstations;
    } else {
      rows = payload;
    }
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.chargerstations)) rows = obj.chargerstations;
    else if (Array.isArray(obj.stations)) rows = obj.stations;
  }

  const out: ChargingStation[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const station = normalizeOne(row as Record<string, unknown>, origin);
    if (station) out.push(station);
  }
  return out;
}
