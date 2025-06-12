
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Calendar, Package, Truck, Target, Eye, CheckCircle, XCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pricingEngine } from '@/pages/PricingTool/components/PricingEngine';

interface ClientMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

interface Client {
  id: number;
  name: string;
  client_reference?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
}

interface ConfirmedMove {
  id: number;
  company_name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  status: string;
  move_reference?: string;
}

interface MatchResult {
  move: ConfirmedMove;
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  match_score: number;
  is_valid: boolean;
  match_reference?: string;
}

export const ClientMatchesDialog = ({ open, onOpenChange, clientId, clientName }: ClientMatchesDialogProps) => {
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open && clientId) {
      fetchClientAndMatches();
    }
  }, [open, clientId]);

  const fetchClientAndMatches = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Recherche matches pour client ${clientId}...`);

      // Charger le client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      console.log('✅ Client chargé:', clientData);
      setClient(clientData);

      // Charger les trajets confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null);

      if (movesError) throw movesError;

      console.log('📦 Trajets confirmés:', movesData?.length || 0);

      if (!movesData || movesData.length === 0) {
        setMatches([]);
        return;
      }

      // Calculer les matches avec distances exactes
      const matchResults: MatchResult[] = [];

      for (const move of movesData) {
        try {
          // Calculer la distance exacte via Google Maps
          const distance = await pricingEngine.getExactDistance(
            clientData.departure_postal_code,
            move.departure_postal_code
          );

          const arrivalDistance = await pricingEngine.getExactDistance(
            clientData.arrival_postal_code,
            move.arrival_postal_code
          );

          const totalDistance = distance + arrivalDistance;

          // Calculer la différence de dates
          const clientDate = new Date(clientData.desired_date);
          const moveDate = new Date(move.departure_date);
          const dateDiff = Math.abs(clientDate.getTime() - moveDate.getTime()) / (1000 * 3600 * 24);

          // Vérifier la compatibilité du volume - CORRECTION DE LA LOGIQUE
          const volumeNeeded = clientData.estimated_volume || 0;
          const volumeAvailable = (move.max_volume || 0) - (move.used_volume || 0);
          const volumeCompatible = volumeNeeded <= volumeAvailable;
          const availableVolumeAfter = volumeAvailable - volumeNeeded;

          // Critères de validation cohérents
          const isValid = 
            totalDistance <= 100 && // Max 100km de distance totale
            dateDiff <= 7 &&        // Max 7 jours de différence
            volumeCompatible;       // Volume compatible

          // Calculer un score de match (plus c'est bas, mieux c'est)
          const matchScore = totalDistance + (dateDiff * 10) + (volumeCompatible ? 0 : 1000);

          const matchResult: MatchResult = {
            move: {
              ...move,
              move_reference: `TRJ-${String(move.id).padStart(6, '0')}`,
              available_volume: volumeAvailable
            },
            distance_km: Math.round(totalDistance),
            date_diff_days: Math.round(dateDiff),
            volume_compatible: volumeCompatible,
            available_volume_after: Math.max(0, availableVolumeAfter),
            match_score: matchScore,
            is_valid: isValid,
            match_reference: `MTH-${clientId}-${move.id}`
          };

          matchResults.push(matchResult);

          console.log(`📊 Match calculé: TRJ-${move.id}, Distance: ${totalDistance}km, Volume: ${volumeCompatible ? '✓' : '✗'} (${volumeNeeded}/${volumeAvailable}), Valide: ${isValid}`);

        } catch (error) {
          console.error(`❌ Erreur calcul match pour trajet ${move.id}:`, error);
        }
      }

      // Trier par score (meilleurs matches en premier)
      matchResults.sort((a, b) => a.match_score - b.match_score);

      console.log('✅ Matches calculés:', {
        total: matchResults.length,
        valides: matchResults.filter(m => m.is_valid).length
      });

      setMatches(matchResults);

    } catch (error) {
      console.error('❌ Erreur recherche matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMatch = async (matchResult: MatchResult) => {
    try {
      console.log('💾 Sauvegarde du match:', matchResult.match_reference);

      const { error } = await supabase
        .from('move_matches')
        .insert({
          client_id: clientId,
          move_id: matchResult.move.id,
          match_type: matchResult.is_valid ? 'perfect' : 'partial',
          volume_ok: matchResult.volume_compatible,
          combined_volume: matchResult.available_volume_after,
          distance_km: matchResult.distance_km,
          date_diff_days: matchResult.date_diff_days,
          is_valid: matchResult.is_valid
        });

      if (error) throw error;

      toast({
        title: "Match sauvegardé",
        description: `Correspondance ${matchResult.match_reference} enregistrée`,
      });

    } catch (error) {
      console.error('❌ Erreur sauvegarde match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le match",
        variant: "destructive",
      });
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.move.company_name?.toLowerCase().includes(searchLower) ||
      match.move.move_reference?.toLowerCase().includes(searchLower) ||
      match.match_reference?.toLowerCase().includes(searchLower) ||
      match.move.departure_postal_code?.includes(searchTerm) ||
      match.move.arrival_postal_code?.includes(searchTerm)
    );
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Recherche de correspondances</span>
          </DialogTitle>
          <DialogDescription>
            Client: <strong>{clientName}</strong> 
            {client?.client_reference && (
              <span className="ml-2">({client.client_reference})</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du client */}
          {client && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Demande client</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span><strong>Départ:</strong> {client.departure_postal_code}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span><strong>Arrivée:</strong> {client.arrival_postal_code}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span><strong>Date:</strong> {new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span><strong>Volume:</strong> {client.estimated_volume}m³</span>
                  </div>
                </div>
                {client.flexible_dates && client.flexibility_days && (
                  <div className="mt-2 text-sm text-blue-600">
                    <strong>Flexibilité:</strong> ±{client.flexibility_days} jours
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par référence trajet, transporteur, codes postaux..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Résultats des matches */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Recherche de correspondances avec distances exactes...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium">Aucune correspondance trouvée</p>
                <p className="text-sm mt-2">
                  {matches.length === 0 
                    ? "Aucun trajet compatible disponible"
                    : "Ajustez vos critères de recherche"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  {filteredMatches.length} correspondance(s) trouvée(s) • 
                  {filteredMatches.filter(m => m.is_valid).length} valide(s)
                </div>
                
                {filteredMatches.map((match, index) => (
                  <Card 
                    key={`${match.move.id}-${index}`}
                    className={`${match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {match.move.move_reference}
                          </Badge>
                          <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {match.is_valid ? 'Compatible' : 'Partiel'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {match.match_reference}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveMatch(match)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Sauvegarder
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Transporteur:</span>
                          <p className="font-medium">{match.move.company_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Trajet:</span>
                          <p>{match.move.departure_postal_code} → {match.move.arrival_postal_code}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date départ:</span>
                          <p>{new Date(match.move.departure_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span><strong>{match.distance_km}km</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span><strong>±{match.date_diff_days}j</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {match.volume_compatible ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>
                            <strong>Volume:</strong> {client?.estimated_volume || 0}m³ / {match.move.available_volume}m³
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4 text-orange-600" />
                          <span><strong>Reste:</strong> {match.available_volume_after}m³</span>
                        </div>
                      </div>

                      {!match.is_valid && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                          <strong>Raisons de non-compatibilité:</strong>
                          {match.distance_km > 100 && ' Distance > 100km •'}
                          {match.date_diff_days > 7 && ' Écart dates > 7j •'}
                          {!match.volume_compatible && ' Volume insuffisant'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
