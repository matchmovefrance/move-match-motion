
export interface FurnitureItem {
  id: string;
  name: string;
  volume: number; // in m³
  icon: string;
  category: string;
  description?: string;
}

export interface SelectedItem extends FurnitureItem {
  quantity: number;
}

export interface FurnitureCategory {
  id: string;
  name: string;
  icon: string;
  items: FurnitureItem[];
}
