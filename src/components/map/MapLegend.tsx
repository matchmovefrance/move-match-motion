
import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span>Départ déménageur</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span>Arrivée déménageur</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-0.5 bg-blue-500"></div>
        <span>Route déménageur</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span>Départ client</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <span>Arrivée client</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-0.5 bg-orange-500"></div>
        <span>Route client</span>
      </div>
    </div>
  );
};
