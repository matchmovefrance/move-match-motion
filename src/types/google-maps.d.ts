
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
    }
    
    class Marker {
      constructor(opts?: MarkerOptions);
    }
    
    class Polyline {
      constructor(opts?: PolylineOptions);
    }
    
    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      styles?: MapTypeStyle[];
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
    }
    
    interface Icon {
      url: string;
      scaledSize?: Size;
    }
    
    interface PolylineOptions {
      path?: LatLng[] | LatLngLiteral[];
      geodesic?: boolean;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      map?: Map;
      icons?: IconSequence[];
    }
    
    interface IconSequence {
      icon: Symbol;
      offset: string;
      repeat: string;
    }
    
    interface Symbol {
      path: string;
      strokeOpacity: number;
      scale: number;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: any[];
    }
    
    interface GeocoderRequest {
      address?: string;
    }
    
    interface GeocoderResult {
      geometry: {
        location: LatLng;
      };
    }
    
    type GeocoderStatus = string;
  }
}

export {};
