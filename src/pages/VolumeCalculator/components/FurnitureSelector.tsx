
import { useState, useEffect } from 'react';
import { Plus, Minus, PlusCircle, Search, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FurnitureItem, SelectedItem } from '../types';
import { furnitureCategories } from '../data/furnitureData';
import ManualFurnitureDialog from './ManualFurnitureDialog';
import { EditVolumeDialog } from './EditVolumeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FurnitureSelectorProps {
  onAddItem: (item: FurnitureItem & { disassemblyOptions?: boolean[]; packingOptions?: boolean[] }, quantity: number) => void;
  selectedItems: SelectedItem[];
  onUpdateItemOptions: (itemId: string, index: number, optionType: 'disassembly' | 'packing', value: boolean) => void;
}

const FurnitureSelector = ({ onAddItem, selectedItems, onUpdateItemOptions }: FurnitureSelectorProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualFurniture, setManualFurniture] = useState<FurnitureItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<FurnitureItem | null>(null);
  const [customVolumes, setCustomVolumes] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Charger les volumes personnalisés depuis la base de données
  useEffect(() => {
    const loadCustomVolumes = async () => {
      try {
        const { data, error } = await supabase
          .from('furniture_volumes')
          .select('furniture_id, custom_volume');
        
        if (error) throw error;
        
        const volumeMap = data.reduce((acc, item) => {
          acc[item.furniture_id] = item.custom_volume;
          return acc;
        }, {} as Record<string, number>);
        
        setCustomVolumes(volumeMap);
      } catch (error) {
        console.error('Error loading custom volumes:', error);
      }
    };

    loadCustomVolumes();
  }, []);

  const getItemVolume = (item: FurnitureItem) => {
    return customVolumes[item.id] || item.volume;
  };

  const handleVolumeUpdated = (itemId: string, newVolume: number) => {
    setCustomVolumes(prev => ({ ...prev, [itemId]: newVolume }));
    
    // Mettre à jour l'item dans les items sélectionnés avec le nouveau volume
    const selectedItem = selectedItems.find(item => item.id === itemId);
    if (selectedItem) {
      const updatedItem = { ...selectedItem, volume: newVolume };
      onAddItem(updatedItem, selectedItem.quantity);
    }
  };

  // Filtrer les meubles en fonction du terme de recherche
  const filterItems = (items: FurnitureItem[]) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
      // Initialize options arrays for new items
      const existingItem = selectedItems.find(selected => selected.id === itemId);
      const disassemblyOptions = existingItem?.disassemblyOptions?.slice(0, newQuantity) || Array(newQuantity).fill(false);
      const packingOptions = existingItem?.packingOptions?.slice(0, newQuantity) || Array(newQuantity).fill(false);
      
      // Pad arrays if quantity increased
      while (disassemblyOptions.length < newQuantity) disassemblyOptions.push(false);
      while (packingOptions.length < newQuantity) packingOptions.push(false);
      
      // Use custom volume if available
      const currentVolume = customVolumes[itemId] || item.volume;
      onAddItem({ ...item, volume: currentVolume, disassemblyOptions, packingOptions }, newQuantity);
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
    const selectedItem = selectedItems.find(selected => selected.id === item.id);
    const isCarton = item.name.toLowerCase().includes('carton');

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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-blue-600">
                {customVolumes[item.id] || item.volume} m³ {quantity > 1 && `(${((customVolumes[item.id] || item.volume) * quantity).toFixed(2)} m³ total)`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(item)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                title="Modifier le volume"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
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

        {/* Options individuelles pour chaque quantité */}
        {isSelected && quantity > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t">
            {Array.from({ length: quantity }, (_, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                <span className="font-medium">#{index + 1}</span>
                <div className="flex gap-3">
                  {!isCarton && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`disassembly-${item.id}-${index}`}
                        checked={selectedItem?.disassemblyOptions?.[index] || false}
                        onCheckedChange={(checked) => onUpdateItemOptions(item.id, index, 'disassembly', checked as boolean)}
                      />
                      <label htmlFor={`disassembly-${item.id}-${index}`} className="text-xs cursor-pointer">
                        Démontage/Remontage
                      </label>
                    </div>
                  )}
                  {isCarton && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`packing-${item.id}-${index}`}
                        checked={selectedItem?.packingOptions?.[index] || false}
                        onCheckedChange={(checked) => onUpdateItemOptions(item.id, index, 'packing', checked as boolean)}
                      />
                      <label htmlFor={`packing-${item.id}-${index}`} className="text-xs cursor-pointer">
                        Emballage/Déballage
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher des meubles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
                       {filterItems(subcategory.items).map(renderFurnitureItem)}
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

      <EditVolumeDialog
        item={editingItem ? {
          id: editingItem.id,
          name: editingItem.name,
          volume: customVolumes[editingItem.id] || editingItem.volume,
          category: editingItem.category
        } : null}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onVolumeUpdated={handleVolumeUpdated}
      />
    </div>
  );
};

export default FurnitureSelector;
