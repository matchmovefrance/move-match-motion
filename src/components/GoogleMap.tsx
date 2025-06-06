
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';
import { MapPin, Truck, Navigation, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StatusToggle from './StatusToggle';
import { useMapData } from '@/hooks/useMapData';
import { useMapRoutes } from '@/hooks/useMapRoutes';
import { MapLegend } from './map/MapLegend';
import { MapHistory } from './map/MapHistory';

const GoogleMapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInitialized = useRef(false);

  // Use custom hooks for data management
  const { activeMoves, activeClientRequests, allMoves, loading, loadData, refreshData } = useMapData();
  const { addMarkersAndRoutes, clearMapElements } = useMapRoutes(map);

  // Initialize map only once
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInitialized.current) return;

    try {
      await loadGoogleMapsScript();
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 46.603354, lng: 1.888334 },
        zoom: 6,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
          }
        ]
      });

      setMap(mapInstance);
      mapInitialized.current = true;
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      setError('Impossible de charger Google Maps');
    }
  }, []);

  const handleStatusChange = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status: newStatus })
        .eq('id', moveId);

      if (error) throw error;
      refreshData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'termine':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'en_cours':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getMatchStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Non défini</Badge>;
    }
  };

  // Initialize map once
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Load data when map is ready
  useEffect(() => {
    if (map && !loading) {
      loadData();
    }
  }, [map]);

  // Add routes when data is loaded - with debouncing
  useEffect(() => {
    if (map && (activeMoves.length > 0 || activeClientRequests.length > 0)) {
      const timeoutId = setTimeout(() => {
        addMarkersAndRoutes(activeMoves, activeClientRequests);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [map, activeMoves, activeClientRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearMapElements) {
        clearMapElements();
      }
    };
  }, [clearMapElements]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Navigation className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Carte des trajets (routes réelles)</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showHistory ? 'Masquer l\'historique' : 'Afficher l\'historique'}
          </button>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Actualiser
          </button>
          <MapLegend />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '600px' }}
        />
      </div>

      {(activeMoves.length > 0 || activeClientRequests.length > 0) && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {activeMoves.length} trajet{activeMoves.length > 1 ? 's' : ''} déménageur{activeMoves.length > 1 ? 's' : ''} et {activeClientRequests.length} demande{activeClientRequests.length > 1 ? 's' : ''} client{activeClientRequests.length > 1 ? 's' : ''} affichés (limité à 3 chacun pour les performances)
            </span>
          </div>
        </div>
      )}

      {showHistory && (
        <MapHistory 
          moves={allMoves}
          getStatusBadge={getStatusBadge}
          getMatchStatusBadge={getMatchStatusBadge}
          handleStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default GoogleMapComponent;
