
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, MapPin, Calendar, Volume2, Truck, Target, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MapPopup from './MapPopup';

interface ClientMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

interface Match {
  id: number;
  match_type: string;
  volume_ok: boolean;
  combined_volume: number;
  distance_km: number;
  date_diff_days: number;
  is_valid: boolean;
  created_at: string;
  confirmed_move: {
    company_name: string;
    mover_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    available_volume: number;
  } | null;
}

export const ClientMatchesDialog = ({ open, onOpenChange, clientId, clientName }: ClientMatchesDialogProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [selectedMatchForMap, setSelectedMatchForMap] = useState<Match | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && clientId) {
      fetchMatches();
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('departure_postal_code, arrival_postal_code, departure_city, arrival_city, desired_date, name')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    setShowRadar(true);
    
    // Animation radar pendant 2 secondes
    setTimeout(() => setShowRadar(false), 2000);

    try {
      const { data, error } = await supabase
        .from('move_matches')
        .select(`
          *,
          confirmed_move:confirmed_moves(
            company_name,
            mover_name,
            departure_postal_code,
            arrival_postal_code,
            departure_city,
            arrival_city,
            departure_date,
            available_volume
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const cleanedMatches = data?.map(match => ({
        ...match,
        confirmed_move: Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move
      })) || [];
      
      setMatches(cleanedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptMatch = async (matchId: number) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'confirmed',
          match_status: 'accepted',
          is_matched: true,
          matched_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Match accepté",
        description: "La correspondance a été acceptée",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error accepting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter le match",
        variant: "destructive",
      });
    }
  };

  const rejectMatch = async (matchId: number) => {
    try {
      const { error } = await supabase
        .from('move_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Match rejeté",
        description: "La correspondance a été supprimée",
      });

      fetchMatches();
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le match",
        variant: "destructive",
      });
    }
  };

  const markAsCompleted = async (matchId: number) => {
    try {
      // Mettre à jour le statut du client comme terminé
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'completed',
          match_status: 'completed'
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Match terminé",
        description: "Le déménagement a été marqué comme terminé",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme terminé",
        variant: "destructive",
      });
    }
  };

  const showOnMap = (match: Match) => {
    setSelectedMatchForMap(match);
    setShowMapPopup(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Correspondances pour {clientName}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Animation radar */}
          {showRadar && (
            <motion.div
              className="flex items-center justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 border-4 border-blue-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <Radar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
              </div>
              <span className="ml-4 text-lg font-medium">Recherche de correspondances...</span>
            </motion.div>
          )}

          {/* Résultats */}
          {!showRadar && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune correspondance trouvée pour ce client</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      {matches.length} correspondance{matches.length > 1 ? 's' : ''} trouvée{matches.length > 1 ? 's' : ''}
                    </h3>
                  </div>
                  
                  {matches.map((match) => (
                    <Card key={match.id} className={`${match.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Truck className="h-5 w-5" />
                            <span>{match.confirmed_move?.company_name}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={match.is_valid ? 'default' : 'secondary'}>
                              {match.is_valid ? 'Valide' : 'Non valide'}
                            </Badge>
                            <Badge variant="outline">
                              MTH-{String(match.id).padStart(6, '0')}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              {match.confirmed_move?.departure_postal_code} {match.confirmed_move?.departure_city}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span className="text-sm">
                              {match.confirmed_move?.arrival_postal_code} {match.confirmed_move?.arrival_city}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">
                              {match.confirmed_move?.departure_date ? 
                                new Date(match.confirmed_move.departure_date).toLocaleDateString('fr-FR') : 
                                'Date non définie'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">
                              Volume disponible: {match.confirmed_move?.available_volume || 0} m³
                            </span>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Distance: {match.distance_km} km</div>
                            <div>Différence de dates: {match.date_diff_days} jours</div>
                            <div>Type de match: {match.match_type}</div>
                          </div>
                        </div>

                        {match.is_valid && (
                          <div className="flex space-x-2 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => acceptMatch(match.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => showOnMap(match)}
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Voir sur carte
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsCompleted(match.id)}
                            >
                              Marquer terminé
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMatch(match.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Popup de carte */}
      {showMapPopup && selectedMatchForMap && (
        <MapPopup
          isOpen={showMapPopup}
          onClose={() => setShowMapPopup(false)}
          clientData={clientData}
          matchData={selectedMatchForMap}
        />
      )}
    </>
  );
};
