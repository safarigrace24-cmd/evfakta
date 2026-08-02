/* Minimal ambient types for Google Maps JS API (loaded at runtime). */

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number): void;
      panTo(latLng: LatLngLiteral): void;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setIcon(icon: Symbol | string): void;
      setZIndex(zIndex: number): void;
      addListener(eventName: string, handler: () => void): void;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(opts: { map: Map; anchor: Marker }): void;
    }

    class LatLngBounds {
      extend(point: LatLngLiteral): void;
    }

    enum SymbolPath {
      CIRCLE = 0,
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
    }

    interface MarkerOptions {
      map?: Map | null;
      position?: LatLngLiteral;
      title?: string;
      icon?: Symbol | string;
    }

    interface Symbol {
      path: SymbolPath | string;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    interface InfoWindowOptions {
      content?: string | Element;
    }
  }
}

interface Window {
  google?: typeof google;
  __evfaktaMapsInit?: () => void;
}
