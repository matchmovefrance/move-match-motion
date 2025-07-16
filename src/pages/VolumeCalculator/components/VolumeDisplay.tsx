
import { Trash2, Package, Edit3, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectedItem } from '../types';

interface VolumeDisplayProps {
  totalVolume: number;
  selectedItems: SelectedItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  distance?: number | null;
  distanceText?: string | null;
  isCalculatingDistance?: boolean;
  distanceError?: string | null;
  departurePostalCode?: string;
  arrivalPostalCode?: string;
  safetyMargin10: boolean;
  safetyMargin15: boolean;
  onSafetyMargin10Change: (checked: boolean) => void;
  onSafetyMargin15Change: (checked: boolean) => void;
}

const VolumeDisplay = ({ 
  totalVolume, 
  selectedItems, 
  onUpdateQuantity, 
  onRemoveItem,
  distance,
  distanceText,
  isCalculatingDistance,
  distanceError,
  departurePostalCode,
  arrivalPostalCode,
  safetyMargin10,
  safetyMargin15,
  onSafetyMargin10Change,
  onSafetyMargin15Change
}: VolumeDisplayProps) => {
  const getVolumeCategory = (volume: number) => {
    if (volume < 10) return { text: "Petit déménagement", color: "bg-green-500", description: "Camionnette ou petit camion" };
    if (volume < 25) return { text: "Déménagement moyen", color: "bg-yellow-500", description: "Camion 12-20m³" };
    if (volume < 50) return { text: "Grand déménagement", color: "bg-orange-500", description: "Camion 30-40m³" };
    return { text: "Très grand déménagement", color: "bg-red-500", description: "Camion + remorque ou plusieurs camions" };
  };

  const volumeCategory = getVolumeCategory(totalVolume);
  
  // Calcul du volume avec marge de sécurité
  let volumeWithMargin = totalVolume;
  if (safetyMargin10) volumeWithMargin += totalVolume * 0.1;
  if (safetyMargin15) volumeWithMargin += totalVolume * 0.15;

  return (
    <div className="space-y-4">
      {/* Volume Total */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Volume Total
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {volumeWithMargin.toFixed(1)}
            <span className="text-2xl ml-1">m³</span>
          </div>
          
          {(safetyMargin10 || safetyMargin15) && (
            <div className="text-sm text-gray-600 mb-2">
              Volume de base: {totalVolume.toFixed(1)} m³
              {safetyMargin10 && <span className="block">+ 10% sécurité: {(totalVolume * 0.1).toFixed(1)} m³</span>}
              {safetyMargin15 && <span className="block">+ 15% sécurité: {(totalVolume * 0.15).toFixed(1)} m³</span>}
            </div>
          )}
          
          <Badge className={`${volumeCategory.color} text-white mb-2`}>
            {volumeCategory.text}
          </Badge>
          
          <p className="text-sm text-gray-600">
            {volumeCategory.description}
          </p>
          
          {/* Cases à cocher pour marges de sécurité */}
          {totalVolume > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Checkbox 
                  id="margin10" 
                  checked={safetyMargin10}
                  onCheckedChange={onSafetyMargin10Change}
                />
                <Label htmlFor="margin10" className="text-sm">
                  Ajouter 10% de marge de sécurité
                </Label>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Checkbox 
                  id="margin15" 
                  checked={safetyMargin15}
                  onCheckedChange={onSafetyMargin15Change}
                />
                <Label htmlFor="margin15" className="text-sm">
                  Ajouter 15% de marge de sécurité
                </Label>
              </div>
            </div>
          )}
          
          {totalVolume === 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Ajoutez des meubles pour voir le volume
            </p>
          )}
        </CardContent>
      </Card>

      {/* Liste des items sélectionnés */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détail du calcul</CardTitle>
            <CardDescription>
              {selectedItems.length} type{selectedItems.length > 1 ? 's' : ''} de meubles sélectionné{selectedItems.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItems.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-600">
                        {item.volume} m³ × {item.quantity} = {(item.volume * item.quantity).toFixed(2)} m³
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center text-sm"
                      min="1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {index < selectedItems.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conseils */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Conseils
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Les volumes incluent l'espace de protection nécessaire</p>
          <p>• Prévoyez 10-15% de volume supplémentaire pour les objets divers</p>
          <p>• Ces estimations sont basées sur les standards des déménageurs</p>
          {totalVolume > 0 && (
            <p className="font-medium text-blue-600">
              • Estimation avec marge de sécurité: {(totalVolume * 1.15).toFixed(1)} m³
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolumeDisplay;
