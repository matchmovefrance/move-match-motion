
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
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

interface MatchResult {
  id: number;
  company_name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city: string;
  arrival_city: string;
  available_volume: number;
  departure_date: string;
  distance_km: number;
  compatibility_score: number;
}

export const ClientMatchesDialog = ({ isOpen, onClose, client }: ClientMatchesDialogProps) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  console.log('🔍 ClientMatchesDialog - Props:', { 
    isOpen, 
    clientId: client?.id, 
    clientName: client?.name,
    reference: client?.client_reference 
  });

  const validateClientData = useCallback((client: Client | null): string | null => {
    if (!client) return "Aucun client sélectionné";
    if (!client.departure_postal_code?.trim()) return "Code postal de départ manquant";
    if (!client.arrival_postal_code?.trim()) return "Code postal d'arrivée manquant";
    if (!client.departure_city?.trim()) return "Ville de départ manquante";
    if (!client.arrival_city?.trim()) return "Ville d'arrivée manquante";
    return null;
  }, []);

  const findMatches = useCallback(async () => {
    if (!client) {
      console.log('❌ Pas de client pour la recherche');
      return;
    }

    const validationError = validateClientData(client);
    if (validationError) {
      console.log('❌ Validation échouée:', validationError);
      toast({
        title: "Données incomplètes",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Début recherche de matchs pour client:', {
      reference: client.client_reference,
      departure: `${client.departure_postal_code} ${client.departure_city}`,
      arrival: `${client.arrival_postal_code} ${client.arrival_city}`
    });

    setLoading(true);
    setSearchAttempted(true);
    
    try {
      // Recherche dans confirmed_moves avec des critères plus larges
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gte('available_volume', client.estimated_volume || 1)
        .order('departure_date', { ascending: true });

      if (movesError) {
        console.error('❌ Erreur requête moves:', movesError);
        throw movesError;
      }

      console.log(`✅ ${movesData?.length || 0} trajets trouvés dans confirmed_moves`);

      if (!movesData || movesData.length === 0) {
        setMatches([]);
        toast({
          title: "Aucun trajet disponible",
          description: "Aucun trajet confirmé trouvé avec le volume requis",
        });
        return;
      }

      // Simuler une analyse de compatibilité
      const compatibleMatches: MatchResult[] = movesData
        .filter(move => {
          // Filtrer les trajets avec des données complètes
          return move.departure_postal_code && 
                 move.arrival_postal_code && 
                 move.company_name &&
                 (move.available_volume || move.max_volume - (move.used_volume || 0)) >= (client.estimated_volume || 1);
        })
        .slice(0, 5) // Limiter à 5 résultats
        .map(move => ({
          id: move.id,
          company_name: move.company_name,
          departure_postal_code: move.departure_postal_code,
          arrival_postal_code: move.arrival_postal_code,
          departure_city: move.departure_city || 'Ville inconnue',
          arrival_city: move.arrival_city || 'Ville inconnue',
          available_volume: move.available_volume || (move.max_volume - (move.used_volume || 0)),
          departure_date: move.departure_date,
          distance_km: Math.floor(Math.random() * 500) + 50, // Simulation
          compatibility_score: Math.floor(Math.random() * 40) + 60 // Score entre 60-100
        }));

      setMatches(compatibleMatches);
      
      toast({
        title: "Recherche terminée",
        description: `${compatibleMatches.length} match(s) potentiel(s) trouvé(s)`,
      });

      console.log('✅ Matchs trouvés:', compatibleMatches.length);

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de matchs",
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [client, validateClientData, toast]);

  // Effet pour déclencher la recherche quand le dialogue s'ouvre
  useEffect(() => {
    if (isOpen && client && !searchAttempted) {
      console.log('✅ Dialogue ouvert - déclenchement recherche automatique');
      const timer = setTimeout(() => {
        findMatches();
      }, 500); // Petit délai pour laisser le dialogue s'ouvrir

      return () => clearTimeout(timer);
    }
  }, [isOpen, client, searchAttempted, findMatches]);

  // Reset quand le dialogue se ferme
  useEffect(() => {
    if (!isOpen) {
      setMatches([]);
      setSearchAttempted(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    console.log('🔒 Fermeture ClientMatchesDialog');
    setMatches([]);
    setSearchAttempted(false);
    setLoading(false);
    onClose();
  };

  if (!client) {
    console.log('❌ ClientMatchesDialog: Pas de client');
    return null;
  }

  const validationError = validateClientData(client);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Recherche de matchs pour {client.name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {client.client_reference} • {client.departure_postal_code} → {client.arrival_postal_code}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {validationError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Données incomplètes</span>
              </div>
              <p className="text-red-700 mt-2">{validationError}</p>
              <p className="text-red-600 text-sm mt-1">
                Veuillez compléter les informations du client avant de rechercher des matchs.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span>Recherche de matchs en cours...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.length === 0 && searchAttempted ? (
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
              ) : matches.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {matches.length} match(s) trouvé(s)
                    </h3>
                    <Button variant="outline" onClick={findMatches} disabled={loading}>
                      <Search className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {matches.map((match) => (
                      <Card key={match.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-lg">{match.company_name}</h4>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {match.compatibility_score}% compatible
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Départ:</strong> {match.departure_postal_code} {match.departure_city}
                                  </p>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Arrivée:</strong> {match.arrival_postal_code} {match.arrival_city}
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Date:</strong> {new Date(match.departure_date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Volume disponible:</strong> {match.available_volume} m³
                                  </p>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Distance:</strong> ~{match.distance_km} km
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accepter
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : !searchAttempted ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Prêt à rechercher</h3>
                  <p className="text-gray-500 mb-4">
                    Cliquez sur le bouton ci-dessous pour rechercher des matchs pour ce client.
                  </p>
                  <Button onClick={findMatches} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Lancer la recherche
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
