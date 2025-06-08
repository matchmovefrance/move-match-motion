
// Configuration centralisée pour toutes les API keys et domaines
// Modifiez ce fichier pour mettre à jour tous les projets
window.APP_CONFIG = {
  // Configuration email
  EMAIL_DOMAIN: 'matchmove.tanjaconnect.com',
  NOREPLY_EMAIL: 'noreply@matchmove.tanjaconnect.com',
  
  // Google Maps API
  GOOGLE_MAPS_API_KEY: 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y',
  
  // Supabase (publiques)
  SUPABASE_URL: 'https://kazwfyuwlvkcntphcxsc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthendmeXV3bHZrY250cGhjeHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NjMxODYsImV4cCI6MjA2NDUzOTE4Nn0.ZBrm3aGVY5_ZQYeKVFyfVudrdpLqJAatfnFtrC4O75g',
  
  // Version de la configuration
  CONFIG_VERSION: '1.0.0',
  LAST_UPDATED: '2025-06-08'
};

console.log('Configuration chargée:', window.APP_CONFIG);
