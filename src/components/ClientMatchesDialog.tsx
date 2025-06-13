
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMatchActions } from '@/hooks/useMatchActions';

interface Client {
  id: number;
  name: string;
  client_reference?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number;
  status?: string;
  departure_city?: string;
  arrival_city?: string;
}

interface ClientMatchesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export const ClientMatchesDialog = ({ isOpen, onClose, client }: ClientMatchesDialogProps) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('🔍 ClientMatchesDialog - Props:', { isOpen, clientId: client?.id, clientName: client?.name });

  const findMatches = async () => {
    if (!client) {
      console.log('❌ Pas de client sélectionné');
      return;
    }

    console.log('🚀 Début recherche de matchs pour client:', client.client_reference);
    setLoading(true);
    
    try {
      // Ici on pourrait implémenter la logique de recherche de matchs
      // Pour l'instant, on simule juste l'ouverture
      
      toast({
        title: "Recherche de matchs",
        description: `Recherche de matchs pour ${client.name} en cours...`,
      });

      // Simuler un délai de recherche
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMatches([]);
      
      toast({
        title: "Recherche terminée",
        description: `Aucun match trouvé pour ${client.name} pour le moment`,
      });

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de matchs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && client) {
      console.log('✅ Dialogue ouvert pour client:', client.client_reference);
      findMatches();
    }
  }, [isOpen, client]);

  if (!client) {
    console.log('❌ ClientMatchesDialog: Pas de client');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Recherche de matchs pour {client.name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {client.client_reference} • {client.departure_postal_code} → {client.arrival_postal_code}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span>Recherche de matchs en cours...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun match trouvé</h3>
                  <p className="text-gray-500 mb-4">
                    Aucun trajet compatible trouvé pour ce client pour le moment.
                  </p>
                  <Button onClick={findMatches} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Relancer la recherche
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {matches.map((match, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{match.company_name}</h4>
                            <p className="text-sm text-gray-600">
                              {match.departure_postal_code} → {match.arrival_postal_code}
                            </p>
                          </div>
                          <Badge variant="outline">Compatible</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
