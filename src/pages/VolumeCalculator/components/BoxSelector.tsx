import { useState } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface BoxSelectorProps {
  onAddBoxes: (quantity: number, packingCount: number, unpackingCount: number) => void;
  selectedBoxes: {
    quantity: number;
    packingCount: number;
    unpackingCount: number;
  };
}

export const BoxSelector = ({ onAddBoxes, selectedBoxes }: BoxSelectorProps) => {
  const [quantity, setQuantity] = useState(selectedBoxes.quantity || 0);
  const [packingCount, setPackingCount] = useState(selectedBoxes.packingCount || 0);
  const [unpackingCount, setUnpackingCount] = useState(selectedBoxes.unpackingCount || 0);

  const handleAddBoxes = () => {
    if (quantity > 0) {
      onAddBoxes(quantity, packingCount, unpackingCount);
    }
  };

  const increment = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onAddBoxes(newQuantity, packingCount, unpackingCount);
  };

  const decrement = () => {
    const newQuantity = Math.max(0, quantity - 1);
    setQuantity(newQuantity);
    onAddBoxes(newQuantity, packingCount, unpackingCount);
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(0, value);
    setQuantity(newQuantity);
    
    // Ajuster les compteurs si nécessaire
    const adjustedPacking = Math.min(packingCount, newQuantity);
    const adjustedUnpacking = Math.min(unpackingCount, newQuantity);
    setPackingCount(adjustedPacking);
    setUnpackingCount(adjustedUnpacking);
    
    onAddBoxes(newQuantity, adjustedPacking, adjustedUnpacking);
  };

  const handlePackingCountChange = (value: number) => {
    const newPacking = Math.max(0, Math.min(value, quantity));
    setPackingCount(newPacking);
    onAddBoxes(quantity, newPacking, unpackingCount);
  };

  const handleUnpackingCountChange = (value: number) => {
    const newUnpacking = Math.max(0, Math.min(value, quantity));
    setUnpackingCount(newUnpacking);
    onAddBoxes(quantity, packingCount, newUnpacking);
  };

  return (
    <Card className={`transition-all ${quantity > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          📦 Cartons de déménagement
          {quantity > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {quantity} cartons
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection de la quantité */}
        <div className="space-y-2">
          <Label htmlFor="box-quantity">Nombre de cartons</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={decrement}
              disabled={quantity <= 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Input
              id="box-quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-16 h-8 text-center text-sm"
              min="0"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={increment}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            <span className="text-sm text-gray-600 ml-2">
              Volume total: {(quantity * 0.125).toFixed(3)} m³
            </span>
          </div>
        </div>

        {/* Options d'emballage/déballage */}
        {quantity > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packing-count" className="text-sm font-medium text-green-700">
                  Cartons à emballer
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="packing-count"
                    type="number"
                    value={packingCount}
                    onChange={(e) => handlePackingCountChange(parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center text-sm"
                    min="0"
                    max={quantity}
                  />
                  <span className="text-xs text-gray-500">/ {quantity}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unpacking-count" className="text-sm font-medium text-blue-700">
                  Cartons à déballer
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="unpacking-count"
                    type="number"
                    value={unpackingCount}
                    onChange={(e) => handleUnpackingCountChange(parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center text-sm"
                    min="0"
                    max={quantity}
                  />
                  <span className="text-xs text-gray-500">/ {quantity}</span>
                </div>
              </div>
            </div>
            
            {/* Résumé des services */}
            {(packingCount > 0 || unpackingCount > 0) && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div className="flex justify-between">
                  <span>Services demandés:</span>
                  <span>
                    {packingCount > 0 && `${packingCount} emballage${packingCount > 1 ? 's' : ''}`}
                    {packingCount > 0 && unpackingCount > 0 && ' • '}
                    {unpackingCount > 0 && `${unpackingCount} déballage${unpackingCount > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};