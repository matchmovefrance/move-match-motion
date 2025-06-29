
export interface FurnitureItem {
  id: string;
  name: string;
  volume: number;
  description: string;
  icon: string;
  category: string;
}

export interface FurnitureSubcategory {
  id: string;
  name: string;
  items: FurnitureItem[];
}

export interface FurnitureCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: FurnitureSubcategory[];
}

export interface SelectedItem extends FurnitureItem {
  quantity: number;
}
