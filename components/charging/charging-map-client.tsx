"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChargingStation } from "@/lib/charging/types";
import { ALLOWED_RADIUS_KM, NOBIL_ATTRIBUTION } from "@/lib/charging/types";
import {
  googleMapsDirectionsUrl,
  sortStations,
  type ChargingStationSort,
} from "@/lib/charging/geo";
import {
  chargingLocationErrorMessage,
  type ChargingLocationErrorCode,
} from "@/lib/charging/location-errors";

type Props = {
  mapsApiKey: string;
};

type LocationErrorCode = ChargingLocationErrorCode | null;

type Filters = {
  radiusKm: (typeof ALLOWED_RADIUS_KM)[number];
  hurtiglading: boolean;
  normallading: boolean;
  ccs: boolean;
  chademo: boolean;
  type2: boolean;
  minimumPowerKw: number | null;
};

const NORWAY_CENTER = { lat: 64.5, lng: 11.5 };
const NORWAY_ZOOM = 5;

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("unsupported"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google as typeof google);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-evfakta-google-maps]",
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google as typeof google);
        else reject(new Error("maps_load_failed"));
      });
      return;
    }

    window.__evfaktaMapsInit = () => {
      if (window.google?.maps) resolve(window.google as typeof google);
      else reject(new Error("maps_load_failed"));
    };

    const script = document.createElement("script");
    script.dataset.evfaktaGoogleMaps = "1";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=nb&region=NO&callback=__evfaktaMapsInit`;
    script.onerror = () => reject(new Error("maps_load_failed"));
    document.head.appendChild(script);
  });
}

function formatDistance(meters: number | null): string {
  if (meters == null) return "Ikke oppgitt";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function ChargingMapClient({ mapsApiKey }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const userMarker = useRef<google.maps.Marker | null>(null);
  const stationMarkers = useRef<
    Array<{ id: string; marker: google.maps.Marker }>
  >([]);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<LocationErrorCode>(null);
  const [locating, setLocating] = useState(false);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<ChargingStationSort>("nearest");
  const [attribution, setAttribution] = useState(NOBIL_ATTRIBUTION);
  const [availableConnectors, setAvailableConnectors] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    radiusKm: 10,
    hurtiglading: false,
    normallading: false,
    ccs: false,
    chademo: false,
    type2: false,
    minimumPowerKw: null,
  });

  const sortedStations = useMemo(
    () => sortStations(stations, sort),
    [stations, sort],
  );

  const selectedStation = useMemo(
    () => sortedStations.find((s) => s.id === selectedId) ?? null,
    [sortedStations, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(mapsApiKey)
      .then((g) => {
        if (cancelled || !mapRef.current) return;
        mapInstance.current = new g.maps.Map(mapRef.current, {
          center: NORWAY_CENTER,
          zoom: NORWAY_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        setMapsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMapsError(
            "Google Maps er utilgjengelig. Sjekk Maps API-nøkkelen eller prøv igjen senere.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mapsApiKey]);

  const clearStationMarkers = useCallback(() => {
    for (const entry of stationMarkers.current) entry.marker.setMap(null);
    stationMarkers.current = [];
  }, []);

  const styleMarker = useCallback(
    (marker: google.maps.Marker, selected: boolean) => {
      if (!window.google?.maps) return;
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: selected ? 11 : 8,
        fillColor: selected ? "#0f6b45" : "#1f4e3d",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: selected ? 3 : 2,
      });
      marker.setZIndex(selected ? 1000 : 1);
    },
    [],
  );

  const selectStation = useCallback(
    (station: ChargingStation, pan = true) => {
      setSelectedId(station.id);
      for (const entry of stationMarkers.current) {
        styleMarker(entry.marker, entry.id === station.id);
      }
      if (pan && mapInstance.current) {
        mapInstance.current.panTo({
          lat: station.latitude,
          lng: station.longitude,
        });
        mapInstance.current.setZoom(15);
      }
    },
    [styleMarker],
  );

  const plotStations = useCallback(
    (list: ChargingStation[]) => {
      if (!mapInstance.current || !window.google?.maps) return;
      clearStationMarkers();
      const bounds = new window.google.maps.LatLngBounds();
      if (userPos) bounds.extend(userPos);

      for (const station of list) {
        const marker = new window.google.maps.Marker({
          map: mapInstance.current,
          position: { lat: station.latitude, lng: station.longitude },
          title: station.name,
        });
        styleMarker(marker, station.id === selectedId);
        marker.addListener("click", () => {
          selectStation(station, false);
          const info = new window.google.maps.InfoWindow({
            content: `<div style="max-width:240px"><strong>${escapeHtml(station.name)}</strong><br/>${escapeHtml(
              station.operator || "",
            )}<br/>${
              station.maximumPowerKw != null
                ? `Maks ${station.maximumPowerKw} kW`
                : "Effekt ikke oppgitt"
            }</div>`,
          });
          info.open({ map: mapInstance.current!, anchor: marker });
        });
        stationMarkers.current.push({ id: station.id, marker });
        bounds.extend({ lat: station.latitude, lng: station.longitude });
      }

      if (list.length > 0 || userPos) {
        mapInstance.current.fitBounds(bounds, 64);
      }
    },
    [clearStationMarkers, selectStation, selectedId, styleMarker, userPos],
  );

  const fetchStations = useCallback(
    async (pos: { lat: number; lng: number }, nextFilters: Filters) => {
      setLoadingStations(true);
      setStationsError(null);
      try {
        const params = new URLSearchParams({
          latitude: String(pos.lat),
          longitude: String(pos.lng),
          radius: String(nextFilters.radiusKm),
        });
        if (nextFilters.hurtiglading && !nextFilters.normallading) {
          params.set("chargingCategory", "hurtiglading");
        } else if (nextFilters.normallading && !nextFilters.hurtiglading) {
          params.set("chargingCategory", "normallading");
        }
        if (nextFilters.ccs && !nextFilters.chademo && !nextFilters.type2) {
          params.set("connectorType", "CCS");
        } else if (nextFilters.chademo && !nextFilters.ccs && !nextFilters.type2) {
          params.set("connectorType", "CHAdeMO");
        } else if (nextFilters.type2 && !nextFilters.ccs && !nextFilters.chademo) {
          params.set("connectorType", "Type2");
        }
        if (nextFilters.minimumPowerKw != null) {
          params.set("minimumPower", String(nextFilters.minimumPowerKw));
        }

        const response = await fetch(`/api/charging-stations?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const json = (await response.json()) as {
          ok: boolean;
          error?: string;
          stations?: ChargingStation[];
          attribution?: string;
          availableFilters?: {
            connectorTypes?: string[];
            categories?: string[];
          };
        };

        if (!response.ok || !json.ok) {
          setStations([]);
          setSelectedId(null);
          setStationsError(
            json.error || "NOBIL er midlertidig utilgjengelig. Prøv igjen senere.",
          );
          clearStationMarkers();
          return;
        }

        let list = json.stations || [];
        const wantedConnectors: string[] = [];
        if (nextFilters.ccs) wantedConnectors.push("CCS");
        if (nextFilters.chademo) wantedConnectors.push("CHAdeMO");
        if (nextFilters.type2) wantedConnectors.push("Type2");
        if (wantedConnectors.length > 1) {
          list = list.filter((s) =>
            wantedConnectors.some((c) => s.connectorTypes.includes(c as never)),
          );
        }
        if (nextFilters.hurtiglading && nextFilters.normallading) {
          list = list.filter(
            (s) =>
              s.chargingCategory === "hurtiglading" ||
              s.chargingCategory === "normallading",
          );
        }

        setStations(list);
        setAttribution(json.attribution || NOBIL_ATTRIBUTION);
        setAvailableConnectors(json.availableFilters?.connectorTypes || []);
        setAvailableCategories(json.availableFilters?.categories || []);
        if (list.length === 0) {
          setSelectedId(null);
        } else if (!list.some((s) => s.id === selectedId)) {
          setSelectedId(list[0]?.id ?? null);
        }
        plotStations(list);
      } catch {
        setStationsError("NOBIL er midlertidig utilgjengelig. Prøv igjen senere.");
        setStations([]);
        setSelectedId(null);
      } finally {
        setLoadingStations(false);
      }
    },
    [clearStationMarkers, plotStations, selectedId],
  );

  const useMyPosition = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("unsupported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPos(pos);
        setLocating(false);
        if (mapInstance.current && window.google?.maps) {
          if (userMarker.current) userMarker.current.setMap(null);
          userMarker.current = new window.google.maps.Marker({
            map: mapInstance.current,
            position: pos,
            title: "Din posisjon",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#0f6b45",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          mapInstance.current.setCenter(pos);
          mapInstance.current.setZoom(12);
        }
        void fetchStations(pos, filters);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("permission_denied");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("timeout");
        } else {
          setLocationError("unavailable");
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  }, [fetchStations, filters]);

  useEffect(() => {
    if (!userPos || !mapsReady) return;
    void fetchStations(userPos, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on filter change only when we have a position
  }, [
    filters.radiusKm,
    filters.hurtiglading,
    filters.normallading,
    filters.ccs,
    filters.chademo,
    filters.type2,
    filters.minimumPowerKw,
  ]);

  useEffect(() => {
    for (const entry of stationMarkers.current) {
      styleMarker(entry.marker, entry.id === selectedId);
    }
  }, [selectedId, styleMarker]);

  const showConnectorFilter = useMemo(() => {
    const hasData = availableConnectors.length > 0 || stations.length > 0;
    if (!hasData) {
      return { ccs: true, chademo: true, type2: true };
    }
    return {
      ccs: availableConnectors.includes("CCS") || filters.ccs,
      chademo: availableConnectors.includes("CHAdeMO") || filters.chademo,
      type2: availableConnectors.includes("Type2") || filters.type2,
    };
  }, [availableConnectors, filters.ccs, filters.chademo, filters.type2, stations.length]);

  const showCategoryFilter = useMemo(() => {
    const hasData = availableCategories.length > 0 || stations.length > 0;
    if (!hasData) {
      return { hurtig: true, normal: true };
    }
    return {
      hurtig:
        availableCategories.includes("hurtiglading") || filters.hurtiglading,
      normal:
        availableCategories.includes("normallading") || filters.normallading,
    };
  }, [
    availableCategories,
    filters.hurtiglading,
    filters.normallading,
    stations.length,
  ]);

  return (
    <div className="chargingMapLayout">
      <aside className="chargingMapSidebar" aria-label="Ladestasjoner">
        <p className="chargingMapPrivacy" role="note">
          Posisjonen din brukes kun til å finne ladestasjoner i nærheten og lagres
          ikke av EVFAKTA.
        </p>

        <div className="chargingMapActions">
          <button
            type="button"
            className="button primary"
            onClick={useMyPosition}
            disabled={locating || Boolean(mapsError)}
          >
            {locating ? "Henter posisjon…" : "Bruk min posisjon"}
          </button>
        </div>

        {locationError ? (
          <p className="chargingMapError" role="alert">
            {chargingLocationErrorMessage(locationError)}
          </p>
        ) : null}

        <fieldset className="chargingMapFilters">
          <legend>Radius</legend>
          <div className="chargingMapRadius">
            {ALLOWED_RADIUS_KM.map((km) => (
              <label key={km}>
                <input
                  type="radio"
                  name="radius"
                  checked={filters.radiusKm === km}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, radiusKm: km }))
                  }
                />
                <span>{km} km</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="chargingMapFilters">
          <legend>Filtre</legend>
          {(showCategoryFilter.hurtig || showCategoryFilter.normal) && (
            <>
              {showCategoryFilter.hurtig ? (
                <label>
                  <input
                    type="checkbox"
                    checked={filters.hurtiglading}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        hurtiglading: e.target.checked,
                      }))
                    }
                  />
                  <span>Hurtiglading</span>
                </label>
              ) : null}
              {showCategoryFilter.normal ? (
                <label>
                  <input
                    type="checkbox"
                    checked={filters.normallading}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        normallading: e.target.checked,
                      }))
                    }
                  />
                  <span>Normallading</span>
                </label>
              ) : null}
            </>
          )}
          {showConnectorFilter.ccs ? (
            <label>
              <input
                type="checkbox"
                checked={filters.ccs}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, ccs: e.target.checked }))
                }
              />
              <span>CCS</span>
            </label>
          ) : null}
          {showConnectorFilter.chademo ? (
            <label>
              <input
                type="checkbox"
                checked={filters.chademo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, chademo: e.target.checked }))
                }
              />
              <span>CHAdeMO</span>
            </label>
          ) : null}
          {showConnectorFilter.type2 ? (
            <label>
              <input
                type="checkbox"
                checked={filters.type2}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type2: e.target.checked }))
                }
              />
              <span>Type 2</span>
            </label>
          ) : null}
          <label className="chargingMapMinKw">
            <span>Ladehastighet</span>
            <select
              value={filters.minimumPowerKw ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minimumPowerKw: e.target.value
                    ? Number(e.target.value)
                    : null,
                }))
              }
            >
              <option value="">Alle</option>
              <option value="22">22 kW+</option>
              <option value="50">50 kW+</option>
              <option value="100">100 kW+</option>
              <option value="150">150 kW+</option>
              <option value="300">300 kW+</option>
            </select>
          </label>
        </fieldset>

        <label className="chargingMapMinKw">
          <span>Sortering</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ChargingStationSort)}
          >
            <option value="nearest">Nærmeste</option>
            <option value="highest_power">Høyest effekt</option>
            <option value="most_points">Flest ladepunkt</option>
          </select>
        </label>

        {!mapsReady && !mapsError ? (
          <p className="adminHint" role="status">
            Laster kart…
          </p>
        ) : null}
        {loadingStations ? (
          <p className="adminHint" role="status">
            Henter stasjoner…
          </p>
        ) : null}
        {stationsError ? (
          <p className="chargingMapError" role="alert">
            {stationsError}
          </p>
        ) : null}
        {userPos && !loadingStations && !stationsError && stations.length === 0 ? (
          <p className="adminHint" role="status">
            Ingen ladestasjoner funnet med valgte filtre. Prøv større radius.
          </p>
        ) : null}

        {selectedStation ? (
          <section
            className="chargingMapSelectedPanel"
            aria-labelledby="charging-selected-heading"
          >
            <h2 id="charging-selected-heading">{selectedStation.name}</h2>
            <dl className="chargingMapSelectedMeta">
              <div>
                <dt>Operatør</dt>
                <dd>{selectedStation.operator || "Ikke oppgitt"}</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>
                  {selectedStation.address || "Ikke oppgitt"}
                  {selectedStation.city ? `, ${selectedStation.city}` : ""}
                </dd>
              </div>
              <div>
                <dt>Avstand</dt>
                <dd>{formatDistance(selectedStation.distanceMeters)}</dd>
              </div>
              <div>
                <dt>Maks effekt</dt>
                <dd>
                  {selectedStation.maximumPowerKw != null
                    ? `${selectedStation.maximumPowerKw} kW`
                    : "Ikke oppgitt"}
                </dd>
              </div>
              <div>
                <dt>Kontakter</dt>
                <dd>
                  {selectedStation.connectorTypes.length
                    ? selectedStation.connectorTypes.join(", ")
                    : "Ikke oppgitt"}
                </dd>
              </div>
              <div>
                <dt>Ladepunkt</dt>
                <dd>
                  {selectedStation.chargingPointCount != null
                    ? selectedStation.chargingPointCount
                    : "Ikke oppgitt"}
                </dd>
              </div>
              <div>
                <dt>Tilgang</dt>
                <dd>{selectedStation.accessInformation || "Ikke oppgitt"}</dd>
              </div>
              <div>
                <dt>Åpningstider</dt>
                <dd>{selectedStation.openingHours || "Ikke oppgitt"}</dd>
              </div>
            </dl>
            <a
              className="button secondary buttonSm"
              href={googleMapsDirectionsUrl(
                selectedStation.latitude,
                selectedStation.longitude,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Åpne veibeskrivelse
            </a>
          </section>
        ) : null}

        <ol className="chargingMapStationList">
          {sortedStations.map((station) => (
            <li key={station.id}>
              <button
                type="button"
                className={
                  station.id === selectedId
                    ? "chargingMapStationItem isSelected"
                    : "chargingMapStationItem"
                }
                aria-current={station.id === selectedId ? "true" : undefined}
                onClick={() => selectStation(station)}
              >
                <strong>{station.name}</strong>
                <span>
                  {formatDistance(station.distanceMeters)}
                  {station.operator ? ` · ${station.operator}` : ""}
                </span>
                <span>
                  {station.maximumPowerKw != null
                    ? `Maks ${station.maximumPowerKw} kW`
                    : "Effekt ikke oppgitt"}
                  {station.connectorTypes.length
                    ? ` · ${station.connectorTypes.join(", ")}`
                    : ""}
                </span>
                <span>
                  {station.chargingPointCount != null
                    ? `${station.chargingPointCount} ladepunkt`
                    : ""}
                  {station.address
                    ? ` · ${station.address}${station.city ? `, ${station.city}` : ""}`
                    : station.city
                      ? ` · ${station.city}`
                      : ""}
                </span>
                {station.openingHours ? (
                  <span>Åpningstider: {station.openingHours}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>

        {!userPos && !locationError ? (
          <p className="adminHint">
            Trykk «Bruk min posisjon» for å finne nærmeste ladestasjoner. Vi ber
            om tillatelse først.
          </p>
        ) : null}

        <p className="chargingMapAttribution">{attribution}</p>
        <p className="adminHint">
          Vi viser ikke live ledighet eller priser. Data fra NOBIL kan være
          ufullstendig.
        </p>
      </aside>

      <div className="chargingMapCanvasWrap">
        {mapsError ? (
          <p className="chargingMapError" role="alert">
            {mapsError}
          </p>
        ) : null}
        <div
          ref={mapRef}
          className="chargingMapCanvas"
          role="region"
          aria-label="Kart over ladestasjoner i Norge"
        />
      </div>
    </div>
  );
}
