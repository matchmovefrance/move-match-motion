
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Calendar, Package, Truck, Target, CheckCircle, XCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMatchActions } from '@/hooks/useMatchActions';

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

// Fonction pour formater les volumes avec maximum 2 décimales
const formatVolume = (volume: number): string => {
  if (volume === 0) return '0';
  return Number(volume.toFixed(2)).toString();
};

// Cache partagé pour les distances
const distanceCache = new Map<string, number>();

// Fonction ultra-rapide pour calculer la distance
const calculateUltraFastDistance = async (
  fromPostal: string, 
  toPostal: string
): Promise<number> => {
  const cacheKey = `${fromPostal}-${toPostal}`;
  
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const apiKey = 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout encore plus court
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromPostal},France&destinations=${toPostal},France&units=metric&key=${apiKey}&mode=driving`,
      { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceInKm = Math.round(data.rows[0].elements[0].distance.value / 1000);
        distanceCache.set(cacheKey, distanceInKm);
        distanceCache.set(`${toPostal}-${fromPostal}`, distanceInKm);
        return distanceInKm;
      }
    }
    
    throw new Error('API error');
  } catch (error) {
    const fallbackDistance = calculateFallbackDistance(fromPostal, toPostal);
    distanceCache.set(cacheKey, fallbackDistance);
    return fallbackDistance;
  }
};

const calculateFallbackDistance = (postal1: string, postal2: string): number => {
  const lat1 = parseFloat(postal1.substring(0, 2)) + parseFloat(postal1.substring(2, 5)) / 1000;
  const lon1 = parseFloat(postal1.substring(0, 2)) * 0.5;
  const lat2 = parseFloat(postal2.substring(0, 2)) + parseFloat(postal2.substring(2, 5)) / 1000;
  const lon2 = parseFloat(postal2.substring(0, 2)) * 0.5;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c);
};

export const ClientMatchesDialog = ({ open, onOpenChange, clientId, clientName }: ClientMatchesDialogProps) => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
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
      console.log(`🚀 Recherche ULTRA-RAPIDE pour client ${clientId}...`);

      // Charger le client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Charger les trajets confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null);

      if (movesError) throw movesError;

      if (!movesData || movesData.length === 0) {
        setMatches([]);
        return;
      }

      console.log(`⚡ Traitement ULTRA-RAPIDE de ${movesData.length} trajets...`);
      const startTime = Date.now();

      // Traitement parallèle ultra-rapide
      const matchPromises = movesData.map(async (move) => {
        try {
          const [departureDistance, arrivalDistance] = await Promise.all([
            calculateUltraFastDistance(clientData.departure_postal_code, move.departure_postal_code),
            calculateUltraFastDistance(clientData.arrival_postal_code, move.arrival_postal_code)
          ]);

          const totalDistance = departureDistance + arrivalDistance;

          // Filtre précoce
          if (totalDistance > 100) return null;

          const clientDate = new Date(clientData.desired_date);
          const moveDate = new Date(move.departure_date);
          const dateDiff = Math.abs(clientDate.getTime() - moveDate.getTime()) / (1000 * 3600 * 24);

          const volumeNeeded = clientData.estimated_volume || 0;
          const volumeAvailable = (move.max_volume || 0) - (move.used_volume || 0);
          const volumeCompatible = volumeNeeded <= volumeAvailable;
          const availableVolumeAfter = Math.max(0, volumeAvailable - volumeNeeded);

          const isValid = 
            totalDistance <= 100 &&
            dateDiff <= 7 &&
            volumeCompatible;

          const matchScore = totalDistance + (dateDiff * 10) + (volumeCompatible ? 0 : 1000);

          return {
            move: {
              ...move,
              move_reference: `TRJ-${String(move.id).padStart(6, '0')}`,
              available_volume: volumeAvailable
            },
            distance_km: Math.round(totalDistance),
            date_diff_days: Math.round(dateDiff),
            volume_compatible: volumeCompatible,
            available_volume_after: availableVolumeAfter,
            match_score: matchScore,
            is_valid: isValid,
            match_reference: `MTH-${clientId}-${move.id}`
          };
        } catch (error) {
          console.error(`❌ Erreur trajet ${move.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(matchPromises);
      const validMatches = results.filter(Boolean) as MatchResult[];
      
      // Tri par score
      validMatches.sort((a, b) => a.match_score - b.match_score);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Matching ULTRA-RAPIDE terminé en ${processingTime}ms:`, {
        total: validMatches.length,
        valides: validMatches.filter(m => m.is_valid).length
      });

      setMatches(validMatches);

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

  const handleAcceptMatch = async (match: MatchResult) => {
    const matchData = {
      ...match,
      client: client!
    };
    
    const success = await acceptMatch(matchData);
    if (success) {
      await fetchClientAndMatches();
    }
  };

  const handleRejectMatch = async (match: MatchResult) => {
    const matchData = {
      ...match,
      client: client!
    };
    
    const success = await rejectMatch(matchData);
    if (success) {
      await fetchClientAndMatches();
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
            <span>Recherche ULTRA-RAPIDE ⚡ (≤ 100km)</span>
          </DialogTitle>
          <DialogDescription>
            Client: <strong>{clientName}</strong> 
            {client?.client_reference && (
              <span className="ml-2">({client.client_reference})</span>
            )}
            <div className="text-sm text-blue-600 mt-1">
              ⚡ Traitement parallélisé ultra-rapide avec cache intelligent
            </div>
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
                  <Badge variant="outline" className="font-mono">
                    {client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`}
                  </Badge>
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
                    <span><strong>Volume:</strong> {formatVolume(client.estimated_volume)}m³</span>
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
              placeholder="Rechercher par référence trajet (TRJ-XXXXXX), transporteur, codes postaux..."
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
                <p>⚡ Traitement ULTRA-RAPIDE en cours...</p>
                <p className="text-xs text-gray-500 mt-1">Cache intelligent + parallélisation</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium">Aucune correspondance ≤ 100km trouvée</p>
                <p className="text-sm mt-2">
                  {matches.length === 0 
                    ? "Aucun trajet compatible dans un rayon de 100km"
                    : "Ajustez vos critères de recherche"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3 flex items-center justify-between">
                  <span>
                    {filteredMatches.length} correspondance(s) ≤ 100km • 
                    {filteredMatches.filter(m => m.is_valid).length} valide(s)
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ⚡ ULTRA-RAPIDE
                  </span>
                </div>
                
                {filteredMatches.map((match, index) => (
                  <Card 
                    key={`${match.move.id}-${index}`}
                    className={`${match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="font-mono">
                            {match.move.move_reference}
                          </Badge>
                          <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {match.is_valid ? 'Compatible' : 'Partiel'}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-mono">
                            {match.match_reference}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {match.is_valid && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptMatch(match)}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accepter devis
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectMatch(match)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser devis
                              </Button>
                            </>
                          )}
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
                          <span><strong>{match.distance_km}km</strong> (Cache)</span>
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
                            <strong>Volume:</strong> {formatVolume(client?.estimated_volume || 0)}m³ / {formatVolume(match.move.available_volume)}m³
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4 text-orange-600" />
                          <span><strong>Reste:</strong> {formatVolume(match.available_volume_after)}m³</span>
                        </div>
                      </div>

                      {!match.is_valid && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                          <strong>Raisons de non-compatibilité:</strong>
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
