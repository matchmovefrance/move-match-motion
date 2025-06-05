
// Configuration pour Google Maps API
export const GOOGLE_MAPS_CONFIG = {
  // Utiliser la clé API Google Maps valide
  apiKey: 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y',
  libraries: ['places', 'geometry'] as const,
  region: 'FR',
  language: 'fr'
};

// Fonction pour charger le script Google Maps de manière asynchrone
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Vérifier s'il y a déjà un script en cours de chargement
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Attendre que le script existant se charge
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

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&region=${GOOGLE_MAPS_CONFIG.region}&language=${GOOGLE_MAPS_CONFIG.language}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};
