
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      addListener(eventName: string, handler: () => void): void;
      getCenter(): LatLng;
      getZoom(): number;
      easeTo(options: { center: LatLng; duration: number; easing: (n: number) => number }): void;
      setFog(options: {
        color: string;
        'high-color': string;
        'horizon-blend': number;
      }): void;
      on(eventName: string, handler: () => void): void;
      scrollZoom: {
        disable(): void;
      };
      addControl(control: any, position: string): void;
      remove(): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      styles?: any[];
      projection?: string;
      pitch?: number;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      lng: number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class Marker {
      constructor(opts: MarkerOptions);
      addListener(eventName: string, handler: () => void): void;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map: Map;
      icon?: {
        url: string;
        scaledSize: Size;
      };
      title?: string;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Polyline {
      constructor(opts: PolylineOptions);
    }

    interface PolylineOptions {
      path: (LatLng | LatLngLiteral)[];
      geodesic: boolean;
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
      map: Map;
      icons?: Array<{
        icon: { path: string; strokeOpacity: number; scale: number };
        offset: string;
        repeat: string;
      }>;
    }

    class Geocoder {
      geocode(
        request: { address: string },
        callback: (results: GeocoderResult[] | null, status: string) => void
      ): void;
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng;
      };
    }

    class NavigationControl {
      constructor(options?: { visualizePitch: boolean });
    }
  }
}

declare var google: typeof google;
