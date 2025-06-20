import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMatchActions } from '@/hooks/useMatchActions';
import { MovingMatchingService, type MatchResult } from '@/services/MovingMatchingService';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_reference?: string;
  created_at: string;
  created_by: string;
  departure_city?: string;
  departure_postal_code: string;
  arrival_city?: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume?: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  is_matched?: boolean;
  match_status?: string;
}

interface ClientMatchesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export const ClientMatchesDialog = ({ isOpen, onClose, client }: ClientMatchesDialogProps) => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
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

    console.log('🚀 Début recherche de matchs professionnels pour client:', {
      reference: client.client_reference,
      departure: `${client.departure_postal_code} ${client.departure_city}`,
      arrival: `${client.arrival_postal_code} ${client.arrival_city}`
    });

    setLoading(true);
    setSearchAttempted(true);
    
    try {
      const foundMatches = await MovingMatchingService.findMatchesForClient({
        id: client.id,
        name: client.name,
        departure_postal_code: client.departure_postal_code,
        arrival_postal_code: client.arrival_postal_code,
        departure_city: client.departure_city,
        arrival_city: client.arrival_city,
        desired_date: client.desired_date,
        estimated_volume: client.estimated_volume,
        client_reference: client.client_reference
      });

      setMatches(foundMatches);
      
      toast({
        title: "Recherche terminée",
        description: `${foundMatches.length} match(s) trouvé(s) (${foundMatches.filter(m => m.is_valid).length} valides)`,
      });

      console.log('✅ Matchs professionnels trouvés:', foundMatches.length);

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

  const handleAcceptMatch = async (match: MatchResult) => {
    if (!client) {
      console.log('❌ Pas de client pour accepter le match');
      return;
    }

    console.log('✅ Tentative d\'acceptation du match:', match.match_reference);
    
    // Convertir MatchResult vers le format attendu par useMatchActions
    const matchData = {
      match_reference: match.match_reference,
      client: client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
        departure_city: match.move.departure_city,
        arrival_city: match.move.arrival_city,
        departure_date: match.move.departure_date,
        available_volume: match.move.available_volume,
        used_volume: match.move.used_volume
      },
      distance_km: match.distance_km,
      date_diff_days: match.date_diff_days,
      volume_compatible: match.volume_compatible,
      available_volume_after: match.available_volume_after,
      is_valid: match.is_valid
    };

    const success = await acceptMatch(matchData);
    if (success) {
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleRejectMatch = async (match: MatchResult) => {
    if (!client) {
      console.log('❌ Pas de client pour rejeter le match');
      return;
    }

    console.log('❌ Tentative de rejet du match:', match.match_reference);
    
    // Convertir MatchResult vers le format attendu par useMatchActions
    const matchData = {
      match_reference: match.match_reference,
      client: client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
        departure_city: match.move.departure_city,
        arrival_city: match.move.arrival_city,
        departure_date: match.move.departure_date,
        available_volume: match.move.available_volume,
        used_volume: match.move.used_volume
      },
      distance_km: match.distance_km,
      date_diff_days: match.date_diff_days,
      volume_compatible: match.volume_compatible,
      is_valid: match.is_valid
    };

    const success = await rejectMatch(matchData);
    if (success) {
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  if (!client) {
    console.log('❌ ClientMatchesDialog: Pas de client');
    return null;
  }

  const validationError = validateClientData(client);

  const getMatchTypeLabel = (matchType: MatchResult['match_type']) => {
    switch (matchType) {
      case 'direct_outbound': return 'Trajet direct';
      case 'direct_return': return 'Trajet retour';
      case 'pickup_on_route': return 'Prise en route';
      case 'delivery_on_route': return 'Livraison en route';
      default: return 'Autre';
    }
  };

  const getMatchTypeColor = (matchType: MatchResult['match_type']) => {
    switch (matchType) {
      case 'direct_outbound': return 'bg-green-100 text-green-800';
      case 'direct_return': return 'bg-blue-100 text-blue-800';
      case 'pickup_on_route': return 'bg-orange-100 text-orange-800';
      case 'delivery_on_route': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <span>Recherche de matchs professionnels en cours...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.length === 0 && searchAttempted ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun match trouvé</h3>
                  <p className="text-gray-500 mb-4">
                    Aucun trajet compatible trouvé dans un rayon de 100km et 7 jours.
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
                      {matches.length} match(s) trouvé(s) ({matches.filter(m => m.is_valid).length} valides)
                    </h3>
                    <Button variant="outline" onClick={findMatches} disabled={loading}>
                      <Search className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {matches.map((match, index) => (
                      <Card key={`${match.match_reference}-${index}`} className={`border ${match.is_valid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-lg">{match.move.company_name}</h4>
                                <Badge className={getMatchTypeColor(match.match_type)}>
                                  {getMatchTypeLabel(match.match_type)}
                                </Badge>
                                <Badge variant="outline" className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                  {match.is_valid ? 'Compatible' : 'Incompatible'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-2">
                                {match.explanation}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Départ:</strong> {match.move.departure_postal_code} {match.move.departure_city}
                                  </p>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Arrivée:</strong> {match.move.arrival_postal_code} {match.move.arrival_city}
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Date:</strong> {new Date(match.move.departure_date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Volume disponible:</strong> {match.move.available_volume} m³
                                  </p>
                                  <p className="text-gray-600 mb-1">
                                    <strong>Distance:</strong> {match.distance_km} km
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Écart date:</strong> ±{match.date_diff_days} jours
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptMatch(match)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {actionLoading ? 'Traitement...' : 'Accepter'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRejectMatch(match)}
                                disabled={actionLoading}
                              >
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
                    Cliquez sur le bouton ci-dessous pour rechercher des matchs professionnels.
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
