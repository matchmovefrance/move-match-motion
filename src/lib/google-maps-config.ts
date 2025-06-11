
// Configuration pour Google Maps API utilisant la config centralisée
declare global {
  interface Window {
    APP_CONFIG: {
      GOOGLE_MAPS_API_KEY: string;
      EMAIL_DOMAIN: string;
      NOREPLY_EMAIL: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      CONFIG_VERSION: string;
      LAST_UPDATED: string;
    };
  }
}

// Fonction pour récupérer la configuration depuis le fichier centralisé
const getGoogleMapsApiKey = (): string => {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return window.APP_CONFIG.GOOGLE_MAPS_API_KEY;
  }
  
  return 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';
};

export const GOOGLE_MAPS_CONFIG = {
  apiKey: getGoogleMapsApiKey(),
  libraries: ['places', 'geometry', 'directions'] as const,
  region: 'FR',
  language: 'fr'
};

// Fonction pour charger le script Google Maps avec les services de directions
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const apiKey = getGoogleMapsApiKey();
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&region=${GOOGLE_MAPS_CONFIG.region}&language=${GOOGLE_MAPS_CONFIG.language}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded with Directions API');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

// Fonction pour calculer la distance entre deux codes postaux avec Google Directions API
export const calculateDistanceByPostalCode = async (
  departurePostalCode: string,
  arrivalPostalCode: string,
  departureCity?: string,
  arrivalCity?: string
): Promise<{ distance: number; duration: number } | null> => {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded');
      resolve(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    // Construire les adresses avec code postal et ville si disponible
    const origin = departureCity ? `${departurePostalCode} ${departureCity}, France` : `${departurePostalCode}, France`;
    const destination = arrivalCity ? `${arrivalPostalCode} ${arrivalCity}, France` : `${arrivalPostalCode}, France`;
    
    console.log(`Calcul distance Google Maps: ${origin} -> ${destination}`);
    
    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      region: 'FR',
      language: 'fr'
    }, (result, status) => {
      if (status === 'OK' && result?.routes[0]) {
        const leg = result.routes[0].legs[0];
        const distanceKm = Math.round(leg.distance!.value / 1000);
        const durationMin = Math.round(leg.duration!.value / 60);
        
        console.log(`Distance calculée Google Maps: ${distanceKm}km, Durée: ${durationMin}min`);
        console.log(`Trajet: ${origin} -> ${destination}`);
        
        resolve({
          distance: distanceKm,
          duration: durationMin
        });
      } else {
        console.warn('Erreur calcul distance Google Maps:', status);
        resolve(null);
      }
    });
  });
};

// Fonction utilitaire pour calculer la distance entre deux points avec Google Directions API (compatibilité)
export const calculateGoogleMapsDistance = async (
  origin: string,
  destination: string
): Promise<{ distance: number; duration: number } | null> => {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded');
      resolve(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      region: 'FR',
      language: 'fr'
    }, (result, status) => {
      if (status === 'OK' && result?.routes[0]) {
        const leg = result.routes[0].legs[0];
        const distanceKm = Math.round(leg.distance!.value / 1000);
        const durationMin = Math.round(leg.duration!.value / 60);
        
        console.log(`Distance calculée Google Maps: ${distanceKm}km, Durée: ${durationMin}min`);
        console.log(`Trajet: ${origin} -> ${destination}`);
        
        resolve({
          distance: distanceKm,
          duration: durationMin
        });
      } else {
        console.warn('Erreur calcul distance Google Maps:', status);
        resolve(null);
      }
    });
  });
};
