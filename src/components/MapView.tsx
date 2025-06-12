
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapFilterDialog, MapFilters } from './MapFilterDialog';

const MapView = () => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({
    type: 'all',
    reference: '',
    name: '',
    date: ''
  });

  const handleApplyFilters = (filters: MapFilters) => {
    setCurrentFilters(filters);
    // TODO: Appliquer les filtres sur la carte
    console.log('Filtres appliqués:', filters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Map className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Carte</h2>
        </div>
        <Button onClick={() => setShowFilterDialog(true)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Placeholder pour la carte - à remplacer par une vraie carte plus tard */}
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Carte interactive</p>
          <p className="text-sm text-gray-400 mt-1">
            Filtres actifs: {currentFilters.type !== 'all' ? currentFilters.type : 'Tous'}
            {currentFilters.reference && `, Réf: ${currentFilters.reference}`}
            {currentFilters.name && `, Nom: ${currentFilters.name}`}
            {currentFilters.date && `, Date: ${currentFilters.date}`}
          </p>
        </div>
      </div>

      <MapFilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
      />
    </motion.div>
  );
};

export default MapView;
