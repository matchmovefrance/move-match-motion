
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Calendar, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const ProfessionalMatches = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-green-600" />
          <h3 className="text-2xl font-bold text-gray-800">Matching Professionnel</h3>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          Rechercher
        </Button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800 mb-2">
          <Truck className="h-5 w-5" />
          <span className="font-semibold">Optimisation Déménageur-Déménageur</span>
        </div>
        <div className="text-sm text-green-700">
          • <strong>Mutualisation</strong> : partage de camions entre déménageurs<br/>
          • <strong>Trajets retour</strong> : optimisation des retours à vide<br/>
          • <strong>Économies</strong> : réduction des coûts opérationnels
        </div>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Fonctionnalité en cours de développement
          </h3>
          <p className="text-gray-500">
            Le matching déménageur-déménageur sera disponible prochainement
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
