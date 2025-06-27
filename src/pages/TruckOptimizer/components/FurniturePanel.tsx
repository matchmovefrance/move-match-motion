
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Minus, X, Search } from 'lucide-react';
import { useState } from 'react';
import { FurnitureItem } from '../types';

interface FurniturePanelProps {
  selectedFurniture: FurnitureItem[];
  onFurnitureAdd: (item: FurnitureItem) => void;
  onFurnitureRemove: (id: string) => void;
}

const furnitureCategories = {
  'Salon': [
    {
      id: 'sofa-2p',
      name: 'Canapé 2 places',
      category: 'Salon',
      dimensions: { length: 1.6, width: 0.8, height: 0.8 },
      volume: 1.024,
      weight: 45,
      fragile: false,
      color: '#8B5CF6'
    },
    {
      id: 'sofa-3p',
      name: 'Canapé 3 places',
      category: 'Salon',
      dimensions: { length: 2.2, width: 0.9, height: 0.8 },
      volume: 1.584,
      weight: 65,
      fragile: false,
      color: '#8B5CF6'
    },
    {
      id: 'armchair',
      name: 'Fauteuil',
      category: 'Salon',
      dimensions: { length: 0.9, width: 0.8, height: 0.9 },
      volume: 0.648,
      weight: 25,
      fragile: false,
      color: '#A855F7'
    },
    {
      id: 'coffee-table',
      name: 'Table basse',
      category: 'Salon',
      dimensions: { length: 1.2, width: 0.6, height: 0.4 },
      volume: 0.288,
      weight: 15,
      fragile: true,
      color: '#C084FC'
    },
    {
      id: 'tv-stand',
      name: 'Meuble TV',
      category: 'Salon',
      dimensions: { length: 1.5, width: 0.4, height: 0.6 },
      volume: 0.36,
      weight: 30,
      fragile: false,
      color: '#DDD6FE'
    }
  ],
  'Chambre': [
    {
      id: 'bed-140',
      name: 'Lit 140x200',
      category: 'Chambre',
      dimensions: { length: 2.1, width: 1.5, height: 0.9 },
      volume: 2.835,
      weight: 60,
      fragile: false,
      color: '#10B981'
    },
    {
      id: 'bed-160',
      name: 'Lit 160x200',
      category: 'Chambre',
      dimensions: { length: 2.1, width: 1.7, height: 0.9 },
      volume: 3.213,
      weight: 70,
      fragile: false,
      color: '#059669'
    },
    {
      id: 'wardrobe-2p',
      name: 'Armoire 2 portes',
      category: 'Chambre',
      dimensions: { length: 1.2, width: 0.6, height: 2.0 },
      volume: 1.44,
      weight: 80,
      fragile: false,
      color: '#06B6D4'
    },
    {
      id: 'wardrobe-3p',
      name: 'Armoire 3 portes',
      category: 'Chambre',
      dimensions: { length: 1.8, width: 0.6, height: 2.0 },
      volume: 2.16,
      weight: 120,
      fragile: false,
      color: '#0891B2'
    },
    {
      id: 'dresser',
      name: 'Commode',
      category: 'Chambre',
      dimensions: { length: 1.0, width: 0.5, height: 0.8 },
      volume: 0.4,
      weight: 35,
      fragile: false,
      color: '#0E7490'
    },
    {
      id: 'nightstand',
      name: 'Table de chevet',
      category: 'Chambre',
      dimensions: { length: 0.5, width: 0.4, height: 0.6 },
      volume: 0.12,
      weight: 12,
      fragile: false,
      color: '#155E75'
    },
    {
      id: 'mattress-140',
      name: 'Matelas 140x200',
      category: 'Chambre',
      dimensions: { length: 2.0, width: 1.4, height: 0.25 },
      volume: 0.7,
      weight: 22,
      fragile: false,
      color: '#34D399'
    },
    {
      id: 'mattress-160',
      name: 'Matelas 160x200',
      category: 'Chambre',
      dimensions: { length: 2.0, width: 1.6, height: 0.25 },
      volume: 0.8,
      weight: 25,
      fragile: false,
      color: '#10B981'
    }
  ],
  'Cuisine': [
    {
      id: 'fridge',
      name: 'Réfrigérateur',
      category: 'Cuisine',
      dimensions: { length: 0.6, width: 0.65, height: 1.8 },
      volume: 0.702,
      weight: 120,
      fragile: true,
      color: '#EF4444'
    },
    {
      id: 'washing-machine',
      name: 'Lave-linge',
      category: 'Cuisine',
      dimensions: { length: 0.6, width: 0.6, height: 0.85 },
      volume: 0.306,
      weight: 70,
      fragile: true,
      color: '#DC2626'
    },
    {
      id: 'dishwasher',
      name: 'Lave-vaisselle',
      category: 'Cuisine',
      dimensions: { length: 0.6, width: 0.6, height: 0.82 },
      volume: 0.295,
      weight: 50,
      fragile: true,
      color: '#B91C1C'
    },
    {
      id: 'microwave',
      name: 'Micro-ondes',
      category: 'Cuisine',
      dimensions: { length: 0.5, width: 0.4, height: 0.3 },
      volume: 0.06,
      weight: 15,
      fragile: true,
      color: '#F87171'
    }
  ],
  'Salle à manger': [
    {
      id: 'dining-table-4p',
      name: 'Table 4 personnes',
      category: 'Salle à manger',
      dimensions: { length: 1.2, width: 0.8, height: 0.75 },
      volume: 0.72,
      weight: 35,
      fragile: true,
      color: '#F59E0B'
    },
    {
      id: 'dining-table-6p',
      name: 'Table 6 personnes',
      category: 'Salle à manger',
      dimensions: { length: 1.6, width: 0.9, height: 0.75 },
      volume: 1.08,
      weight: 50,
      fragile: true,
      color: '#D97706'
    },
    {
      id: 'dining-chair',
      name: 'Chaise',
      category: 'Salle à manger',
      dimensions: { length: 0.45, width: 0.45, height: 0.9 },
      volume: 0.182,
      weight: 5,
      fragile: false,
      color: '#FBBF24'
    },
    {
      id: 'buffet',
      name: 'Buffet',
      category: 'Salle à manger',
      dimensions: { length: 1.6, width: 0.5, height: 0.9 },
      volume: 0.72,
      weight: 45,
      fragile: false,
      color: '#92400E'
    }
  ],
  'Bureau': [
    {
      id: 'desk',
      name: 'Bureau',
      category: 'Bureau',
      dimensions: { length: 1.4, width: 0.7, height: 0.75 },
      volume: 0.735,
      weight: 25,
      fragile: false,
      color: '#6366F1'
    },
    {
      id: 'office-chair',
      name: 'Chaise de bureau',
      category: 'Bureau',
      dimensions: { length: 0.6, width: 0.6, height: 1.2 },
      volume: 0.432,
      weight: 15,
      fragile: false,
      color: '#4F46E5'
    },
    {
      id: 'bookshelf',
      name: 'Bibliothèque',
      category: 'Bureau',
      dimensions: { length: 0.8, width: 0.3, height: 1.8 },
      volume: 0.432,
      weight: 40,
      fragile: false,
      color: '#4338CA'
    }
  ],
  'Divers': [
    {
      id: 'boxes-small',
      name: 'Cartons petits',
      category: 'Divers',
      dimensions: { length: 0.4, width: 0.3, height: 0.3 },
      volume: 0.036,
      weight: 5,
      fragile: false,
      color: '#78716C'
    },
    {
      id: 'boxes-medium',
      name: 'Cartons moyens',
      category: 'Divers',
      dimensions: { length: 0.5, width: 0.4, height: 0.4 },
      volume: 0.08,
      weight: 8,
      fragile: false,
      color: '#57534E'
    },
    {
      id: 'boxes-large',
      name: 'Cartons grands',
      category: 'Divers',
      dimensions: { length: 0.6, width: 0.5, height: 0.5 },
      volume: 0.15,
      weight: 12,
      fragile: false,
      color: '#44403C'
    }
  ]
};

interface FurnitureWithQuantity extends FurnitureItem {
  quantity: number;
}

const FurniturePanel = ({ selectedFurniture, onFurnitureAdd, onFurnitureRemove }: FurniturePanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [furnitureQuantities, setFurnitureQuantities] = useState<Record<string, FurnitureWithQuantity>>({});

  const allFurniture = Object.values(furnitureCategories).flat();
  
  const filteredFurniture = allFurniture.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addFurnitureWithQuantity = (furniture: FurnitureItem, quantity: number = 1) => {
    for (let i = 0; i < quantity; i++) {
      const uniqueItem = {
        ...furniture,
        id: `${furniture.id}-${Date.now()}-${i}`
      };
      onFurnitureAdd(uniqueItem);
    }
  };

  const updateQuantity = (furnitureId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const { [furnitureId]: removed, ...rest } = furnitureQuantities;
      setFurnitureQuantities(rest);
    } else {
      setFurnitureQuantities(prev => ({
        ...prev,
        [furnitureId]: {
          ...allFurniture.find(f => f.id === furnitureId)!,
          quantity: newQuantity
        }
      }));
    }
  };

  const getSelectedQuantity = (id: string) => {
    return selectedFurniture.filter(item => item.id.startsWith(id)).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventaire Professionnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher un meuble..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {Object.keys(furnitureCategories).map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Furniture */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700">Catalogue ({filteredFurniture.length})</h4>
          {filteredFurniture.map((item) => {
            const selectedQty = getSelectedQuantity(item.id);
            return (
              <div
                key={item.id}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <p className="text-xs text-gray-600">
                      {item.volume.toFixed(2)}m³ - {item.weight}kg
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedQty > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedQty}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFurnitureWithQuantity(item, 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      {selectedQty > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const itemToRemove = selectedFurniture.find(f => f.id.startsWith(item.id));
                            if (itemToRemove) onFurnitureRemove(itemToRemove.id);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  {item.fragile && (
                    <Badge variant="destructive" className="text-xs">
                      Fragile
                    </Badge>
                  )}
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {selectedFurniture.length > 0 && (
          <>
            <Separator />
            
            {/* Selected Furniture Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Sélection ({selectedFurniture.length} objets)
              </h4>
              
              {/* Group by base furniture type */}
              {Object.entries(
                selectedFurniture.reduce((acc, item) => {
                  const baseId = item.id.split('-').slice(0, -2).join('-') || item.id;
                  const baseFurniture = allFurniture.find(f => f.id === baseId);
                  if (baseFurniture) {
                    acc[baseId] = (acc[baseId] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)
              ).map(([baseId, count]) => {
                const baseFurniture = allFurniture.find(f => f.id === baseId);
                if (!baseFurniture) return null;
                
                return (
                  <div
                    key={baseId}
                    className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{baseFurniture.name}</span>
                        <p className="text-xs text-gray-600">
                          {count} × {baseFurniture.volume.toFixed(2)}m³ = {(count * baseFurniture.volume).toFixed(2)}m³
                        </p>
                      </div>
                      <Badge variant="secondary">×{count}</Badge>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-2 border-t text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <p><strong>Volume total:</strong> {selectedFurniture.reduce((sum, item) => sum + item.volume, 0).toFixed(2)}m³</p>
                <p><strong>Poids total:</strong> {selectedFurniture.reduce((sum, item) => sum + item.weight, 0)}kg</p>
                <p><strong>Objets fragiles:</strong> {selectedFurniture.filter(item => item.fragile).length}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FurniturePanel;
