
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FurnitureItem, SelectedItem } from '../types';
import { furnitureCategories } from '../data/furnitureData';

interface FurnitureSelectorProps {
  onAddItem: (item: FurnitureItem, quantity: number) => void;
  selectedItems: SelectedItem[];
}

const FurnitureSelector = ({ onAddItem, selectedItems }: FurnitureSelectorProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getSelectedQuantity = (itemId: string) => {
    const selectedItem = selectedItems.find(item => item.id === itemId);
    return selectedItem?.quantity || quantities[itemId] || 0;
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    
    const item = furnitureCategories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    
    if (item) {
      onAddItem(item, newQuantity);
    }
  };

  const increment = (itemId: string) => {
    const currentQuantity = getSelectedQuantity(itemId);
    handleQuantityChange(itemId, currentQuantity + 1);
  };

  const decrement = (itemId: string) => {
    const currentQuantity = getSelectedQuantity(itemId);
    handleQuantityChange(itemId, Math.max(0, currentQuantity - 1));
  };

  return (
    <Tabs defaultValue={furnitureCategories[0]?.id} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto gap-1 p-1">
        {furnitureCategories.map((category) => (
          <TabsTrigger 
            key={category.id} 
            value={category.id}
            className="flex items-center gap-2 p-2 text-xs"
          >
            <span className="text-lg">{category.icon}</span>
            <span className="hidden sm:inline">{category.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {furnitureCategories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map((item) => {
              const quantity = getSelectedQuantity(item.id);
              const isSelected = quantity > 0;

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{item.icon}</span>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            {quantity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                      <p className="text-sm font-medium text-blue-600">
                        {item.volume} m³ {quantity > 1 && `(${(item.volume * quantity).toFixed(2)} m³ total)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => decrement(item.id)}
                      disabled={quantity <= 0}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center text-sm"
                      min="0"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => increment(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default FurnitureSelector;
