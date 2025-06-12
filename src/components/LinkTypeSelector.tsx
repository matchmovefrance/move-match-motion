
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Plus } from 'lucide-react';

interface LinkTypeSelectorProps {
  onTypeSelect: (type: 'client' | 'mover') => void;
  onCancel: () => void;
}

const LinkTypeSelector = ({ onTypeSelect, onCancel }: LinkTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Créer un lien public</h2>
        <p className="text-gray-600">Choisissez le type de formulaire à partager</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-gray-800">Lien CLIENT</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Permet aux clients de saisir leurs demandes de déménagement
            </p>
            <Button
              onClick={() => onTypeSelect('client')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer lien CLIENT
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-300">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <Truck className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-xl text-gray-800">Lien DÉMÉNAGEUR</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Permet aux déménageurs de saisir leurs trajets disponibles
            </p>
            <Button
              onClick={() => onTypeSelect('mover')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer lien DÉMÉNAGEUR
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default LinkTypeSelector;
