import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DimensionsInputProps {
  itemId: string;
  itemName: string;
  currentDimensions?: string;
  onDimensionsChange: (itemId: string, dimensions: string) => void;
}

export const DimensionsInput = ({ 
  itemId, 
  itemName, 
  currentDimensions, 
  onDimensionsChange 
}: DimensionsInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dimensions, setDimensions] = useState(currentDimensions || '');
  const [tempDimensions, setTempDimensions] = useState(currentDimensions || '');

  const handleSave = () => {
    const formatted = formatDimensions(tempDimensions);
    setDimensions(formatted);
    onDimensionsChange(itemId, formatted);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempDimensions(dimensions);
    setIsEditing(false);
  };

  const formatDimensions = (input: string): string => {
    if (!input.trim()) return '';
    
    // Remove any existing × symbols and clean the string
    const cleaned = input.replace(/[×x]/gi, ' ').replace(/\s+/g, ' ').trim();
    const numbers = cleaned.split(' ').filter(part => part && !isNaN(Number(part)));
    
    if (numbers.length === 3) {
      return `${numbers[0]} × ${numbers[1]} × ${numbers[2]}`;
    }
    
    return input; // Return original if not 3 numbers
  };

  const validateDimensions = (input: string): boolean => {
    if (!input.trim()) return true; // Empty is valid
    const formatted = formatDimensions(input);
    const parts = formatted.split(' × ');
    return parts.length === 3 && parts.every(part => !isNaN(Number(part)) && Number(part) > 0);
  };

  const isValid = validateDimensions(tempDimensions);

  if (!isEditing && !dimensions) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600"
        >
          <Edit className="h-3 w-3 mr-1" />
          Dimensions
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Format: Longueur × Profondeur × Hauteur (cm)<br />
                Exemple: 120 × 60 × 75
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-mono">
          {dimensions} cm
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTempDimensions(dimensions);
            setIsEditing(true);
          }}
          className="h-4 w-4 p-0 text-gray-500 hover:text-blue-600"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input
          value={tempDimensions}
          onChange={(e) => setTempDimensions(e.target.value)}
          placeholder="120 60 75 ou 120×60×75"
          className={`h-6 text-xs ${!isValid ? 'border-red-300' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        {!isValid && tempDimensions && (
          <p className="text-xs text-red-500 mt-1">
            Format requis: 3 nombres (ex: 120 60 75)
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={!isValid}
        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
      >
        <X className="h-3 w-3" />
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              ➡️ Longueur × Profondeur × Hauteur (cm)<br />
              120 cm de longueur, 60 cm de profondeur, 75 cm de hauteur
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};