
import { useState } from 'react';
import { Plus, Minus, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FurnitureItem, SelectedItem } from '../types';
import { furnitureCategories } from '../data/furnitureData';
import ManualFurnitureDialog from './ManualFurnitureDialog';

interface FurnitureSelectorProps {
  onAddItem: (item: FurnitureItem, quantity: number) => void;
  selectedItems: SelectedItem[];
}

const FurnitureSelector = ({ onAddItem, selectedItems }: FurnitureSelectorProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualFurniture, setManualFurniture] = useState<FurnitureItem[]>([]);

  const getSelectedQuantity = (itemId: string) => {
    const selectedItem = selectedItems.find(item => item.id === itemId);
    return selectedItem?.quantity || quantities[itemId] || 0;
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    
    // Find item in categories or manual furniture
    let item = furnitureCategories
      .flatMap(cat => cat.subcategories)
      .flatMap(subcat => subcat.items)
      .find(item => item.id === itemId);
    
    if (!item) {
      item = manualFurniture.find(item => item.id === itemId);
    }
    
    if (item) {
      onAddItem(item, newQuantity);
    }
  };

  const handleAddManualFurniture = (furniture: FurnitureItem, quantity: number) => {
    setManualFurniture(prev => [...prev, furniture]);
    onAddItem(furniture, quantity);
  };

  const increment = (itemId: string) => {
    const currentQuantity = getSelectedQuantity(itemId);
    handleQuantityChange(itemId, currentQuantity + 1);
  };

  const decrement = (itemId: string) => {
    const currentQuantity = getSelectedQuantity(itemId);
    handleQuantityChange(itemId, Math.max(0, currentQuantity - 1));
  };

  const renderFurnitureItem = (item: FurnitureItem) => {
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
  };

  return (
    <div className="space-y-4">
      {/* Bouton pour ajouter des meubles manuellement */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowManualDialog(true)}
          variant="outline"
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un meuble personnalisé
        </Button>
      </div>

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
            <Accordion type="multiple" defaultValue={category.subcategories.map(sub => sub.id)}>
              {category.subcategories.map((subcategory) => (
                <AccordionItem key={subcategory.id} value={subcategory.id}>
                  <AccordionTrigger className="text-left font-medium">
                    {subcategory.name} ({subcategory.items.length} objets)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {subcategory.items.map(renderFurnitureItem)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>

      {/* Section pour les meubles manuels */}
      {manualFurniture.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-800 mb-3">Meubles personnalisés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manualFurniture.map(renderFurnitureItem)}
          </div>
        </div>
      )}

      <ManualFurnitureDialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
        onAddFurniture={handleAddManualFurniture}
      />
    </div>
  );
};

export default FurnitureSelector;
