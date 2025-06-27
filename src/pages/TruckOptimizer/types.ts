
export interface TruckModel {
  id: string;
  name: string;
  type: 'van' | 'truck' | 'trailer';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  volume: number;
  maxWeight: number;
  hasRamp: boolean;
  color: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  volume: number;
  weight: number;
  fragile: boolean;
  color: string;
}

export interface PlacedItem {
  id: string;
  furnitureId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface OptimizationResult {
  placements: PlacedItem[];
  efficiency: number;
  warnings: string[];
}
