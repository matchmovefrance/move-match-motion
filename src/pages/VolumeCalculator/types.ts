
export interface FurnitureItem {
  id: string;
  name: string;
  volume: number;
  description: string;
  icon: string;
  category: string;
  dimensions?: {
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  };
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
  disassemblyOptions?: boolean[]; // Pour chaque quantité, true si démontage/remontage
  packingOptions?: boolean[]; // Pour chaque quantité, true si emballage (pour cartons)
  unpackingOptions?: boolean[]; // Pour chaque quantité, true si déballage (pour cartons)
}
