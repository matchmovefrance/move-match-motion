
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, MapPin, Calendar, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const SimpleMatches = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-800">Correspondances Simples</h3>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Rechercher
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Target className="h-5 w-5" />
          <span className="font-semibold">Matching Client-Déménageur</span>
        </div>
        <div className="text-sm text-blue-700">
          • <strong>Correspondances directes</strong> : clients et déménageurs sur trajets similaires<br/>
          • <strong>Volume disponible</strong> : vérification des capacités restantes<br/>
          • <strong>Dates compatibles</strong> : respect des créneaux de flexibilité
        </div>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Fonctionnalité en cours de développement
          </h3>
          <p className="text-gray-500">
            Les correspondances simples client-déménageur seront disponibles prochainement
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
