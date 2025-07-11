
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

// Fonction pour nettoyer et formater un code postal français
const cleanPostalCode = (postalCode: string): string => {
  // Nettoyer le code postal : enlever espaces, tirets et caractères non numériques
  const cleaned = postalCode.replace(/[^\d]/g, '');
  
  // Vérifier que c'est un code postal français valide (5 chiffres)
  if (cleaned.length === 5 && /^\d{5}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Si le code postal n'est pas valide, retourner tel quel mais nettoyé
  return cleaned || postalCode.trim();
};

// Fonction pour calculer la distance entre deux codes postaux avec Google Distance Matrix API
export const calculateDistanceByPostalCode = async (
  departurePostalCode: string,
  arrivalPostalCode: string,
  departureCity?: string,
  arrivalCity?: string
): Promise<{ distance: number; duration: number; distanceText: string } | null> => {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded');
      resolve(null);
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    
    // Nettoyer et formater les codes postaux
    const cleanDeparturePostal = cleanPostalCode(departurePostalCode);
    const cleanArrivalPostal = cleanPostalCode(arrivalPostalCode);
    
    // Construire les adresses avec code postal nettoyé et ville si disponible
    const origin = departureCity ? `${cleanDeparturePostal} ${departureCity}, France` : `${cleanDeparturePostal}, France`;
    const destination = arrivalCity ? `${cleanArrivalPostal} ${arrivalCity}, France` : `${cleanArrivalPostal}, France`;
    
    console.log(`🔍 Calcul distance Google Maps Distance Matrix: ${origin} -> ${destination}`);
    
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      console.log(`📊 Réponse Google Maps API - Status: ${status}`);
      console.log(`📊 Réponse Google Maps API - Response:`, response);
      
      if (status === 'OK' && response?.rows[0]?.elements[0]) {
        const element = response.rows[0].elements[0];
        
        console.log(`📊 Element status: ${element.status}`);
        console.log(`📊 Element data:`, element);
        
        if (element.status === 'OK') {
          const distanceKm = Math.round(element.distance!.value / 1000);
          const durationMin = Math.round(element.duration!.value / 60);
          const distanceText = element.distance!.text;
          const durationText = element.duration!.text;
          
          console.log(`✅ Distance calculée Google Maps Distance Matrix:`);
          console.log(`   - Distance: ${distanceKm}km (${distanceText})`);
          console.log(`   - Durée: ${durationMin}min (${durationText})`);
          console.log(`   - Trajet: ${origin} -> ${destination}`);
          console.log(`   - Valeur brute distance: ${element.distance!.value} mètres`);
          console.log(`   - Valeur brute durée: ${element.duration!.value} secondes`);
          
          // Vérifier la cohérence des données
          const expectedDurationFromText = durationText.toLowerCase().includes('heure') ? 
            (parseInt(durationText.split(' ')[0]) * 60) + (parseInt(durationText.split(' ')[2]) || 0) : 
            parseInt(durationText);
          
          if (Math.abs(durationMin - expectedDurationFromText) > 10) {
            console.warn(`⚠️ Incohérence durée détectée: calculée=${durationMin}min, texte=${durationText}`);
          }
          
          resolve({
            distance: distanceKm,
            duration: durationMin,
            distanceText: distanceText
          });
        } else {
          console.warn(`❌ Erreur élément Distance Matrix: ${element.status}`);
          console.warn(`❌ Element complet:`, element);
          resolve(null);
        }
      } else {
        console.warn(`❌ Erreur calcul distance Google Maps Distance Matrix - Status: ${status}`);
        console.warn(`❌ Response complète:`, response);
        resolve(null);
      }
    });
  });
};

// Fonction utilitaire pour calculer la distance entre deux points avec Google Distance Matrix API (compatibilité)
export const calculateGoogleMapsDistance = async (
  origin: string,
  destination: string
): Promise<{ distance: number; duration: number; distanceText: string } | null> => {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded');
      resolve(null);
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK' && response?.rows[0]?.elements[0]) {
        const element = response.rows[0].elements[0];
        
        if (element.status === 'OK') {
          const distanceKm = Math.round(element.distance!.value / 1000);
          const durationMin = Math.round(element.duration!.value / 60);
          const distanceText = element.distance!.text;
          
          console.log(`Distance calculée Google Maps Distance Matrix: ${distanceKm}km (${distanceText}), Durée: ${durationMin}min`);
          console.log(`Trajet: ${origin} -> ${destination}`);
          
          resolve({
            distance: distanceKm,
            duration: durationMin,
            distanceText: distanceText
          });
        } else {
          console.warn('Erreur élément Distance Matrix:', element.status);
          resolve(null);
        }
      } else {
        console.warn('Erreur calcul distance Google Maps Distance Matrix:', status);
        resolve(null);
      }
    });
  });
};
