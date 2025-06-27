
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';
import { TruckModel } from '../types';

interface TruckSelectorProps {
  selectedTruck: TruckModel | null;
  onTruckSelect: (truck: TruckModel) => void;
}

const truckModels: TruckModel[] = [
  {
    id: '1',
    name: 'Fourgon 12m³',
    type: 'van',
    dimensions: { length: 3.0, width: 1.8, height: 2.2 },
    volume: 12,
    maxWeight: 1500,
    hasRamp: false,
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'Camion 20m³',
    type: 'truck',
    dimensions: { length: 4.2, width: 2.1, height: 2.3 },
    volume: 20,
    maxWeight: 3500,
    hasRamp: true,
    color: '#EF4444'
  },
  {
    id: '3',
    name: 'Camion 35m³',
    type: 'truck',
    dimensions: { length: 6.2, width: 2.4, height: 2.4 },
    volume: 35,
    maxWeight: 7500,
    hasRamp: true,
    color: '#10B981'
  },
  {
    id: '4',
    name: 'Remorque 60m³',
    type: 'trailer',
    dimensions: { length: 8.5, width: 2.5, height: 2.8 },
    volume: 60,
    maxWeight: 15000,
    hasRamp: true,
    color: '#F59E0B'
  }
];

const TruckSelector = ({ selectedTruck, onTruckSelect }: TruckSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Sélection du Camion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {truckModels.map((truck) => (
          <div
            key={truck.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedTruck?.id === truck.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onTruckSelect(truck)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{truck.name}</h4>
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: truck.color }}
              />
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <p>Volume: {truck.volume}m³</p>
              <p>Dimensions: {truck.dimensions.length}x{truck.dimensions.width}x{truck.dimensions.height}m</p>
              <p>Charge max: {truck.maxWeight}kg</p>
              
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {truck.type}
                </Badge>
                {truck.hasRamp && (
                  <Badge variant="secondary" className="text-xs">
                    Hayon
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TruckSelector;
